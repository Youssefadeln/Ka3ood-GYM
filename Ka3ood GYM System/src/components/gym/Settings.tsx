import React, { useState } from 'react';
import { AppSettings, Offer, UserAccount, ActivityLogEntry } from '@/types';
import { DEFAULT_PLAN_CONFIGS } from '@/constants';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  offers: Offer[];
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
  accounts: UserAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentUser: UserAccount;
  activityLogs: ActivityLogEntry[];
  addLog: (action: string, target?: string, details?: string) => void;
  data: any;
  onRestore: (data: any) => void;
  onReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  setSettings, 
  offers, 
  setOffers, 
  accounts, 
  setAccounts, 
  currentUser, 
  activityLogs,
  addLog,
  onReset 
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PRICES' | 'OFFERS' | 'ACCOUNTS' | 'LOGS'>('GENERAL');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = () => {
    if (!newPassword || newPassword.length < 4) {
      alert('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }
    setSettings(prev => ({ ...prev, masterPassword: newPassword }));
    setNewPassword('');
    addLog('تغيير كلمة المرور الرئيسية');
    alert('تم تغيير كلمة المرور بنجاح');
  };

  const handlePriceChange = (planName: string, newPrice: number) => {
    setSettings(prev => ({
      ...prev,
      planConfigs: {
        ...prev.planConfigs,
        [planName]: { ...prev.planConfigs[planName], price: newPrice }
      }
    }));
    addLog('تغيير سعر خطة', planName, `السعر الجديد: ${newPrice}`);
  };

  const handleAddOffer = () => {
    const newOffer: Offer = {
      id: `OFF-${Date.now()}`,
      name: 'عرض جديد',
      discountAmount: 100,
      targetPlan: 'ALL',
      isActive: false
    };
    setOffers(prev => [...prev, newOffer]);
    addLog('إضافة عرض جديد', newOffer.name);
  };

  const handleToggleOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));
  };

  const handleDeleteOffer = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    setOffers(prev => prev.filter(o => o.id !== id));
    addLog('حذف عرض', id);
  };

  const tabs = [
    { id: 'GENERAL' as const, label: 'عام' },
    { id: 'PRICES' as const, label: 'الأسعار' },
    { id: 'OFFERS' as const, label: 'العروض' },
    { id: 'ACCOUNTS' as const, label: 'الحسابات' },
    { id: 'LOGS' as const, label: 'السجلات' },
  ];

  return (
    <div className="p-4 md:p-8 h-full bg-background text-foreground text-right overflow-y-auto pb-32">
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">إعدادات النظام</h2>
          <p className="text-muted-foreground text-xs font-bold mt-1">إدارة إعدادات الجيم والحسابات</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
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

      {activeTab === 'GENERAL' && (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">معلومات الجيم</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">اسم الجيم</label>
                <input
                  type="text"
                  value={settings.gymName}
                  onChange={e => setSettings(prev => ({ ...prev, gymName: e.target.value }))}
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">خصم الغياب (ج.م)</label>
                <input
                  type="number"
                  value={settings.absenceDeduction}
                  onChange={e => setSettings(prev => ({ ...prev, absenceDeduction: Number(e.target.value) }))}
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4">الأمان</h3>
            <div className="flex gap-4">
              <input
                type="password"
                placeholder="كلمة مرور جديدة"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="flex-1 bg-background border border-border rounded-xl p-3 text-foreground"
              />
              <button onClick={handlePasswordChange} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold">
                تغيير
              </button>
            </div>
          </div>

          <div className="bg-destructive/10 p-6 rounded-2xl border border-destructive/30">
            <h3 className="text-lg font-bold text-destructive mb-4">منطقة الخطر</h3>
            <button onClick={onReset} className="bg-destructive text-foreground px-6 py-3 rounded-xl font-bold">
              مسح جميع البيانات
            </button>
          </div>
        </div>
      )}

      {activeTab === 'PRICES' && (
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-foreground mb-6">أسعار الاشتراكات</h3>
          <div className="grid gap-4">
            {Object.entries(settings.planConfigs || DEFAULT_PLAN_CONFIGS).map(([plan, config]) => (
              <div key={plan} className="flex flex-row-reverse justify-between items-center p-4 bg-background rounded-xl border border-border">
                <span className="font-bold">{plan}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={config.price}
                    onChange={e => handlePriceChange(plan, Number(e.target.value))}
                    className="w-24 bg-card border border-border rounded-lg p-2 text-center"
                  />
                  <span className="text-muted-foreground text-sm">ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'OFFERS' && (
        <div className="space-y-6">
          <button onClick={handleAddOffer} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold">
            + إضافة عرض جديد
          </button>
          <div className="grid gap-4">
            {offers.map(offer => (
              <div key={offer.id} className="bg-card p-4 rounded-2xl border border-border flex flex-row-reverse justify-between items-center">
                <div>
                  <p className="font-bold">{offer.name}</p>
                  <p className="text-sm text-muted-foreground">خصم {offer.discountAmount} ج.م</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleOffer(offer.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold ${offer.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}
                  >
                    {offer.isActive ? 'نشط' : 'معطل'}
                  </button>
                  <button onClick={() => handleDeleteOffer(offer.id)} className="text-destructive px-3">
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ACCOUNTS' && (
        <div className="bg-card p-6 rounded-2xl border border-border">
          <h3 className="text-lg font-bold text-foreground mb-6">حسابات المستخدمين</h3>
          <div className="grid gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="flex flex-row-reverse justify-between items-center p-4 bg-background rounded-xl border border-border">
                <div>
                  <p className="font-bold">{acc.username}</p>
                  <p className="text-xs text-muted-foreground">{acc.role === 'OWNER' ? 'المالك' : 'الاستقبال'}</p>
                </div>
                {acc.id !== currentUser.id && (
                  <button 
                    onClick={() => setAccounts(prev => prev.filter(a => a.id !== acc.id))}
                    className="text-destructive text-sm"
                  >
                    حذف
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {activityLogs.slice(0, 100).map(log => (
              <div key={log.id} className="p-4 border-b border-border hover:bg-muted/30">
                <div className="flex flex-row-reverse justify-between">
                  <div className="text-right">
                    <p className="font-bold text-sm">{log.action}</p>
                    {log.target && <p className="text-xs text-muted-foreground">{log.target}</p>}
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                    <p className="text-xs text-primary">{log.username}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
