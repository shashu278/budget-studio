import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileJson,
  RotateCcw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ClipboardCheck,
  Copy,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Database,
  RefreshCw,
  KeyRound,
  Globe,
} from 'lucide-react';
import { Transaction, Category } from '../types';
import {
  exportAllDataAsJSON,
  exportTransactionsAsCSV,
  importAllDataFromJSON,
  resetDataToDefaults,
  clearAllData,
} from '../utils/storage';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  syncFromSupabase,
  pushToSupabase,
} from '../utils/supabase';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  onDataChanged: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  transactions,
  categories,
  onDataChanged,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<'supabase' | 'migrate' | 'backup' | 'utils'>('supabase');
  const [pasteData, setPasteData] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  
  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseTableName, setSupabaseTableName] = useState('');
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [isPushingSupabase, setIsPushingSupabase] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      setSupabaseAnonKey(config.anonKey);
      setSupabaseTableName(config.tableName || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePushToSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setStatusMessage({
        text: 'Please enter your Supabase Project URL and API Key.',
        isError: true,
      });
      return;
    }

    saveSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      tableName: supabaseTableName.trim(),
    });

    setIsPushingSupabase(true);
    setStatusMessage(null);
    setSyncLogs([]);

    try {
      const result = await pushToSupabase(supabaseTableName.trim());
      if (result.details) {
        setSyncLogs(result.details);
      }
      if (result.success) {
        setStatusMessage({ text: `🎉 ${result.message}` });
      } else {
        setStatusMessage({ text: result.message, isError: true });
        setShowLogs(true);
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Error connecting to Supabase: ${err?.message || 'Check your URL and API key'}`,
        isError: true,
      });
    } finally {
      setIsPushingSupabase(false);
    }
  };

  const handleSaveAndSyncSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setStatusMessage({
        text: 'Please enter your Supabase Project URL and Anon API Key.',
        isError: true,
      });
      return;
    }

    saveSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseAnonKey.trim(),
      tableName: supabaseTableName.trim(),
    });

    setIsSyncingSupabase(true);
    setStatusMessage(null);
    setSyncLogs([]);

    try {
      const result = await syncFromSupabase(supabaseTableName.trim());
      if (result.details) {
        setSyncLogs(result.details);
      }
      if (result.success) {
        setStatusMessage({ text: `🎉 ${result.message}` });
        onDataChanged();
      } else {
        setStatusMessage({ text: result.message, isError: true });
        setShowLogs(true);
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Error connecting to Supabase: ${err?.message || 'Check your URL and API key'}`,
        isError: true,
      });
    } finally {
      setIsSyncingSupabase(false);
    }
  };


  const migrationScript = `copy(JSON.stringify(localStorage))`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(migrationScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadCSV = () => {
    try {
      const csvContent = exportTransactionsAsCSV(transactions, categories);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `budget_tracker_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusMessage({ text: 'CSV transactions export downloaded successfully!' });
    } catch {
      setStatusMessage({ text: 'Failed to generate CSV export.', isError: true });
    }
  };

  const handleDownloadJSON = () => {
    try {
      const jsonContent = exportAllDataAsJSON();
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `budget_tracker_full_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusMessage({ text: 'Full JSON backup downloaded successfully!' });
    } catch {
      setStatusMessage({ text: 'Failed to generate JSON backup.', isError: true });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataFromJSON(content);
      if (success) {
        setStatusMessage({ text: 'Backup imported successfully! Data refreshed.' });
        onDataChanged();
      } else {
        setStatusMessage({ text: 'Invalid file format. Could not import.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!pasteData.trim()) {
      setStatusMessage({ text: 'Please paste your JSON, storage dump, or CSV text first.', isError: true });
      return;
    }
    const success = importAllDataFromJSON(pasteData.trim());
    if (success) {
      setStatusMessage({ text: 'All previous transactions & records imported successfully!' });
      setPasteData('');
      onDataChanged();
    } else {
      setStatusMessage({ text: 'Could not parse data. Ensure it is valid JSON, storage dump, or CSV.', isError: true });
    }
  };

  const handleResetSample = () => {
    if (confirm('Load demo transactions, categories, and savings goals? Current data will be replaced with rich sample data.')) {
      resetDataToDefaults();
      setStatusMessage({ text: 'Sample dataset restored successfully!' });
      onDataChanged();
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all transactions and goals? This action cannot be undone.')) {
      clearAllData();
      setStatusMessage({ text: 'All data cleared. Starting fresh.' });
      onDataChanged();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Data & Version Sync Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Migrate records from your previous Vercel app or backup files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'supabase'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Supabase Cloud Sync
          </button>
          <button
            onClick={() => setActiveTab('migrate')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'migrate'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Local Migration
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export & Backup
          </button>
          <button
            onClick={() => setActiveTab('utils')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'utils'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Data Tools
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
              }`}
            >
              {statusMessage.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 rounded-xl p-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Supabase Cloud Database Sync
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Pull your previous 2 months of transactions directly from your Supabase database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Found in your Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    Supabase Key (Use service_role to bypass RLS)
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Found in Supabase Dashboard &gt; Project Settings &gt; API. If your table has Row Level Security (RLS), you MUST use the <strong className="text-emerald-600 dark:text-emerald-400">service_role secret</strong> instead of the anon key.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    Table Name (Optional / Auto-detect)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. transactions, expenses, budget, user_transactions"
                    value={supabaseTableName}
                    onChange={(e) => setSupabaseTableName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Leave blank to auto-scan common tables, or type your exact Supabase table name.
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handlePushToSupabase}
                    disabled={isPushingSupabase || isSyncingSupabase}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <Upload className={`w-4 h-4 ${isPushingSupabase ? 'animate-bounce' : ''}`} />
                    <span>{isPushingSupabase ? 'Pushing...' : 'Push Local to Cloud'}</span>
                  </button>
                  <button
                    onClick={handleSaveAndSyncSupabase}
                    disabled={isSyncingSupabase || isPushingSupabase}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                    <span>{isSyncingSupabase ? 'Pulling...' : 'Fetch All from Cloud'}</span>
                  </button>
                </div>
              </div>

              {syncLogs.length > 0 && (
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-slate-400 pb-1 border-b border-slate-800">
                    <span>Supabase Query Diagnostics</span>
                    <button
                      onClick={() => setShowLogs(!showLogs)}
                      className="text-xs text-indigo-400 hover:underline cursor-pointer"
                    >
                      {showLogs ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  {showLogs && (
                    <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                      {syncLogs.map((log, idx) => (
                        <div key={idx} className="leading-tight text-slate-300">
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Tips if no records are found:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                  <li><strong>Check Table Name</strong>: If your table has a custom name (e.g. <code className="text-emerald-600 font-mono">my_expenses</code> or <code className="text-emerald-600 font-mono">records</code>), type it into the Table Name field above.</li>
                  <li><strong>Row Level Security (RLS)</strong>: In your Supabase dashboard &gt; Authentication &gt; Policies (or Table Editor), make sure <code className="text-emerald-600 font-mono">SELECT</code> access is enabled for the <code className="text-emerald-600 font-mono">anon</code> role, or temporarily disable RLS on the table to export.</li>
                </ul>
              </div>
            </div>
          )}


          {activeTab === 'migrate' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <span>⚡ Quick 10-Second Transfer from Vercel App</span>
                  </span>
                  <a
                    href="https://budget-tracker-flame-mu.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Open Old App <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-relaxed">
                  Because browser storage is private to each domain, copy your records from your previous app by following these 2 quick steps:
                </p>

                <div className="mt-3 space-y-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    <span>1. On your Vercel tab, press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px]">F12</kbd> (or right click &gt; Inspect &gt; Console) and run:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded text-[11px] font-mono select-all">
                      {migrationScript}
                    </code>
                    <button
                      onClick={handleCopyScript}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedScript ? <ClipboardCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedScript ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    (Alternatively, if your old app has an "Export to JSON" or "Export CSV" button, click that and upload or paste it below).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. Paste Copied Data, JSON, or CSV Content Here:
                </label>
                <textarea
                  rows={4}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Paste clipboard content here (e.g. { ... } or [...] or CSV lines)..."
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-slate-100"
                />
                <button
                  onClick={handlePasteImport}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  Sync & Import All Transactions
                </button>
              </div>

              <div className="relative flex items-center justify-center pt-2">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-semibold absolute">Or Upload File</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,.csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3.5 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 text-center transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Upload .JSON or .CSV File</span>
              </button>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export Ledger Records</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadCSV}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Export to CSV</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Download spreadsheet with all {transactions.length} transactions
                  </p>
                </button>

                <button
                  onClick={handleDownloadJSON}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Full JSON Backup</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Complete snapshot of transactions, categories, budgets & goals
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'utils' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reset & Data Controls</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleResetSample}
                  className="flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Load Sample Dataset</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Data</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Current Ledger: <strong>{transactions.length} transactions</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
