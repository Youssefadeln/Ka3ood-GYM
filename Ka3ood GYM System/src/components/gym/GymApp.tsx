import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Employee, Member, Payment, DeductionRecord, Offer, DailyReport, ActivityLogEntry, UserAccount, AppSettings } from '@/types';
import { INITIAL_EMPLOYEES, INITIAL_MEMBERS, INITIAL_SETTINGS } from '@/constants';
import Sidebar from './Sidebar';
import Logo from './Logo';
import Dashboard from './Dashboard';
import CheckIn from './CheckIn';
import Reports from './Reports';
import Settings from './Settings';
import ExportCenter from './ExportCenter';

const AccessDenied = () => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="bg-destructive/10 border-2 border-destructive/20 p-12 rounded-[3rem] text-center max-w-md animate-fade-in shadow-2xl">
      <h2 className="text-3xl font-black text-foreground uppercase italic tracking-tighter mb-4">تم رفض الوصول</h2>
      <p className="text-muted-foreground font-medium">ليس لديك الإذن الكافي للوصول إلى هذا القسم.</p>
    </div>
  </div>
);

const GymApp: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const s = localStorage.getItem('ka3ood_settings');
      return s ? JSON.parse(s) : INITIAL_SETTINGS;
    } catch { return INITIAL_SETTINGS; }
  });

  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const s = localStorage.getItem('ka3ood_accounts');
      return s ? JSON.parse(s) : [{
        id: 'owner-1', username: 'admin', role: 'OWNER',
        permissions: { canManageMembers: true, canManageCheckIn: true, canManageEmployees: true, canViewReports: true, canViewFinancials: true, canManageSettings: true, canManagePayments: true }
      }];
    } catch { return []; }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deductions, setDeductions] = useState<DeductionRecord[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    try {
      const s_employees = localStorage.getItem('ka3ood_employees');
      const s_members = localStorage.getItem('ka3ood_members');
      const s_payments = localStorage.getItem('ka3ood_payments');
      const s_deductions = localStorage.getItem('ka3ood_deductions');
      const s_offers = localStorage.getItem('ka3ood_offers');
      const s_logs = localStorage.getItem('ka3ood_logs');

      setEmployees(s_employees ? JSON.parse(s_employees) : INITIAL_EMPLOYEES);
      setMembers(s_members ? JSON.parse(s_members) : INITIAL_MEMBERS);
      if (s_payments) setPayments(JSON.parse(s_payments));
      if (s_deductions) setDeductions(JSON.parse(s_deductions));
      if (s_offers) setOffers(JSON.parse(s_offers));
      if (s_logs) setActivityLogs(JSON.parse(s_logs));
      setIsDataLoaded(true);
    } catch (e) {
      console.error("Hydration Error", e);
      setIsDataLoaded(true);
    }
  }, []);

  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_members', JSON.stringify(members)); }, [members, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_payments', JSON.stringify(payments)); }, [payments, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_employees', JSON.stringify(employees)); }, [employees, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_settings', JSON.stringify(settings)); }, [settings, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_accounts', JSON.stringify(accounts)); }, [accounts, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_offers', JSON.stringify(offers)); }, [offers, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_deductions', JSON.stringify(deductions)); }, [deductions, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) localStorage.setItem('ka3ood_logs', JSON.stringify(activityLogs)); }, [activityLogs, isDataLoaded]);

  const addLog = useCallback((action: string, target?: string, details?: string) => {
    if (!currentUser) return;
    const log: ActivityLogEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser.id, username: currentUser.username, role: currentUser.role,
      action, target, details, timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [log, ...(prev || [])].slice(0, 2000));
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const account = accounts.find(a => a.username === selectedAccount);
    if (!account) { setLoginError(true); return; }

    const isValid = (account.role === 'OWNER' || account.username === 'admin') 
      ? (passwordInput === settings.masterPassword) 
      : (passwordInput === (account.password || account.username));
    
    if (isValid) {
      setCurrentUser(account);
      setIsAuthenticated(true);
      setLoginError(false);
    } else { setLoginError(true); }
  };

  const handleLogout = () => { 
    setIsAuthenticated(false); 
    setPasswordInput(''); 
    setCurrentUser(null);
  };

  const addPayment = (payment: Payment) => setPayments(prev => [...prev, payment]);
  const addDeduction = (deduction: DeductionRecord) => setDeductions(prev => [...prev, deduction]);
  const updateDeductions = (newDeductions: DeductionRecord[]) => setDeductions(newDeductions);

  const handleFullReset = () => {
    if(!confirm("⚠️ تحذير: مسح كافة بيانات النظام نهائياً؟")) return;
    localStorage.clear();
    window.location.reload();
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const perms = currentUser.permissions;
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard employees={employees} members={members} payments={payments} settings={settings} isDataReady={isDataLoaded} />;
      case 'CHECK_IN': return perms.canManageCheckIn ? <CheckIn members={members} setMembers={setMembers} employees={employees} setEmployees={setEmployees} payments={payments} settings={settings} addLog={addLog} addPayment={addPayment} currentUser={currentUser} /> : <AccessDenied />;
      case 'REPORTS': return perms.canViewReports ? <Reports members={members} payments={payments} settings={settings} deductions={deductions} addDeduction={addDeduction} updateDeductions={updateDeductions} employees={employees} /> : <AccessDenied />;
      case 'EXPORT_CENTER': return <ExportCenter data={{members, employees, payments, offers, deductions, dailyReports}} settings={settings} accounts={accounts} activityLogs={activityLogs} addLog={addLog} setMembers={setMembers} setEmployees={setEmployees} setPayments={setPayments} setOffers={setOffers} setDeductions={setDeductions} setDailyReports={setDailyReports} setSettings={setSettings} setAccounts={setAccounts} setActivityLogs={setActivityLogs} onRestoreData={(d) => { window.location.reload(); }} />;
      case 'SETTINGS': return perms.canManageSettings ? <Settings settings={settings} setSettings={setSettings} data={{members, employees, payments, offers}} onRestore={() => {}} onReset={handleFullReset} offers={offers} setOffers={setOffers} accounts={accounts} setAccounts={setAccounts} currentUser={currentUser} activityLogs={activityLogs} addLog={addLog} /> : <AccessDenied />;
      default: return <Dashboard employees={employees} members={members} payments={payments} settings={settings} isDataReady={isDataLoaded} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-border animate-fade-in">
          <div className="flex justify-center mb-8"><Logo className="text-4xl md:text-7xl" /></div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs font-black block pr-2 uppercase italic tracking-widest">اختر الحساب المسجل</label>
              <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-full bg-background border border-border rounded-xl p-4 text-foreground text-lg focus:ring-2 focus:ring-primary outline-none text-right appearance-none">
                <option value="" disabled>--- اختر المستخدم ---</option>
                {accounts.map(acc => <option key={acc.id} value={acc.username}>{acc.username} ({acc.role === 'OWNER' ? 'مدير' : 'استقبال'})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-muted-foreground text-xs font-black block pr-2 uppercase italic tracking-widest">كلمة المرور</label>
              <input type="password" placeholder="********" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-background border border-border rounded-xl p-4 text-foreground text-lg focus:ring-2 focus:ring-primary outline-none text-right" />
            </div>
            {loginError && <div className="text-destructive text-center text-xs bg-destructive/10 p-3 rounded-xl font-bold border border-destructive/20">بيانات الدخول غير صحيحة</div>}
            <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-5 rounded-2xl transition-all shadow-lg active:scale-95 uppercase tracking-widest italic border-b-4 border-primary/60">الدخول إلى قعود</button>
          </form>
          <p className="text-center text-muted-foreground text-[9px] mt-8 font-black uppercase tracking-[0.2em]">KA3OOD GYM © {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground flex-row overflow-hidden relative">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <Sidebar currentView={currentView} setView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} onLogout={handleLogout} currentUser={currentUser} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 md:mr-64">
        <header className="md:hidden bg-card p-4 border-b border-border flex justify-between items-center shrink-0">
          <Logo className="text-2xl" />
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar">{renderContent()}</div>
      </main>
    </div>
  );
};

export default GymApp;
