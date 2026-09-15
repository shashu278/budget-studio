import React from 'react';
import {
  Wallet,
  Plus,
  Download,
  Github,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Activity,
  Receipt,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../utils/formatters';
import { DateFilter } from '../types';

interface HeaderProps {
  currentCurrency: string;
  onCurrencyChange: (code: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onOpenAddModal: () => void;
  onOpenReceiptScanner: () => void;
  onOpenExportModal: () => void;
  onOpenGithubModal: () => void;
  onOpenAccountModal: () => void;
  isCloudSignedIn: boolean;
  activeTab: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'forecast' | 'analytics';
  onTabChange: (tab: 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'forecast' | 'analytics') => void;
}

export function Header({
  currentCurrency,
  onCurrencyChange,
  dateFilter,
  onDateFilterChange,
  onOpenAddModal,
  onOpenReceiptScanner,
  onOpenExportModal,
  onOpenGithubModal,
  onOpenAccountModal,
  isCloudSignedIn,
  activeTab,
  onTabChange,
}: HeaderProps) {
  return (
    <header id="main-header" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* App Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                  Budget Tracker
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> AI Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                Predictive Cash Flow, Receipt OCR, Auto-Balancing & Smart Alerts
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Period Selector */}
            <div className="relative hidden md:flex items-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 dark:bg-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <select
                  id="period-select"
                  aria-label="Filter transactions by time period"
                  value={dateFilter.period}
                  onChange={(e) =>
                    onDateFilterChange({
                      period: e.target.value as DateFilter['period'],
                    })
                  }
                  className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="this_month">Current Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="this_year">This Year</option>
                  <option value="all">All Time (Full Ledger)</option>
                </select>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center">
              <select
                id="currency-select"
                aria-label="Select display currency"
                value={currentCurrency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Account / Cloud Sync Status */}
            <button
              id="btn-account"
              onClick={onOpenAccountModal}
              title={isCloudSignedIn ? 'Signed in — synced across your devices' : 'Sign in to sync across devices'}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                isCloudSignedIn
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isCloudSignedIn ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
              <span className="hidden lg:inline">{isCloudSignedIn ? 'Synced' : 'Sign In'}</span>
            </button>

            {/* Receipt Scan Quick Button */}
            <button
              id="btn-scan-receipt-header"
              onClick={onOpenReceiptScanner}
              title="Scan Receipt with Gemini AI"
              className="p-2 sm:px-3 sm:py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
            >
              <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden lg:inline">Scan Receipt</span>
            </button>

            {/* Export / Data Backup */}
            <button
              id="btn-export-hub"
              onClick={onOpenExportModal}
              title="Migrate from Vercel / Import & Export Data"
              className="p-2 sm:px-3 sm:py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Migrate & Sync</span>
            </button>

            {/* GitHub Info Button */}
            <button
              id="btn-github-info"
              onClick={onOpenGithubModal}
              title="GitHub Code & Repo"
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Github className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">GitHub Repo</span>
            </button>

            {/* Add Transaction Button */}
            <button
              id="btn-add-transaction-header"
              onClick={onOpenAddModal}
              className="px-3 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Overview', icon: Layers },
            { id: 'transactions', label: 'Transactions', icon: Wallet },
            { id: 'budgets', label: 'Category Budgets', icon: Sparkles },
            { id: 'goals', label: 'Savings Goals', icon: TrendingUp },
            { id: 'forecast', label: '90-Day Cash Flow & Simulator', icon: Activity },
            { id: 'analytics', label: 'AI Health & Analytics', icon: Sparkles },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
