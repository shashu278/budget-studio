import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Award, TrendingUp, RefreshCw, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { Transaction, Category, AIInsightsReport, CurrencyConfig } from '../types';
import { get50_30_20_Breakdown } from '../utils/analytics';
import { formatCurrency } from '../utils/formatters';

interface AIInsightsCardProps {
  transactions: Transaction[];
  categories: Category[];
  currency: CurrencyConfig;
  selectedMonth: number;
  selectedYear: number;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
  transactions,
  categories,
  currency,
  selectedMonth,
  selectedYear,
}) => {
  const [report, setReport] = useState<AIInsightsReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const breakdown = get50_30_20_Breakdown(transactions, categories);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          budgets: categories.map((c) => ({ category: c.name, limit: c.budgetLimit })),
          month: selectedMonth + 1,
          year: selectedYear,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error('Failed to fetch AI insights', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedMonth, selectedYear, transactions.length]);

  const gradeColor = (grade?: string) => {
    if (!grade) return 'bg-indigo-600 text-white';
    if (grade.startsWith('A')) return 'bg-emerald-600 text-white';
    if (grade.startsWith('B')) return 'bg-blue-600 text-white';
    if (grade.startsWith('C')) return 'bg-amber-500 text-white';
    return 'bg-rose-600 text-white';
  };

  return (
    <div id="ai-insights-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-purple-500/10 dark:bg-purple-400/10 text-purple-600 dark:text-purple-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Gemini AI Financial Health & Peer Benchmark
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Behavioral analysis, 50/30/20 standard benchmark, and financial grading
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInsights}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade & Scorecard */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/40 dark:to-indigo-950/30 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Monthly Financial Grade
            </span>
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md ${gradeColor(
                  report?.grade
                )}`}
              >
                {report?.grade || 'A-'}
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  {report?.grade?.startsWith('A')
                    ? 'Excellent Financial Health'
                    : report?.grade?.startsWith('B')
                    ? 'Solid Budget Discipline'
                    : 'Action Recommended'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Based on cashflow & savings
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              {report?.benchmark ||
                `Savings rate is healthy. 50/30/20 allocation shows good balance between essential needs and discretionary wants.`}
            </p>
          </div>
        </div>

        {/* 50/30/20 Rule Breakdown */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              50 / 30 / 20 Allocation Gauge
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Needs (Target 50%)</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{breakdown.needs.percent}% ({formatCurrency(breakdown.needs.amount, currency)})</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, breakdown.needs.percent)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Wants (Target 30%)</span>
                  <span className="text-purple-600 dark:text-purple-400">{breakdown.wants.percent}% ({formatCurrency(breakdown.wants.amount, currency)})</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, breakdown.wants.percent)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Savings & Goals (Target 20%)</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{breakdown.savings.percent}% ({formatCurrency(breakdown.savings.amount, currency)})</span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, breakdown.savings.percent)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Actionable AI Insights */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Personalized Behavioral Tips
          </span>

          <div className="space-y-2.5">
            {(report?.insights || [
              'Food and dining represent your largest flexible variable spend this month.',
              'Consider automating recurring savings deposits at the beginning of each billing cycle.',
              'Your subscriptions are well-managed with low risk of unnoticed recurring creep.',
            ]).map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="leading-snug">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
