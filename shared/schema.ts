import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["super_admin", "hospital_admin", "doctor", "patient"] }).notNull(),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const hospitals = pgTable("hospitals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number").notNull(),
  adminId: uuid("admin_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const doctors = pgTable("doctors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  hospitalId: uuid("hospital_id").references(() => hospitals.id).notNull(),
  specialization: text("specialization"),
  licenseNumber: text("license_number").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  hospitalId: uuid("hospital_id").references(() => hospitals.id).notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  medicalHistory: jsonb("medical_history"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const medicines = pgTable("medicines", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  strength: text("strength"),
  form: text("form"), // tablet, capsule, syrup, injection
  manufacturer: text("manufacturer"),
  sideEffects: text("side_effects").array(),
  contraindications: text("contraindications").array(),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  medicineId: uuid("medicine_id").references(() => medicines.id).notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(), // once_daily, twice_daily, three_times_daily, as_needed
  duration: text("duration").notNull(),
  instructions: text("instructions"),
  reminderTimes: text("reminder_times").array(), // Array of time strings like ["08:00", "20:00"]
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const medicineStatus = pgTable("medicine_status", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: uuid("prescription_id").references(() => prescriptions.id).notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualTime: timestamp("actual_time"),
  status: text("status", { enum: ["taken", "missed", "pending"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  prescriptionId: uuid("prescription_id").references(() => prescriptions.id).notNull(),
  type: text("type", { enum: ["sms", "call", "notification"] }).notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  sentTime: timestamp("sent_time"),
  status: text("status", { enum: ["pending", "sent", "failed"] }).notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  language: text("language").default("en"),
  sentiment: text("sentiment"),
  category: text("category"), // medicine_timing, side_effects, dosage, general
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const complianceStats = pgTable("compliance_stats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  date: timestamp("date").notNull(),
  totalDoses: integer("total_doses").notNull(),
  takenDoses: integer("taken_doses").notNull(),
  missedDoses: integer("missed_doses").notNull(),
  complianceRate: integer("compliance_rate").notNull(), // percentage
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
});

export const insertMedicineStatusSchema = createInsertSchema(medicineStatus).omit({
  id: true,
  createdAt: true,
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
});

export const insertComplianceStatsSchema = createInsertSchema(complianceStats).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type MedicineStatus = typeof medicineStatus.$inferSelect;
export type InsertMedicineStatus = z.infer<typeof insertMedicineStatusSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type ComplianceStats = typeof complianceStats.$inferSelect;
export type InsertComplianceStats = z.infer<typeof insertComplianceStatsSchema>;
