import { Employee, EmployeeRole, Member, PlanConfig } from '@/types';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'E001',
    name: 'Ahmed Ka3ood',
    role: EmployeeRole.MANAGER,
    baseSalary: 15000,
    email: 'ahmed@ka3oodgym.com',
    phone: '+20100000001',
    joinDate: '2023-01-01',
    attendance: []
  }
];

export const INITIAL_MEMBERS: Member[] = [];

export const DEFAULT_PLAN_CONFIGS: Record<string, PlanConfig> = {
  'تذكرة يومية': { price: 50, durationMonths: 0, durationDays: 1, rank: 0 },
  'خطة زومبا': { price: 500, durationMonths: 1, rank: 1 },
  'خطة 12 جلسة': { price: 600, durationMonths: 1, rank: 2 },
  'خطة شهرية': { price: 800, durationMonths: 1, rank: 3 },
  'خطة 3 أشهر': { price: 2100, durationMonths: 3, rank: 4 },
  'خطة 6 أشهر': { price: 4200, durationMonths: 6, rank: 5 },
  'خطة سنوية': { price: 7500, durationMonths: 12, rank: 6 },
};

export const PLAN_FEATURES: Record<string, { allowMultipleEntries: boolean }> = {
  'تذكرة يومية': { allowMultipleEntries: false },
  'خطة زومبا': { allowMultipleEntries: false },
  'خطة 12 جلسة': { allowMultipleEntries: true },
  'خطة شهرية': { allowMultipleEntries: false },
  'خطة 3 أشهر': { allowMultipleEntries: false },
  'خطة 6 أشهر': { allowMultipleEntries: false },
  'خطة سنوية': { allowMultipleEntries: false },
};

export const INITIAL_SETTINGS = {
  masterPassword: 'admin',
  gymName: 'Ka3ood Gym',
  absenceDeduction: 200,
  halfDayDeduction: 50,
  lastBackupDate: new Date().toISOString(),
  planConfigs: DEFAULT_PLAN_CONFIGS,
  priceHistory: []
};
