
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
  password?: string; // Added for password management
  vacationAdjustment?: number; // Days added or removed by Admin
  vacationHistory?: VacationLogEntry[];
}

export interface Department {
  id: string;
  name: string;
  supervisorIds: string[]; // Can be empty
}

export interface AbsenceType {
  id: string;
  name: string;
  isClosedRange: boolean; // If true, Admin defines specific dates
  availableRanges?: { start: string; end: string }[]; // For closed ranges
  allowanceDays?: number;
  color: string;
  deductsDays?: boolean; // Controls if this type reduces the vacation balance
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
  hours: number; // Negative if redemption
  description: string;
  status: RequestStatus;
  consumed: number; // Hours already used from this record
  createdAt: string;
  isAdjustment?: boolean; // If created by admin to fix balance
  redemptionType?: RedemptionType; // Only for negative hours (consumption)
  linkedRecordIds?: string[]; // IDs of the positive records being consumed
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
  eventType: string; // e.g. 'WELCOME', 'REQUEST_CREATED'
  name: string; // Human readable name
  subject: string;
  body: string;
  recipients: Role[]; // Who receives this?
}
