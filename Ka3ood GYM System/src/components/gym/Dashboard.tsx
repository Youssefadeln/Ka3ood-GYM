import React, { useMemo } from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Employee, Member, Payment, AppSettings } from '@/types';

interface DashboardProps {
  employees: Employee[];
  members: Member[];
  payments: Payment[];
  settings?: AppSettings;
  isDataReady?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, members, payments, settings, isDataReady }) => {
  const activeMembersPool = useMemo(() => members.filter(m => !m.isArchived), [members]);
  const activeMembersCount = useMemo(() => activeMembersPool.filter(m => m.isActive).length, [activeMembersPool]);

  const showBackupWarning = useMemo(() => {
    if (!settings?.lastBackupDate) return true;
    const lastBackup = new Date(settings.lastBackupDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastBackup.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  }, [settings?.lastBackupDate]);

  const expiringMembers = useMemo(() => {
    if (!isDataReady) return [];
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return members.filter(m => {
      if (m.isArchived || !m.isActive) return false;
      const end = new Date(m.subscriptionEndDate);
      return end >= today && end <= nextWeek;
    }).sort((a, b) => new Date(a.subscriptionEndDate).getTime() - new Date(b.subscriptionEndDate).getTime());
  }, [members, isDataReady]);
  
  const currentMonthRevenue = useMemo(() => {
    if (!isDataReady) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return payments.reduce((sum, payment) => {
      const paymentDate = new Date(payment.date);
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        return sum + payment.amount;
      }
      return sum;
    }, 0);
  }, [payments, isDataReady]);

  const planData = useMemo(() => {
    if (!isDataReady) return [];
    const plans: Record<string, number> = {};
    activeMembersPool.forEach(m => {
      if (m.isActive) plans[m.subscriptionPlan] = (plans[m.subscriptionPlan] || 0) + 1;
    });
    return Object.keys(plans).map(key => ({ name: key, value: plans[key] }));
  }, [activeMembersPool, isDataReady]);

  const attendanceStats = useMemo(() => {
    if (!isDataReady) return [];
    const planAttendance: Record<string, number> = {};
    const planMemberCounts: Record<string, number> = {};

    members.forEach(m => {
      if (m.isArchived) return;
      planMemberCounts[m.subscriptionPlan] = (planMemberCounts[m.subscriptionPlan] || 0) + 1;
      planAttendance[m.subscriptionPlan] = (planAttendance[m.subscriptionPlan] || 0) + (m.attendanceHistory?.length || 0);
    });

    return Object.keys(planMemberCounts).map(plan => ({
      name: plan,
      value: planMemberCounts[plan] ? Math.round(planAttendance[plan] / planMemberCounts[plan]) : 0
    }));
  }, [members, isDataReady]);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in text-right">
      {showBackupWarning && isDataReady && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 p-4 rounded-xl flex flex-col md:flex-row-reverse justify-between items-center text-yellow-200 gap-4">
          <div className="flex items-center flex-row-reverse text-right">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-3 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-bold">مطلوب عمل نسخة احتياطية</p>
              <p className="text-xs opacity-80">لقد مر أكثر من 7 أيام على آخر نسخة احتياطية.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground uppercase italic tracking-tighter">لوحة التحكم</h2>
        {!isDataReady && <span className="text-primary text-xs font-black animate-pulse">جاري تحميل البيانات...</span>}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden">
          {!isDataReady && <div className="absolute inset-0 bg-card/50 backdrop-blur-sm z-10 flex items-center justify-center"></div>}
          <div className="flex items-center justify-between flex-row-reverse">
            <div>
              <p className="text-muted-foreground text-sm font-bold">إجمالي الأعضاء</p>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mt-1">{isDataReady ? activeMembersPool.length : '--'}</h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg relative overflow-hidden">
          {!isDataReady && <div className="absolute inset-0 bg-card/50 backdrop-blur-sm z-10"></div>}
          <div className="flex items-center justify-between flex-row-reverse">
            <div>
              <p className="text-muted-foreground text-sm font-bold">الاشتراكات النشطة</p>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mt-1">{isDataReady ? activeMembersCount : '--'}</h3>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg sm:col-span-2 lg:col-span-1 relative overflow-hidden">
          {!isDataReady && <div className="absolute inset-0 bg-card/50 backdrop-blur-sm z-10"></div>}
          <div className="flex items-center justify-between flex-row-reverse">
            <div>
              <p className="text-muted-foreground text-sm font-bold">دخل الشهر الحالي</p>
              <h3 className="text-2xl md:text-3xl font-black text-foreground mt-1">{isDataReady ? currentMonthRevenue.toLocaleString() : '--'}</h3>
            </div>
            <div className="bg-primary/20 p-3 rounded-xl text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-4">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg lg:col-span-1 min-h-[300px]">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center flex-row-reverse gap-2">
            <span className="w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
            ينتهي قريباً
          </h3>
          <div className="space-y-3 max-h-60 lg:max-h-80 overflow-y-auto pl-2 custom-scrollbar">
            {!isDataReady ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-900/50 rounded-xl animate-pulse"></div>)}
              </div>
            ) : expiringMembers.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center italic py-4">لا توجد اشتراكات تنتهي هذا الأسبوع.</p>
            ) : (
              expiringMembers.map(m => {
                const daysLeft = Math.ceil((new Date(m.subscriptionEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={m.id} className="bg-slate-900/50 p-3 rounded-xl flex flex-row-reverse justify-between items-center border border-border hover:border-slate-500 transition-colors">
                    <div className="text-right">
                      <p className="text-foreground text-sm font-bold truncate max-w-[120px]">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{m.subscriptionPlan}</p>
                    </div>
                    <div className="text-left">
                      <span className="text-destructive font-black text-xs md:text-sm">{daysLeft} يوم</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg lg:col-span-1 min-h-[300px]">
          <h3 className="text-lg font-bold text-foreground mb-6">توزيع الخطط</h3>
          <div className="h-64 flex items-center justify-center">
            {!isDataReady ? (
              <div className="w-32 h-32 border-4 border-border border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5} dataKey="value">
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', textAlign: 'right', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-lg lg:col-span-1 min-h-[300px]">
          <h3 className="text-lg font-bold text-foreground mb-6">متوسط الحضور / الخطة</h3>
          <div className="h-64 flex items-center justify-center">
            {!isDataReady ? (
              <div className="w-full h-full bg-slate-900/20 rounded animate-pulse"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceStats}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={8} hide />
                  <YAxis stroke="#64748b" fontSize={10} orientation="right" />
                  <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', textAlign: 'right', fontSize: '10px' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="متوسط الزيارات" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
