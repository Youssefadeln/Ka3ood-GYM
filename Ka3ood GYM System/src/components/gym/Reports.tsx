import React, { useState, useMemo } from 'react';
import { Member, Payment, Employee, AppSettings, DeductionRecord } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportsProps {
  members: Member[];
  payments: Payment[];
  settings: AppSettings;
  employees: Employee[];
  deductions: DeductionRecord[];
  addDeduction: (d: DeductionRecord) => void;
  updateDeductions: (d: DeductionRecord[]) => void;
}

const Reports: React.FC<ReportsProps> = ({ members = [], payments = [], settings, employees = [], deductions = [] }) => {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'EXPIRED' | 'REVENUE' | 'SALARIES' | 'DEBTORS' | 'DEDUCTIONS'>('MEMBERS');

  const dataList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (activeTab) {
      case 'MEMBERS': 
        return members.filter(m => !m.isArchived);
      case 'EXPIRED': 
        return members.filter(m => !m.isArchived && new Date(m.subscriptionEndDate) < today);
      case 'DEBTORS': 
        return members.filter(m => (m.totalDebt || 0) > 0).sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0));
      case 'REVENUE': 
        return [...payments].reverse();
      case 'DEDUCTIONS': 
        return [...deductions].reverse();
      case 'SALARIES': 
        return employees.map(emp => {
          const absences = emp.attendance?.filter(a => a.status === 'ABSENT').length || 0;
          const ded = absences * settings.absenceDeduction;
          return { name: emp.name, base: emp.baseSalary, ded, net: emp.baseSalary - ded };
        });
      default: return [];
    }
  }, [activeTab, members, payments, deductions, employees, settings]);

  const exportFullPDF = () => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const today = new Date().toLocaleDateString('ar-EG');
    
    doc.setFontSize(22);
    doc.text(`Full Report - ${settings.gymName}`, 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated on: ${today}`, 105, 30, { align: 'center' });

    (doc as any).autoTable({
      startY: 50,
      head: [['ID', 'Name', 'Plan', 'Expiry']],
      body: members.filter(m => !m.isArchived).map(m => [m.id, m.name, m.subscriptionPlan, m.subscriptionEndDate]),
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`${settings.gymName}_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const tabs = [
    { id: 'MEMBERS' as const, label: 'الأعضاء' },
    { id: 'EXPIRED' as const, label: 'المنتهية' },
    { id: 'DEBTORS' as const, label: 'المديونين' },
    { id: 'REVENUE' as const, label: 'الإيرادات' },
    { id: 'DEDUCTIONS' as const, label: 'المصروفات' },
    { id: 'SALARIES' as const, label: 'الرواتب' },
  ];

  return (
    <div className="p-4 md:p-8 h-full bg-background text-foreground text-right overflow-y-auto pb-32">
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">التقارير المالية</h2>
          <p className="text-muted-foreground text-xs font-bold mt-1">تحليل وتصدير بيانات النظام</p>
        </div>
        <button onClick={exportFullPDF} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg transition-all">
          تصدير PDF كامل
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 print:hidden">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {activeTab === 'MEMBERS' && (
                  <>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الكود</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الاسم</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الخطة</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">تاريخ الانتهاء</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الحالة</th>
                  </>
                )}
                {activeTab === 'EXPIRED' && (
                  <>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الاسم</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الهاتف</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">انتهى منذ</th>
                  </>
                )}
                {activeTab === 'REVENUE' && (
                  <>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">التاريخ</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">العضو</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">المبلغ</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">النوع</th>
                  </>
                )}
                {activeTab === 'SALARIES' && (
                  <>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الموظف</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الراتب الأساسي</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الخصومات</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">الصافي</th>
                  </>
                )}
                {activeTab === 'DEBTORS' && (
                  <>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">العضو</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">المديونية</th>
                  </>
                )}
                {activeTab === 'DEDUCTIONS' && (
                  <>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">التاريخ</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">السبب</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">المبلغ</th>
                    <th className="p-4 text-right text-xs font-black text-muted-foreground uppercase">التصنيف</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {dataList.map((item: any, idx) => (
                <tr key={idx} className="border-t border-border hover:bg-muted/30 transition-colors">
                  {activeTab === 'MEMBERS' && (
                    <>
                      <td className="p-4 font-mono text-sm text-primary">{item.id}</td>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-sm">{item.subscriptionPlan}</td>
                      <td className="p-4 text-sm">{item.subscriptionEndDate}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'}`}>
                          {item.isActive ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                    </>
                  )}
                  {activeTab === 'EXPIRED' && (
                    <>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-sm">{item.phone}</td>
                      <td className="p-4 text-destructive font-bold">{Math.abs(Math.ceil((new Date(item.subscriptionEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} يوم</td>
                    </>
                  )}
                  {activeTab === 'REVENUE' && (
                    <>
                      <td className="p-4 text-sm">{item.date?.split('T')[0]}</td>
                      <td className="p-4 font-bold">{item.memberName}</td>
                      <td className="p-4 text-emerald-400 font-bold">{item.amount} ج.م</td>
                      <td className="p-4 text-xs text-muted-foreground">{item.type}</td>
                    </>
                  )}
                  {activeTab === 'SALARIES' && (
                    <>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4">{item.base} ج.م</td>
                      <td className="p-4 text-destructive">{item.ded} ج.م</td>
                      <td className="p-4 text-emerald-400 font-bold">{item.net} ج.م</td>
                    </>
                  )}
                  {activeTab === 'DEBTORS' && (
                    <>
                      <td className="p-4 font-bold">{item.name}</td>
                      <td className="p-4 text-destructive font-bold">{item.totalDebt} ج.م</td>
                    </>
                  )}
                  {activeTab === 'DEDUCTIONS' && (
                    <>
                      <td className="p-4 text-sm">{item.date?.split('T')[0]}</td>
                      <td className="p-4">{item.reason}</td>
                      <td className="p-4 text-destructive font-bold">{item.amount} ج.م</td>
                      <td className="p-4 text-xs">{item.category}</td>
                    </>
                  )}
                </tr>
              ))}
              {dataList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                    لا توجد بيانات للعرض
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
