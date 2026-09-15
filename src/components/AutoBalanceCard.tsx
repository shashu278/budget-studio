import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Category, Transaction, CurrencyConfig } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AutoBalanceCardProps {
  categories: Category[];
  transactions: Transaction[];
  currency: CurrencyConfig;
  onUpdateCategories: (updatedCategories: Category[]) => void;
}

export const AutoBalanceCard: React.FC<AutoBalanceCardProps> = ({
  categories,
  transactions,
  currency,
  onUpdateCategories,
}) => {
  const [isBalancing, setIsBalancing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Calculate spending per category for current period
  const spendingMap: { [catId: string]: number } = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      spendingMap[t.categoryId] = (spendingMap[t.categoryId] || 0) + t.amount;
    });

  const expenseCategories = categories.filter((c) => c.type === 'expense' && (c.budgetLimit || 0) > 0);

  const overBudgetCats = expenseCategories
    .filter((c) => (spendingMap[c.id] || 0) > (c.budgetLimit || 0))
    .map((c) => ({
      ...c,
      spent: spendingMap[c.id] || 0,
      excess: (spendingMap[c.id] || 0) - (c.budgetLimit || 0),
    }));

  const underBudgetCats = expenseCategories
    .filter((c) => (spendingMap[c.id] || 0) < (c.budgetLimit || 0))
    .map((c) => ({
      ...c,
      spent: spendingMap[c.id] || 0,
      available: (c.budgetLimit || 0) - (spendingMap[c.id] || 0),
    }));

  const totalOver = overBudgetCats.reduce((s, c) => s + c.excess, 0);
  const totalAvailable = underBudgetCats.reduce((s, c) => s + c.available, 0);

  const handleAutoBalance = () => {
    setIsBalancing(true);
    setResultMessage(null);

    setTimeout(() => {
      let totalShifted = 0;
      const updatedCategories = [...categories];

      // Clone working objects
      const overWorking = overBudgetCats.map((c) => ({ ...c }));
      const underWorking = underBudgetCats.map((c) => ({ ...c }));

      for (const over of overWorking) {
        for (const under of underWorking) {
          if (over.excess <= 0 || under.available <= 0) continue;

          const shift = Math.min(over.excess, under.available);
          over.excess -= shift;
          under.available -= shift;
          totalShifted += shift;

          // Update limits in updatedCategories
          const overIdx = updatedCategories.findIndex((c) => c.id === over.id);
          const underIdx = updatedCategories.findIndex((c) => c.id === under.id);

          if (overIdx !== -1) {
            updatedCategories[overIdx] = {
              ...updatedCategories[overIdx],
              budgetLimit: (updatedCategories[overIdx].budgetLimit || 0) + shift,
            };
          }

          if (underIdx !== -1) {
            updatedCategories[underIdx] = {
              ...updatedCategories[underIdx],
              budgetLimit: Math.max(0, (updatedCategories[underIdx].budgetLimit || 0) - shift),
            };
          }
        }
      }

      onUpdateCategories(updatedCategories);
      setIsBalancing(false);
      setResultMessage(
        `Successfully reallocated ${formatCurrency(totalShifted, currency)} from surplus categories to cover overspent limits!`
      );
    }, 600);
  };

  return (
    <div id="autobalance-card" className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-indigo-50/80 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              AI Budget Auto-Balancing
              {totalOver > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold">
                  {formatCurrency(totalOver, currency)} Overspending Detected
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Automatically shift surplus allocation from under-utilized categories to cover over-budget items without increasing overall spend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoBalance}
          disabled={isBalancing || totalOver === 0 || totalAvailable === 0}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isBalancing ? 'animate-spin' : ''}`} />
          {isBalancing ? 'Rebalancing...' : 'Auto-Balance Caps'}
        </button>
      </div>

      <AnimatePresence>
        {resultMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{resultMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
