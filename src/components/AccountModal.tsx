import React, { useState } from 'react';
import { X, Cloud, CloudOff, LogOut, Mail, KeyRound, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualResync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: number | null;
}

export function AccountModal({ isOpen, onClose, onManualResync, isSyncing, lastSyncedAt }: AccountModalProps) {
  const { user, isCloudConfigured, signInWithPassword, signUpWithPassword, signOut } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage({ text: 'Enter both email and password.', isError: true });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);

    if (mode === 'signin') {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) {
        setMessage({ text: error, isError: true });
      } else {
        setMessage(null);
      }
    } else {
      const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password);
      if (error) {
        setMessage({ text: error, isError: true });
      } else if (needsConfirmation) {
        setMessage({ text: 'Account created — check your email to confirm before signing in.' });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {user ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Account &amp; Cloud Sync</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCloudConfigured ? 'Same account as your other BudgetIQ apps' : 'Cloud sync is not configured'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!isCloudConfigured && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              This deployment has no <code className="font-mono">VITE_SUPABASE_URL</code> / <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> set, so data only lives on this device. Set those two values (same ones your Next.js app uses) in the AI Studio project's environment settings to enable sign-in and cross-device sync.
            </div>
          )}

          {isCloudConfigured && user && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Signed in as {user.email}
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                  Transactions and goals sync automatically and live-update across every device signed into this account.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Not yet synced this session'}
                </span>
                <button
                  onClick={onManualResync}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              <button
                onClick={() => signOut()}
                className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}

          {isCloudConfigured && !user && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 ${mode === 'signin' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 ${mode === 'signup' ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  Create Account
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Password
                </label>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    message.isError
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  {message.isError ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>

              <p className="text-[11px] text-slate-400 text-center">
                Use the same email/password as your other BudgetIQ app to see the same data here.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
