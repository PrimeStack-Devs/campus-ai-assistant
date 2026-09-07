'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Globe,
  Lock,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function AdminSettingsPage() {
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(true);
  const [domainRestrictionEnabled, setDomainRestrictionEnabled] = useState(false);
  const [allowedDomainsInput, setAllowedDomainsInput] = useState('paruluniversity.ac.in');
  const [registrationNote, setRegistrationNote] = useState(
    'Sign in with any Google account or your Parul University student ID.'
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const { getAuthHeaders } = useAdminAuth();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/admin/settings`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setGoogleAuthEnabled(data.settings.googleAuthEnabled !== false);
        setDomainRestrictionEnabled(Boolean(data.settings.domainRestrictionEnabled));
        setAllowedDomainsInput(
          Array.isArray(data.settings.allowedDomains)
            ? data.settings.allowedDomains.join(', ')
            : 'paruluniversity.ac.in'
        );
        if (data.settings.registrationNote) {
          setRegistrationNote(data.settings.registrationNote);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    const domainsArray = allowedDomainsInput
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      googleAuthEnabled,
      domainRestrictionEnabled,
      allowedDomains: domainsArray.length > 0 ? domainsArray : ['paruluniversity.ac.in'],
      registrationNote,
    };

    try {
      const res = await fetch(`${backendUrl}/api/admin/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSaveStatus({
          success: true,
          message: 'Authentication and domain restriction settings saved successfully.',
        });
      } else {
        setSaveStatus({
          success: false,
          message: data.error || 'Failed to save settings.',
        });
      }
    } catch (err: any) {
      setSaveStatus({
        success: false,
        message: err.message || 'Network error saving settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="text-blue-600 dark:text-blue-400" size={32} />
              Auth & Domain Security Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Control student sign-in rules, domain restrictions, and guest mode parameters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchSettings}
              disabled={isLoading || isSaving}
              className="flex items-center gap-1.5 dark:border-slate-700"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {saveStatus && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 ${
              saveStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {saveStatus.success ? (
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0" size={20} />
            )}
            <p className="text-xs font-semibold">{saveStatus.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading live security settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Setting 1: Google Sign-In Enablement */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="text-blue-600 dark:text-blue-400" size={20} />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Google Authentication
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Allow students and campus users to log in with their Google accounts.
                  </p>
                </div>

                <Switch
                  checked={googleAuthEnabled}
                  onCheckedChange={setGoogleAuthEnabled}
                  className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-600 scale-125 origin-right cursor-pointer"
                  aria-label="Toggle Google Authentication"
                />
              </div>
            </div>

            {/* Setting 2: University Domain Restriction (Core User Request) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      University Domain Restriction
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Control whether sign-in is open to any Google account or strictly locked to university emails.
                  </p>
                </div>

                <Switch
                  checked={domainRestrictionEnabled}
                  onCheckedChange={setDomainRestrictionEnabled}
                  className="data-[state=checked]:bg-indigo-600 dark:data-[state=checked]:bg-indigo-600 scale-125 origin-right cursor-pointer"
                  aria-label="Toggle University Domain Restriction"
                />
              </div>

              {/* Status Pill */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  domainRestrictionEnabled
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {domainRestrictionEnabled ? (
                    <Lock className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" size={18} />
                  ) : (
                    <Globe className="text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" size={18} />
                  )}
                  <div className="space-y-1">
                    <p className="text-xs font-bold">
                      {domainRestrictionEnabled
                        ? 'Mode: University Domain Only (Restricted)'
                        : 'Mode: All Domains Allowed (Default)'}
                    </p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {domainRestrictionEnabled
                        ? 'Only Google accounts matching the university domain(s) specified below are permitted to log in. Personal accounts (e.g. @gmail.com) will be rejected with an authorization alert.'
                        : 'Any personal Gmail or Google account can log in to save their chat conversations. No restrictions are applied.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Allowed Domains Config */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Allowed University Domains (Comma-separated)
                </label>
                <Input
                  value={allowedDomainsInput}
                  onChange={(e) => setAllowedDomainsInput(e.target.value)}
                  placeholder="e.g., paruluniversity.ac.in, piet.ac.in"
                  className="dark:bg-slate-800 dark:border-slate-700 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Default: <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">paruluniversity.ac.in</code>. You can list multiple sub-domains separated by commas.
                </p>
              </div>
            </div>

            {/* Setting 3: Guest Mode Safeguard Banner */}
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 flex items-start gap-3.5">
              <Info className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" size={20} />
              <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                <p className="font-bold">Campus Guest Tier Active (5 Free Queries & Privacy Safeguards)</p>
                <p>
                  Visitors and prospective students can explore campus freely without being forced to sign in. Guests receive 5 free AI questions, public event calendars, and building locations. Private faculty phone/email contacts and internal examination dates are protected behind student Google sign-in.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
