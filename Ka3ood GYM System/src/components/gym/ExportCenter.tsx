import React, { useState } from 'react';
import { Member, Employee, Payment, Offer, DeductionRecord, DailyReport, AppSettings, UserAccount, ActivityLogEntry } from '@/types';

interface ExportCenterProps {
  data: {
    members: Member[];
    employees: Employee[];
    payments: Payment[];
    offers: Offer[];
    deductions: DeductionRecord[];
    dailyReports: DailyReport[];
  };
  settings: AppSettings;
  accounts: UserAccount[];
  activityLogs: ActivityLogEntry[];
  addLog: (action: string, target?: string, details?: string) => void;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
  setDeductions: React.Dispatch<React.SetStateAction<DeductionRecord[]>>;
  setDailyReports: React.Dispatch<React.SetStateAction<DailyReport[]>>;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setAccounts: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>;
  onRestoreData: (data: any) => void;
}

const ExportCenter: React.FC<ExportCenterProps> = ({ 
  data, 
  settings, 
  accounts, 
  activityLogs, 
  addLog,
  onRestoreData 
}) => {
  const [importError, setImportError] = useState<string | null>(null);

  const handleExportAll = () => {
    const exportData = {
      settings,
      accounts,
      members: data.members,
      employees: data.employees,
      payments: data.payments,
      offers: data.offers,
      deductions: data.deductions,
      dailyReports: data.dailyReports,
      logs: activityLogs,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ka3ood_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog('تصدير نسخة احتياطية كاملة');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!imported.version) {
          setImportError('ملف غير صالح أو تالف');
          return;
        }
        
        if (confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
          onRestoreData(imported);
          addLog('استعادة نسخة احتياطية', file.name);
        }
      } catch {
        setImportError('خطأ في قراءة الملف');
      }
    };
    reader.readAsText(file);
  };

  const stats = [
    { label: 'الأعضاء', value: data.members.filter(m => !m.isArchived).length, color: 'text-blue-400' },
    { label: 'الموظفين', value: data.employees.length, color: 'text-emerald-400' },
    { label: 'المدفوعات', value: data.payments.length, color: 'text-primary' },
    { label: 'العروض', value: data.offers.length, color: 'text-yellow-400' },
    { label: 'السجلات', value: activityLogs.length, color: 'text-muted-foreground' },
  ];

  return (
    <div className="p-4 md:p-8 h-full bg-background text-foreground text-right overflow-y-auto pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">مركز البيانات</h2>
        <p className="text-muted-foreground text-xs font-bold mt-1">تصدير واستيراد بيانات النظام</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-card p-4 rounded-2xl border border-border text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card p-8 rounded-2xl border border-border">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground text-center mb-2">تصدير البيانات</h3>
          <p className="text-muted-foreground text-sm text-center mb-6">حفظ نسخة احتياطية كاملة من جميع بيانات النظام</p>
          <button 
            onClick={handleExportAll}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-foreground py-4 rounded-xl font-bold transition-all"
          >
            تصدير نسخة احتياطية
          </button>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground text-center mb-2">استيراد البيانات</h3>
          <p className="text-muted-foreground text-sm text-center mb-6">استعادة نسخة احتياطية سابقة</p>
          <label className="w-full bg-blue-500 hover:bg-blue-600 text-foreground py-4 rounded-xl font-bold transition-all block text-center cursor-pointer">
            اختر ملف النسخة الاحتياطية
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          {importError && (
            <p className="text-destructive text-sm text-center mt-4">{importError}</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-yellow-500/10 p-6 rounded-2xl border border-yellow-500/30">
        <div className="flex items-start gap-4 flex-row-reverse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-right">
            <h4 className="font-bold text-yellow-200">نصيحة مهمة</h4>
            <p className="text-yellow-200/70 text-sm mt-1">
              ننصح بعمل نسخة احتياطية أسبوعياً على الأقل للحفاظ على بياناتك. يمكنك حفظ الملف على جهازك أو رفعه إلى خدمة سحابية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportCenter;
