import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface SummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  totalBudgeted: number;
  currency: string;
  totalBalance: number;
  savingsCount: number;
  savingsTotal: number;
}

export function SummaryCards({
  totalIncome,
  totalExpense,
  totalBudgeted,
  currency,
  totalBalance,
  savingsCount,
  savingsTotal,
}: SummaryCardsProps) {
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const budgetRemaining = totalBudgeted - totalExpense;
  const budgetPercentUsed = totalBudgeted > 0 ? Math.round((totalExpense / totalBudgeted) * 100) : 0;

  return (
    <div id="summary-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Balance / Net Worth */}
      <div id="card-total-balance" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Net Cash Flow
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className={`text-2xl font-bold tracking-tight ${netSavings >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(netSavings, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {netSavings >= 0 ? (
              <span className="inline-flex items-center text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                Positive
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                Deficit
              </span>
            )}
            <span className="text-slate-500">Total lifetime: {formatCurrency(totalBalance, currency)}</span>
          </div>
        </div>
      </div>

      {/* Total Income */}
      <div id="card-total-income" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Income
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-emerald-600">
            +{formatCurrency(totalIncome, currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Savings Rate</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              {savingsRate}% saved
            </span>
          </div>
        </div>
      </div>

      {/* Total Expenses */}
      <div id="card-total-expenses" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Expenses
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            -{formatCurrency(totalExpense, currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Budget Utilized</span>
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                budgetPercentUsed > 100
                  ? 'bg-rose-100 text-rose-700'
                  : budgetPercentUsed > 85
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {budgetPercentUsed}% of {formatCurrency(totalBudgeted, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Savings & Budget Health */}
      <div id="card-savings-health" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Budget Balance & Goals
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(budgetRemaining, currency)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            {budgetRemaining >= 0 ? (
              <span className="inline-flex items-center text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Under Budget
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-600 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Over by {formatCurrency(Math.abs(budgetRemaining), currency)}
              </span>
            )}
            <span>• {savingsCount} active goals ({formatCurrency(savingsTotal, currency)})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
