export type UserRole = "super_admin" | "hospital_admin" | "doctor" | "patient";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface DashboardStats {
  totalPatients?: number;
  activePrescriptions: number;
  complianceRate: number;
  alerts?: number;
  nextMedicine?: string;
  todaysDoses?: number;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  language: string;
  timestamp: Date;
  patientName?: string;
}

export interface MedicineStatusUpdate {
  prescriptionId: string;
  status: "taken" | "missed" | "pending";
  actualTime?: Date;
  notes?: string;
}
