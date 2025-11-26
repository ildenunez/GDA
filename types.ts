
export enum Role {
  WORKER = 'WORKER',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export enum RedemptionType {
  TIME_OFF = 'TIME_OFF',       // Horas libres
  DAYS_EXCHANGE = 'DAYS_EXCHANGE', // Canje por dias
  PAYROLL = 'PAYROLL'          // Abono en nomina
}

// Deprecated enum, kept for reference but logic now uses dynamic strings
export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON'
}

export interface VacationLogEntry {
  id: string;
  date: string;
  days: number;
  reason: string;
  adminId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string; // Optional for Admin
  avatarUrl?: string;
  password?: string; 
  vacationAdjustment?: number; 
  vacationHistory?: VacationLogEntry[];
  calendarColor?: string; // Color distintivo del empleado
}

export interface Department {
  id: string;
  name: string;
  supervisorIds: string[]; 
}

export interface AbsenceType {
  id: string;
  name: string;
  isClosedRange: boolean; 
  availableRanges?: { start: string; end: string }[]; 
  allowanceDays?: number;
  color: string;
  deductsDays?: boolean; 
}

export interface ShiftTypeDefinition {
  id: string;
  name: string;
  color: string; // Tailwind classes string e.g. "bg-blue-100 text-blue-800"
  startTime: string;
  endTime: string;
  startTime2?: string; // Optional split shift start
  endTime2?: string;   // Optional split shift end
}

export interface AbsenceRequest {
  id: string;
  userId: string;
  typeId: string;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  comment: string;
  createdAt: string;
}

export interface OvertimeRecord {
  id: string;
  userId: string;
  date: string;
  hours: number; 
  description: string;
  status: RequestStatus;
  consumed: number; 
  createdAt: string;
  isAdjustment?: boolean; 
  redemptionType?: RedemptionType; 
  linkedRecordIds?: string[]; 
}

export interface Shift {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  shiftType: string; // ID of the ShiftTypeDefinition
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
}

export interface EmailTemplate {
  id: string;
  eventType: string; 
  name: string; 
  subject: string;
  body: string;
  recipients: Role[]; 
}
