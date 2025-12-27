import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Member, Payment, AppSettings, Employee, UserAccount } from '@/types';

interface LiveCheckInEntry {
  id: string;
  attendanceId: string;
  memberId: string;
  memberName: string;
  plan?: string;
  role?: string;
  date: string;
  time: string;
  status: 'Active' | 'Expired' | 'Frozen' | 'Inactive';
  hasDebt: boolean;
  type: 'MEMBER' | 'EMPLOYEE';
}

interface CheckInProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  payments: Payment[];
  settings: AppSettings;
  addLog: (action: string, target?: string, details?: string) => void;
  addPayment: (payment: Payment) => void;
  currentUser: UserAccount;
}

const CheckIn: React.FC<CheckInProps> = ({ members, setMembers, employees, setEmployees, settings, addLog, currentUser }) => {
  const [checkInId, setCheckInId] = useState('');
  const [lastResult, setLastResult] = useState<{ member?: Member; employee?: Employee; error: string | null; warning: string | null; success: boolean } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef<number>(0);
  const isScannerMode = useRef<boolean>(false);
  const lastScan = useRef<{ id: string, time: number }>({ id: '', time: 0 });

  const entityIndex = useMemo(() => {
    const map = new Map<string, { member?: Member; employee?: Employee }>();
    members.forEach(m => {
      if (m?.id) map.set(m.id.trim().toLowerCase(), { member: m });
      if (m?.phone) map.set(m.phone.trim().toLowerCase(), { member: m });
    });
    employees.forEach(e => {
      if (e?.id) map.set(e.id.trim().toLowerCase(), { employee: e });
      if (e?.phone) map.set(e.phone.trim().toLowerCase(), { employee: e });
    });
    return map;
  }, [members, employees]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== inputRef.current) return;
      if (target.tagName === 'TEXTAREA') return;

      const now = Date.now();
      const diff = now - lastKeyTime.current;
      lastKeyTime.current = now;

      if (diff < 35) {
        isScannerMode.current = true;
      } else if (diff > 100) {
        isScannerMode.current = false;
      }

      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const suggestions = useMemo(() => {
    const term = checkInId.trim().toLowerCase();
    if (term.length < 2) return [];
    
    const m_sugg = members.filter(m => 
      !m.isArchived && (
        m.name.toLowerCase().includes(term) || 
        m.id.toLowerCase().includes(term) ||
        (m.phone && m.phone.includes(term))
      )
    ).map(m => ({ ...m, type: 'MEMBER' as const }));

    const e_sugg = employees.filter(e => 
      e.name.toLowerCase().includes(term) || 
      e.id.toLowerCase().includes(term) ||
      (e.phone && e.phone.includes(term))
    ).map(e => ({ ...e, type: 'EMPLOYEE' as const }));

    return [...m_sugg, ...e_sugg].slice(0, 10);
  }, [members, employees, checkInId]);

  const [sessionList, setSessionList] = useState<LiveCheckInEntry[]>(() => {
    try {
      const saved = sessionStorage.getItem('ka3ood_checkin_session');
      const today = new Date().toISOString().split('T')[0];
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((p: LiveCheckInEntry) => p && p.date === today) : [];
    } catch { return []; }
  });

  useEffect(() => {
    sessionStorage.setItem('ka3ood_checkin_session', JSON.stringify(sessionList));
  }, [sessionList]);

  const getRemainingDays = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    end.setHours(23, 59, 59, 999);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const processCheckIn = (target: { member?: Member; employee?: Employee }) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const targetId = target.member?.id || target.employee?.id || '';
    
    const now = Date.now();
    if (lastScan.current.id === targetId && (now - lastScan.current.time) < 3000) {
      setCheckInId('');
      return;
    }
    lastScan.current = { id: targetId, time: now };

    const sourceMethod = isScannerMode.current ? ' (عبر Card Scanner)' : '';

    if (target.member) {
      const member = target.member;
      let error: string | null = null;
      let warning: string | null = null;
      const daysLeft = getRemainingDays(member.subscriptionEndDate);

      let status: LiveCheckInEntry['status'] = 'Active';
      if (!member.isActive) status = 'Inactive';
      else if (daysLeft <= 0) status = 'Expired';
      else if (member.isFrozen) status = 'Frozen';

      if (status === 'Expired') warning = 'الاشتراك منتهي';
      if (status === 'Frozen') warning = 'العضوية مجمدة';
      if (status === 'Inactive') error = 'العضوية غير نشطة حالياً';

      if (!error) {
        const entryId = `${member.id}-${Date.now()}`;
        const entry: LiveCheckInEntry = {
          id: entryId, attendanceId: entryId, memberId: member.id, memberName: member.name,
          plan: member.subscriptionPlan, date: today, time: nowTime, status,
          hasDebt: (member.totalDebt || 0) > 0, type: 'MEMBER',
        };

        setMembers(prev => prev.map(m => m.id === member.id ? {
          ...m,
          attendanceHistory: [{ id: entry.attendanceId, date: today, time: nowTime }, ...(m.attendanceHistory || [])]
        } : m));
        setSessionList(prev => [entry, ...prev]);
        addLog('تسجيل دخول عضو', member.name, `بواسطة ${currentUser.username}${sourceMethod}`);
      }
      setLastResult({ member, error, warning, success: !error });
    } else if (target.employee) {
      const employee = target.employee;
      const entryId = `${employee.id}-${Date.now()}`;
      const entry: LiveCheckInEntry = {
        id: entryId, attendanceId: entryId, memberId: employee.id, memberName: employee.name,
        role: employee.role, date: today, time: nowTime, status: 'Active',
        hasDebt: false, type: 'EMPLOYEE',
      };

      setEmployees(prev => prev.map(e => {
        if (e.id !== employee.id) return e;
        const filtered = (e.attendance || []).filter(a => a.date !== today);
        return { ...e, attendance: [{ date: today, checkIn: nowTime, status: 'PRESENT' }, ...filtered] };
      }));

      setSessionList(prev => [entry, ...prev]);
      setLastResult({ employee, error: null, warning: null, success: true });
      addLog('تسجيل دخول موظف', employee.name, `بواسطة ${currentUser.username}${sourceMethod}`);
    }

    setCheckInId('');
    setShowSuggestions(false);
  };

  const handleCheckIn = () => {
    const key = checkInId.trim().toLowerCase();
    if (!key) return;
    
    const target = entityIndex.get(key);
    if (!target) {
      setLastResult({ error: 'البيانات المدخلة غير مسجلة في النظام', warning: null, success: false });
      setCheckInId('');
      setShowSuggestions(false);
      return;
    }
    processCheckIn(target);
  };

  const handleCancelCheckIn = (entry: LiveCheckInEntry) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء تسجيل دخول "${entry.memberName}"؟`)) return;

    if (entry.type === 'MEMBER') {
      setMembers(prev => prev.map(m => {
        if (m.id !== entry.memberId) return m;
        return {
          ...m,
          attendanceHistory: (m.attendanceHistory || []).filter(a => a.id !== entry.attendanceId)
        };
      }));
      addLog('إلغاء تسجيل حضور عضو', entry.memberName, `بواسطة ${currentUser.username}`);
    } else {
      setEmployees(prev => prev.map(e => {
        if (e.id !== entry.memberId) return e;
        return {
          ...e,
          attendance: (e.attendance || []).filter(a => a.date !== entry.date)
        };
      }));
      addLog('إلغاء تسجيل حضور موظف', entry.memberName, `بواسطة ${currentUser.username}`);
    }

    setSessionList(prev => prev.filter(s => s.id !== entry.id));
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col bg-background gap-6 text-right overflow-hidden">
      <div className="w-full max-w-4xl mx-auto shrink-0 z-30 animate-fade-in">
        <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-2xl relative">
          <h2 className="text-2xl font-black text-foreground text-center mb-8 uppercase tracking-tight italic border-b border-border/50 pb-4">مكتب الاستقبال</h2>
          <div className="relative mb-6">
            <div className="flex flex-row-reverse gap-4">
              <input 
                ref={inputRef}
                type="text" 
                placeholder="ادخل الكود أو مرر الكارت عبر السكانر..." 
                className="w-full bg-background border-2 border-border rounded-2xl px-8 py-4 text-xl text-foreground font-mono focus:border-primary outline-none shadow-inner text-right transition-all" 
                value={checkInId} 
                onChange={e => { setCheckInId(e.target.value); setShowSuggestions(true); }} 
                onKeyDown={e => { if (e.key === 'Enter') handleCheckIn(); }}
                autoComplete="off"
                autoFocus 
              />
              <button 
                onClick={handleCheckIn} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 uppercase border-b-4 border-primary/60"
              >
                تسجيل
              </button>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-card border-2 border-border rounded-3xl shadow-2xl overflow-hidden z-50">
                {suggestions.map((s) => (
                  <button key={s.id} onClick={() => processCheckIn(s.type === 'MEMBER' ? { member: s } : { employee: s })} className="w-full p-5 flex flex-row-reverse justify-between items-center hover:bg-muted border-b border-border last:border-0 transition-colors">
                    <div className="text-right">
                      <p className="text-foreground font-black text-lg">{s.name}</p>
                      <p className="text-primary font-mono text-xs font-black">
                        {s.id} 
                        {s.phone && <span className="mr-3 text-muted-foreground">({s.phone})</span>}
                        <span className="mr-3 text-muted-foreground font-bold uppercase">{s.type === 'MEMBER' ? 'عضو' : 'موظف'}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {lastResult && (
            <div className={`animate-fade-in-up border-2 rounded-[2rem] p-6 shadow-2xl transition-all ${lastResult.error ? 'border-destructive/40 bg-destructive/5' : lastResult.warning ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-emerald-500/40 bg-emerald-500/5'}`}>
              <div className="flex flex-row-reverse items-center gap-8">
                <div className="w-24 h-24 bg-background rounded-3xl flex items-center justify-center text-muted-foreground border border-border shrink-0 overflow-hidden shadow-inner">
                  {(lastResult.member?.photo || lastResult.employee?.photo) ? (
                    <img src={lastResult.member?.photo || lastResult.employee?.photo || ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-primary">{(lastResult.member?.name || lastResult.employee?.name || '?').charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 text-right w-full">
                  <div className="flex flex-row-reverse justify-between items-start mb-3">
                    <div>
                      <h3 className="text-2xl font-black text-foreground italic uppercase tracking-tighter mb-1">{lastResult.member?.name || lastResult.employee?.name}</h3>
                      <p className="text-primary font-mono text-sm font-black">
                        {lastResult.member?.id || lastResult.employee?.id}
                        {(lastResult.member?.phone || lastResult.employee?.phone) && <span className="mr-3 text-muted-foreground">({lastResult.member?.phone || lastResult.employee?.phone})</span>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow border-2 ${lastResult.error ? 'bg-destructive text-foreground border-destructive' : lastResult.warning ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-emerald-600 text-foreground border-emerald-500'}`}>
                        {lastResult.error || lastResult.warning || 'تم تسجيل الدخول بنجاح'}
                      </span>
                    </div>
                  </div>
                  {lastResult.member && (lastResult.member.totalDebt || 0) > 0 && (
                    <span className="text-destructive font-black text-xs bg-destructive/10 px-4 py-2 rounded-xl border border-destructive/20">
                      تنبيه: مديونية {lastResult.member.totalDebt} ج.م
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-2xl flex flex-col animate-fade-in">
        <div className="p-6 bg-background flex justify-between items-center border-b border-border">
          <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest italic">سجل الحضور المباشر (اليوم)</h3>
          <span className="bg-card px-4 py-1.5 rounded-full text-xs text-primary font-black border border-border">{sessionList.length} زيارات</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionList.map(entry => (
              <div key={entry.id} className={`bg-background p-4 rounded-2xl border ${entry.status === 'Active' ? 'border-emerald-500/30' : entry.status === 'Expired' ? 'border-destructive/30' : 'border-yellow-500/30'} relative group`}>
                <button onClick={() => handleCancelCheckIn(entry)} className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-foreground w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center">×</button>
                <div className="flex flex-row-reverse justify-between items-start">
                  <div className="text-right">
                    <p className="font-black text-foreground">{entry.memberName}</p>
                    <p className="text-xs text-muted-foreground font-bold">{entry.plan || entry.role}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-primary font-mono text-sm font-black">{entry.time}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${entry.type === 'MEMBER' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/20 text-primary'}`}>
                      {entry.type === 'MEMBER' ? 'عضو' : 'موظف'}
                    </span>
                  </div>
                </div>
                {entry.hasDebt && <span className="text-destructive text-[10px] font-black mt-2 block">⚠️ مديونية</span>}
              </div>
            ))}
            {sessionList.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-12">
                <p className="text-sm italic">لا يوجد تسجيلات دخول اليوم بعد</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
