import { randomUUID } from "crypto";
import type {
  User,
  InsertUser,
  Hospital,
  InsertHospital,
  Doctor,
  InsertDoctor,
  Patient,
  InsertPatient,
  Medicine,
  InsertMedicine,
  Prescription,
  InsertPrescription,
  MedicineStatus,
  InsertMedicineStatus,
  Reminder,
  InsertReminder,
  AiConversation,
  InsertAiConversation,
  ComplianceStats,
  InsertComplianceStats,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  
  // Hospitals
  getHospital(id: string): Promise<Hospital | undefined>;
  getHospitals(): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: string, hospital: Partial<InsertHospital>): Promise<Hospital>;
  
  // Doctors
  getDoctor(id: string): Promise<Doctor | undefined>;
  getDoctorByUserId(userId: string): Promise<Doctor | undefined>;
  getDoctorsByHospital(hospitalId: string): Promise<Doctor[]>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  
  // Patients
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByUserId(userId: string): Promise<Patient | undefined>;
  getPatientsByHospital(hospitalId: string): Promise<Patient[]>;
  getPatientsByDoctor(doctorId: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  
  // Medicines
  getMedicine(id: string): Promise<Medicine | undefined>;
  getMedicines(): Promise<Medicine[]>;
  searchMedicines(query: string): Promise<Medicine[]>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  
  // Prescriptions
  getPrescription(id: string): Promise<Prescription | undefined>;
  getPrescriptionsByPatient(patientId: string): Promise<Prescription[]>;
  getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: string, prescription: Partial<InsertPrescription>): Promise<Prescription>;
  
  // Medicine Status
  getMedicineStatus(id: string): Promise<MedicineStatus | undefined>;
  getMedicineStatusByPrescription(prescriptionId: string): Promise<MedicineStatus[]>;
  getMedicineStatusByPatient(patientId: string): Promise<MedicineStatus[]>;
  createMedicineStatus(status: InsertMedicineStatus): Promise<MedicineStatus>;
  updateMedicineStatus(id: string, status: Partial<InsertMedicineStatus>): Promise<MedicineStatus>;
  
  // Reminders
  getReminder(id: string): Promise<Reminder | undefined>;
  getPendingReminders(): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: string, reminder: Partial<InsertReminder>): Promise<Reminder>;
  
  // AI Conversations
  getAiConversation(id: string): Promise<AiConversation | undefined>;
  getAiConversationsByPatient(patientId: string): Promise<AiConversation[]>;
  createAiConversation(conversation: InsertAiConversation): Promise<AiConversation>;
  
  // Compliance Stats
  getComplianceStats(patientId: string, date: Date): Promise<ComplianceStats | undefined>;
  getComplianceStatsByPatient(patientId: string): Promise<ComplianceStats[]>;
  createComplianceStats(stats: InsertComplianceStats): Promise<ComplianceStats>;
  updateComplianceStats(id: string, stats: Partial<InsertComplianceStats>): Promise<ComplianceStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private hospitals: Map<string, Hospital> = new Map();
  private doctors: Map<string, Doctor> = new Map();
  private patients: Map<string, Patient> = new Map();
  private medicines: Map<string, Medicine> = new Map();
  private prescriptions: Map<string, Prescription> = new Map();
  private medicineStatuses: Map<string, MedicineStatus> = new Map();
  private reminders: Map<string, Reminder> = new Map();
  private aiConversations: Map<string, AiConversation> = new Map();
  private complianceStats: Map<string, ComplianceStats> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed some initial data for demo
    const superAdminId = randomUUID();
    const hospitalAdminId = randomUUID();
    const doctorUserId = randomUUID();
    const patientUserId = randomUUID();
    const hospitalId = randomUUID();
    const doctorId = randomUUID();
    const patientId = randomUUID();
    const medicineId = randomUUID();

    // Users
    this.users.set(superAdminId, {
      id: superAdminId,
      email: "admin@medicare.com",
      name: "Super Admin",
      role: "super_admin",
      phoneNumber: "+1234567890",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.set(hospitalAdminId, {
      id: hospitalAdminId,
      email: "hospital.admin@medicare.com",
      name: "Hospital Admin",
      role: "hospital_admin",
      phoneNumber: "+1234567891",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.set(doctorUserId, {
      id: doctorUserId,
      email: "dr.johnson@medicare.com",
      name: "Dr. Sarah Johnson",
      role: "doctor",
      phoneNumber: "+1234567892",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.users.set(patientUserId, {
      id: patientUserId,
      email: "john.smith@email.com",
      name: "John Smith",
      role: "patient",
      phoneNumber: "+1234567893",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Hospital
    this.hospitals.set(hospitalId, {
      id: hospitalId,
      name: "MediCare Plus Hospital",
      address: "123 Health Street, Medical City",
      phoneNumber: "+1234567890",
      adminId: hospitalAdminId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Doctor
    this.doctors.set(doctorId, {
      id: doctorId,
      userId: doctorUserId,
      hospitalId: hospitalId,
      specialization: "Cardiology",
      licenseNumber: "MD123456",
      isActive: true,
      createdAt: new Date(),
    });

    // Patient
    this.patients.set(patientId, {
      id: patientId,
      userId: patientUserId,
      hospitalId: hospitalId,
      dateOfBirth: new Date("1980-01-15"),
      gender: "male",
      address: "456 Patient Lane, Health City",
      emergencyContact: "+1234567894",
      medicalHistory: { conditions: ["hypertension"], allergies: ["penicillin"] },
      createdAt: new Date(),
    });

    // Medicine
    this.medicines.set(medicineId, {
      id: medicineId,
      name: "Metformin",
      genericName: "Metformin Hydrochloride",
      strength: "500mg",
      form: "tablet",
      manufacturer: "PharmaCorp",
      sideEffects: ["nausea", "diarrhea", "stomach upset"],
      contraindications: ["kidney disease", "liver disease"],
      description: "Medication for type 2 diabetes",
      createdAt: new Date(),
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updateData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Hospitals
  async getHospital(id: string): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }

  async getHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  async createHospital(insertHospital: InsertHospital): Promise<Hospital> {
    const id = randomUUID();
    const hospital: Hospital = {
      ...insertHospital,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hospitals.set(id, hospital);
    return hospital;
  }

  async updateHospital(id: string, updateData: Partial<InsertHospital>): Promise<Hospital> {
    const hospital = this.hospitals.get(id);
    if (!hospital) throw new Error("Hospital not found");
    
    const updatedHospital = { ...hospital, ...updateData, updatedAt: new Date() };
    this.hospitals.set(id, updatedHospital);
    return updatedHospital;
  }

  // Doctors
  async getDoctor(id: string): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }

  async getDoctorByUserId(userId: string): Promise<Doctor | undefined> {
    return Array.from(this.doctors.values()).find(doctor => doctor.userId === userId);
  }

  async getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
    return Array.from(this.doctors.values()).filter(doctor => doctor.hospitalId === hospitalId);
  }

  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = randomUUID();
    const doctor: Doctor = {
      ...insertDoctor,
      id,
      createdAt: new Date(),
    };
    this.doctors.set(id, doctor);
    return doctor;
  }

  // Patients
  async getPatient(id: string): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async getPatientByUserId(userId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(patient => patient.userId === userId);
  }

  async getPatientsByHospital(hospitalId: string): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(patient => patient.hospitalId === hospitalId);
  }

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    const prescriptions = Array.from(this.prescriptions.values()).filter(p => p.doctorId === doctorId);
    const patientIds = new Set(prescriptions.map(p => p.patientId));
    return Array.from(this.patients.values()).filter(patient => patientIds.has(patient.id));
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = {
      ...insertPatient,
      id,
      createdAt: new Date(),
    };
    this.patients.set(id, patient);
    return patient;
  }

  // Medicines
  async getMedicine(id: string): Promise<Medicine | undefined> {
    return this.medicines.get(id);
  }

  async getMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values());
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.medicines.values()).filter(medicine =>
      medicine.name.toLowerCase().includes(lowercaseQuery) ||
      medicine.genericName?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const id = randomUUID();
    const medicine: Medicine = {
      ...insertMedicine,
      id,
      createdAt: new Date(),
    };
    this.medicines.set(id, medicine);
    return medicine;
  }

  // Prescriptions
  async getPrescription(id: string): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.patientId === patientId);
  }

  async getPrescriptionsByDoctor(doctorId: string): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(p => p.doctorId === doctorId);
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = randomUUID();
    const prescription: Prescription = {
      ...insertPrescription,
      id,
      createdAt: new Date(),
    };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async updatePrescription(id: string, updateData: Partial<InsertPrescription>): Promise<Prescription> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) throw new Error("Prescription not found");
    
    const updatedPrescription = { ...prescription, ...updateData };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }

  // Medicine Status
  async getMedicineStatus(id: string): Promise<MedicineStatus | undefined> {
    return this.medicineStatuses.get(id);
  }

  async getMedicineStatusByPrescription(prescriptionId: string): Promise<MedicineStatus[]> {
    return Array.from(this.medicineStatuses.values()).filter(s => s.prescriptionId === prescriptionId);
  }

  async getMedicineStatusByPatient(patientId: string): Promise<MedicineStatus[]> {
    const prescriptions = await this.getPrescriptionsByPatient(patientId);
    const prescriptionIds = new Set(prescriptions.map(p => p.id));
    return Array.from(this.medicineStatuses.values()).filter(s => prescriptionIds.has(s.prescriptionId));
  }

  async createMedicineStatus(insertStatus: InsertMedicineStatus): Promise<MedicineStatus> {
    const id = randomUUID();
    const status: MedicineStatus = {
      ...insertStatus,
      id,
      createdAt: new Date(),
    };
    this.medicineStatuses.set(id, status);
    return status;
  }

  async updateMedicineStatus(id: string, updateData: Partial<InsertMedicineStatus>): Promise<MedicineStatus> {
    const status = this.medicineStatuses.get(id);
    if (!status) throw new Error("Medicine status not found");
    
    const updatedStatus = { ...status, ...updateData };
    this.medicineStatuses.set(id, updatedStatus);
    return updatedStatus;
  }

  // Reminders
  async getReminder(id: string): Promise<Reminder | undefined> {
    return this.reminders.get(id);
  }

  async getPendingReminders(): Promise<Reminder[]> {
    return Array.from(this.reminders.values()).filter(r => r.status === "pending");
  }

  async createReminder(insertReminder: InsertReminder): Promise<Reminder> {
    const id = randomUUID();
    const reminder: Reminder = {
      ...insertReminder,
      id,
      createdAt: new Date(),
    };
    this.reminders.set(id, reminder);
    return reminder;
  }

  async updateReminder(id: string, updateData: Partial<InsertReminder>): Promise<Reminder> {
    const reminder = this.reminders.get(id);
    if (!reminder) throw new Error("Reminder not found");
    
    const updatedReminder = { ...reminder, ...updateData };
    this.reminders.set(id, updatedReminder);
    return updatedReminder;
  }

  // AI Conversations
  async getAiConversation(id: string): Promise<AiConversation | undefined> {
    return this.aiConversations.get(id);
  }

  async getAiConversationsByPatient(patientId: string): Promise<AiConversation[]> {
    return Array.from(this.aiConversations.values()).filter(c => c.patientId === patientId);
  }

  async createAiConversation(insertConversation: InsertAiConversation): Promise<AiConversation> {
    const id = randomUUID();
    const conversation: AiConversation = {
      ...insertConversation,
      id,
      createdAt: new Date(),
    };
    this.aiConversations.set(id, conversation);
    return conversation;
  }

  // Compliance Stats
  async getComplianceStats(patientId: string, date: Date): Promise<ComplianceStats | undefined> {
    return Array.from(this.complianceStats.values()).find(s => 
      s.patientId === patientId && 
      s.date.toDateString() === date.toDateString()
    );
  }

  async getComplianceStatsByPatient(patientId: string): Promise<ComplianceStats[]> {
    return Array.from(this.complianceStats.values()).filter(s => s.patientId === patientId);
  }

  async createComplianceStats(insertStats: InsertComplianceStats): Promise<ComplianceStats> {
    const id = randomUUID();
    const stats: ComplianceStats = {
      ...insertStats,
      id,
      createdAt: new Date(),
    };
    this.complianceStats.set(id, stats);
    return stats;
  }

  async updateComplianceStats(id: string, updateData: Partial<InsertComplianceStats>): Promise<ComplianceStats> {
    const stats = this.complianceStats.get(id);
    if (!stats) throw new Error("Compliance stats not found");
    
    const updatedStats = { ...stats, ...updateData };
    this.complianceStats.set(id, updatedStats);
    return updatedStats;
  }
}

export const storage = new MemStorage();
