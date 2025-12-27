export enum EmployeeRole {
  TRAINER = 'مدرب',
  RECEPTIONIST = 'موظف استقبال',
  MANAGER = 'مدير',
  CLEANER = 'عامل نظافة'
}

export interface AttendanceRecord {
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY';
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  baseSalary: number;
  email: string;
  phone: string;
  joinDate: string;
  attendance: AttendanceRecord[];
  dob?: string | null;
  nationalId?: string | null;
  gender?: 'Male' | 'Female' | '' | null;
  nationality?: string | null;
  address?: string | null;
  photo?: string | null;
  emergencyContact?: {
    name?: string | null;
    relationship?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

export enum SubscriptionPlan {
  DAY_PASS = 'تذكرة يومية',
  ZUMBA_PLAN = 'خطة زومبا',
  SESSIONS_12 = 'خطة 12 جلسة',
  MONTHLY = 'خطة شهرية',
  QUARTERLY = 'خطة 3 أشهر',
  SEMI_ANNUAL = 'خطة 6 أشهر',
  YEARLY = 'خطة سنوية'
}

export interface MemberAttendance {
  id: string;
  date: string;
  time: string;
}

export interface FreezeRecord {
  startDate: string;
  endDate: string;
  durationDays: number;
}

export interface UpgradeRecord {
  date: string;
  oldPlan: string;
  newPlan: string;
  cost: number;
  creditApplied: number;
}

export interface ArchiveRecord {
  id: string;
  dateArchived: string;
  reason: string;
  adminId: string;
}

export interface AccountPermissions {
  canManageMembers: boolean;
  canManageCheckIn: boolean;
  canManageEmployees: boolean;
  canViewReports: boolean;
  canViewFinancials: boolean;
  canManageSettings: boolean;
  canManagePayments: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: 'OWNER' | 'RECEPTION';
  permissions: AccountPermissions;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  username: string;
  role: string;
  action: string;
  target?: string;
  details?: string;
  timestamp: string;
}

export interface AdjustmentRecord {
  id: string;
  date: string;
  daysAdded: number;
  reason: string;
}

export interface DebtRecord {
  id: string;
  amount: number;
  date: string;
  reason: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  subscriptionPlan: string;
  subscriptionEndDate: string;
  isActive: boolean;
  isFrozen?: boolean;
  remainingDaysAtFreeze?: number;
  lastFreezeDate?: string;
  isArchived?: boolean;
  notes?: string;
  attendanceHistory: MemberAttendance[];
  freezeHistory: FreezeRecord[];
  upgradeHistory: UpgradeRecord[];
  archiveHistory: ArchiveRecord[];
  adjustmentHistory: AdjustmentRecord[];
  totalDebt?: number;
  debtHistory?: DebtRecord[];
  sessionsRemaining?: number;
  dob?: string | null;
  nationalId?: string | null;
  gender?: 'Male' | 'Female' | '' | null;
  nationality?: string | null;
  address?: string | null;
  occupation?: string | null;
  photo?: string | null;
  emergencyContact?: {
    name?: string | null;
    relationship?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  type: 'SUBSCRIPTION' | 'PRODUCT' | 'OTHER' | 'UPGRADE' | 'EXTENSION' | 'DEBT_PAYMENT' | 'MANUAL_DEBT';
  discountApplied?: string;
  recordedBy?: string;
}

export interface DeductionRecord {
  id: string;
  amount: number;
  reason: string;
  date: string;
  adminId: string;
  category: 'EXPENSE' | 'SALARY' | 'REFUND' | 'OTHER';
  relatedId?: string;
  relatedName?: string;
}

export interface DailyReport {
  id: string;
  date: string;
  attendedCount: number;
  newSubscriptions: number;
  renewedSubscriptions: number;
  expiredSubscriptions: number;
  totalIncome: number;
  salaryDeductions: number;
  totalExpenses: number;
  netIncome: number;
  timestamp: string;
}

export type ViewState = 'DASHBOARD' | 'CHECK_IN' | 'EMPLOYEES' | 'MEMBERS' | 'REPORTS' | 'SETTINGS' | 'LOGS' | 'ACCOUNTS' | 'EXPORT_CENTER';

export interface Offer {
  id: string;
  name: string;
  discountAmount: number;
  targetPlan: string | 'ALL';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface PriceChangeRecord {
  id: string;
  planName: string;
  oldPrice: number;
  newPrice: number;
  date: string;
  adminId: string;
}

export interface PlanConfig {
  price: number;
  durationMonths: number;
  durationDays?: number;
  rank: number;
}

export interface AppSettings {
  masterPassword: string;
  gymName: string;
  absenceDeduction: number;
  halfDayDeduction: number;
  lastBackupDate?: string;
  planConfigs: Record<string, PlanConfig>;
  priceHistory: PriceChangeRecord[];
}
