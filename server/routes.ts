import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getAIResponse, categorizePatientQuery } from "./services/openai";
import { sendSMSReminder, generateMedicineReminderMessage, generateUrgentReminderMessage } from "./services/twilio";
import { 
  insertUserSchema, 
  insertHospitalSchema, 
  insertDoctorSchema, 
  insertPatientSchema,
  insertMedicineSchema,
  insertPrescriptionSchema,
  insertMedicineStatusSchema,
  insertAiConversationSchema
} from "@shared/schema";

// Middleware for authentication (simplified for demo)
const requireAuth = (req: any, res: any, next: any) => {
  // In a real app, this would verify JWT tokens or session
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.userId = userId;
  next();
};

const requireRole = (roles: string[]) => {
  return async (req: any, res: any, next: any) => {
    const user = await storage.getUser(req.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    req.user = user;
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({ user, token: user.id }); // Simplified token
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User routes
  app.get("/api/users/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/users", requireAuth, requireRole(["super_admin", "hospital_admin"]), async (req: any, res) => {
    try {
      const { role, hospitalId } = req.query;
      let users = await storage.getUsers();
      
      if (role) {
        users = users.filter(user => user.role === role);
      }
      
      // Filter by hospital for hospital_admin
      if (req.user.role === "hospital_admin" && hospitalId) {
        const hospital = await storage.getHospital(hospitalId as string);
        if (hospital?.adminId !== req.user.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["super_admin", "hospital_admin"]), async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  // Hospital routes
  app.get("/api/hospitals", requireAuth, async (req: any, res) => {
    try {
      let hospitals = await storage.getHospitals();
      
      // Filter for hospital_admin to only see their hospital
      if (req.user?.role === "hospital_admin") {
        hospitals = hospitals.filter(h => h.adminId === req.user.id);
      }
      
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get hospitals" });
    }
  });

  app.post("/api/hospitals", requireAuth, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const hospitalData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(hospitalData);
      res.status(201).json(hospital);
    } catch (error) {
      res.status(400).json({ error: "Failed to create hospital" });
    }
  });

  app.put("/api/hospitals/:id", requireAuth, requireRole(["super_admin"]), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const hospital = await storage.updateHospital(id, updates);
      res.json(hospital);
    } catch (error) {
      res.status(400).json({ error: "Failed to update hospital" });
    }
  });

  // Doctor routes
  app.get("/api/doctors", requireAuth, async (req: any, res) => {
    try {
      const { hospitalId, userId } = req.query;
      let doctors = [];
      
      if (userId) {
        const doctor = await storage.getDoctorByUserId(userId as string);
        doctors = doctor ? [doctor] : [];
      } else if (hospitalId) {
        doctors = await storage.getDoctorsByHospital(hospitalId as string);
      }
      
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Failed to get doctors" });
    }
  });

  app.post("/api/doctors", requireAuth, requireRole(["super_admin", "hospital_admin"]), async (req: any, res) => {
    try {
      const doctorData = insertDoctorSchema.parse(req.body);
      const doctor = await storage.createDoctor(doctorData);
      res.status(201).json(doctor);
    } catch (error) {
      res.status(400).json({ error: "Failed to create doctor" });
    }
  });

  // Patient routes
  app.get("/api/patients", requireAuth, async (req: any, res) => {
    try {
      const { hospitalId, doctorId, userId } = req.query;
      let patients = [];
      
      if (userId) {
        const patient = await storage.getPatientByUserId(userId as string);
        patients = patient ? [patient] : [];
      } else if (doctorId) {
        patients = await storage.getPatientsByDoctor(doctorId as string);
      } else if (hospitalId) {
        patients = await storage.getPatientsByHospital(hospitalId as string);
      }
      
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to get patients" });
    }
  });

  app.post("/api/patients", requireAuth, requireRole(["doctor", "hospital_admin"]), async (req: any, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: "Failed to create patient" });
    }
  });

  // Medicine routes
  app.get("/api/medicines", requireAuth, async (req: any, res) => {
    try {
      const { search } = req.query;
      const medicines = search 
        ? await storage.searchMedicines(search as string)
        : await storage.getMedicines();
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ error: "Failed to get medicines" });
    }
  });

  app.post("/api/medicines", requireAuth, requireRole(["doctor", "hospital_admin"]), async (req: any, res) => {
    try {
      const medicineData = insertMedicineSchema.parse(req.body);
      const medicine = await storage.createMedicine(medicineData);
      res.status(201).json(medicine);
    } catch (error) {
      res.status(400).json({ error: "Failed to create medicine" });
    }
  });

  // Prescription routes
  app.get("/api/prescriptions", requireAuth, async (req: any, res) => {
    try {
      const { patientId, doctorId } = req.query;
      let prescriptions = [];
      
      if (patientId) {
        prescriptions = await storage.getPrescriptionsByPatient(patientId as string);
      } else if (doctorId) {
        prescriptions = await storage.getPrescriptionsByDoctor(doctorId as string);
      }
      
      // Enrich prescriptions with medicine and patient details
      const enrichedPrescriptions = await Promise.all(
        prescriptions.map(async (prescription) => {
          const medicine = await storage.getMedicine(prescription.medicineId);
          const patient = await storage.getPatient(prescription.patientId);
          const patientUser = patient ? await storage.getUser(patient.userId) : null;
          
          return {
            ...prescription,
            medicine,
            patient: patient ? { ...patient, user: patientUser } : null,
          };
        })
      );
      
      res.json(enrichedPrescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get prescriptions" });
    }
  });

  app.post("/api/prescriptions", requireAuth, requireRole(["doctor"]), async (req: any, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(prescriptionData);
      
      // Create reminder schedule
      const patient = await storage.getPatient(prescription.patientId);
      const medicine = await storage.getMedicine(prescription.medicineId);
      const user = await storage.getUser(patient?.userId || "");
      
      if (patient && medicine && user && prescription.reminderTimes) {
        for (const time of prescription.reminderTimes) {
          const scheduledTime = new Date();
          const [hours, minutes] = time.split(":");
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          await storage.createReminder({
            prescriptionId: prescription.id,
            type: "sms",
            scheduledTime,
            status: "pending",
            message: generateMedicineReminderMessage(user.name, medicine.name, prescription.dosage),
          });
        }
      }
      
      res.status(201).json(prescription);
    } catch (error) {
      res.status(400).json({ error: "Failed to create prescription" });
    }
  });

  // Medicine status routes
  app.get("/api/medicine-status", requireAuth, async (req: any, res) => {
    try {
      const { patientId, prescriptionId, date } = req.query;
      let statuses = [];
      
      if (patientId) {
        statuses = await storage.getMedicineStatusByPatient(patientId as string);
      } else if (prescriptionId) {
        statuses = await storage.getMedicineStatusByPrescription(prescriptionId as string);
      }
      
      // Filter by date if provided
      if (date) {
        const filterDate = new Date(date as string);
        statuses = statuses.filter(status => 
          status.scheduledTime.toDateString() === filterDate.toDateString()
        );
      }
      
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to get medicine status" });
    }
  });

  app.post("/api/medicine-status", requireAuth, async (req: any, res) => {
    try {
      const statusData = insertMedicineStatusSchema.parse(req.body);
      const status = await storage.createMedicineStatus(statusData);
      
      // Update compliance stats
      const prescription = await storage.getPrescription(status.prescriptionId);
      if (prescription) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingStats = await storage.getComplianceStats(prescription.patientId, today);
        if (existingStats) {
          const updatedTaken = status.status === "taken" ? existingStats.takenDoses + 1 : existingStats.takenDoses;
          const updatedMissed = status.status === "missed" ? existingStats.missedDoses + 1 : existingStats.missedDoses;
          const complianceRate = Math.round((updatedTaken / (updatedTaken + updatedMissed)) * 100);
          
          await storage.updateComplianceStats(existingStats.id, {
            takenDoses: updatedTaken,
            missedDoses: updatedMissed,
            complianceRate,
          });
        } else {
          await storage.createComplianceStats({
            patientId: prescription.patientId,
            date: today,
            totalDoses: 1,
            takenDoses: status.status === "taken" ? 1 : 0,
            missedDoses: status.status === "missed" ? 1 : 0,
            complianceRate: status.status === "taken" ? 100 : 0,
          });
        }
      }
      
      res.status(201).json(status);
    } catch (error) {
      res.status(400).json({ error: "Failed to create medicine status" });
    }
  });

  app.put("/api/medicine-status/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const status = await storage.updateMedicineStatus(id, updates);
      res.json(status);
    } catch (error) {
      res.status(400).json({ error: "Failed to update medicine status" });
    }
  });

  // Reminder routes
  app.post("/api/reminders/send", requireAuth, requireRole(["doctor", "hospital_admin"]), async (req: any, res) => {
    try {
      const { patientId, message, type = "sms" } = req.body;
      
      const patient = await storage.getPatient(patientId);
      const user = await storage.getUser(patient?.userId || "");
      
      if (!patient || !user || !user.phoneNumber) {
        return res.status(404).json({ error: "Patient or phone number not found" });
      }

      const result = await sendSMSReminder({
        to: user.phoneNumber,
        message: message || "Please remember to take your medication as prescribed.",
      });

      if (result.success) {
        res.json({ success: true, messageId: result.messageId });
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to send reminder" });
    }
  });

  // AI Assistant routes
  app.post("/api/ai/chat", requireAuth, async (req: any, res) => {
    try {
      const { message, language, patientId } = req.body;
      
      let patientContext = {};
      if (patientId) {
        const patient = await storage.getPatient(patientId);
        const prescriptions = await storage.getPrescriptionsByPatient(patientId);
        const medicines = await Promise.all(
          prescriptions.map(p => storage.getMedicine(p.medicineId))
        );
        
        patientContext = {
          medicines: medicines.filter(Boolean).map(m => m!.name),
          medicalHistory: patient?.medicalHistory || {},
        };
      }

      const response = await getAIResponse({
        message,
        language,
        patientContext,
      });

      // Save conversation
      if (patientId) {
        await storage.createAiConversation({
          patientId,
          message,
          response: response.response,
          language: response.language,
          sentiment: response.sentiment,
          category: response.category,
        });
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "AI assistant failed" });
    }
  });

  app.get("/api/ai/conversations/:patientId", requireAuth, async (req: any, res) => {
    try {
      const { patientId } = req.params;
      const conversations = await storage.getAiConversationsByPatient(patientId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      let stats = {};

      if (user?.role === "super_admin") {
        const hospitals = await storage.getHospitals();
        const allUsers = await storage.getUsers();
        
        stats = {
          totalHospitals: hospitals.length,
          activeHospitals: hospitals.filter(h => h.isActive).length,
          totalUsers: allUsers.length,
          systemHealth: 98.5, // This would be calculated from actual metrics
        };
      } else if (user?.role === "hospital_admin") {
        const hospitals = await storage.getHospitals();
        const myHospital = hospitals.find(h => h.adminId === user.id);
        
        if (myHospital) {
          const doctors = await storage.getDoctorsByHospital(myHospital.id);
          const patients = await storage.getPatientsByHospital(myHospital.id);
          
          stats = {
            totalDoctors: doctors.length,
            totalPatients: patients.length,
            activeDoctors: doctors.filter(d => d.isActive).length,
            hospitalName: myHospital.name,
          };
        }
      } else if (user?.role === "doctor") {
        const doctor = await storage.getDoctorByUserId(user.id);
        if (doctor) {
          const patients = await storage.getPatientsByDoctor(doctor.id);
          const prescriptions = await storage.getPrescriptionsByDoctor(doctor.id);
          
          stats = {
            totalPatients: patients.length,
            activePrescriptions: prescriptions.filter(p => p.isActive).length,
            complianceRate: 87.5, // This would be calculated from actual data
            alerts: 12, // This would be calculated from actual alerts
          };
        }
      } else if (user?.role === "patient") {
        const patient = await storage.getPatientByUserId(user.id);
        if (patient) {
          const prescriptions = await storage.getPrescriptionsByPatient(patient.id);
          const medicineStatuses = await storage.getMedicineStatusByPatient(patient.id);
          
          const totalDoses = medicineStatuses.length;
          const takenDoses = medicineStatuses.filter(s => s.status === "taken").length;
          const complianceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 100;
          
          const todayStatuses = medicineStatuses.filter(s => 
            s.scheduledTime.toDateString() === new Date().toDateString()
          );
          
          stats = {
            activePrescriptions: prescriptions.filter(p => p.isActive).length,
            complianceRate: Math.round(complianceRate),
            todaysDoses: todayStatuses.length,
            takenToday: todayStatuses.filter(s => s.status === "taken").length,
          };
        }
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  // Compliance stats routes
  app.get("/api/compliance/stats/:patientId", requireAuth, async (req: any, res) => {
    try {
      const { patientId } = req.params;
      const { days = 7 } = req.query;
      
      const stats = await storage.getComplianceStatsByPatient(patientId);
      const recentStats = stats
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, parseInt(days as string));
      
      res.json(recentStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get compliance stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
