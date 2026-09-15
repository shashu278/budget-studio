import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertOctagon, TrendingUp, Sparkles, Clock, Check, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { Transaction, CurrencyConfig } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PurchaseInterceptorModalProps {
  isOpen: boolean;
  transaction: Omit<Transaction, 'id' | 'createdAt'> | null;
  currency: CurrencyConfig;
  onCancel: () => void;
  onConfirm: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const PurchaseInterceptorModal: React.FC<PurchaseInterceptorModalProps> = ({
  isOpen,
  transaction,
  currency,
  onCancel,
  onConfirm,
}) => {
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !transaction) return;

    let isMounted = true;
    setLoading(true);

    const fetchWarning = async () => {
      try {
        const res = await fetch('/api/gemini/intercept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: transaction.amount,
            category: transaction.categoryId,
            merchant: transaction.merchant,
            description: transaction.description,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setWarningMessage(data.message);
          }
        }
      } catch (e) {
        console.error('Failed to get opportunity warning', e);
        if (isMounted) {
          const hours = (transaction.amount / 25).toFixed(1);
          const compound10Yr = (transaction.amount * Math.pow(1.07, 10)).toFixed(2);
          setWarningMessage(
            `Spending $${transaction.amount.toFixed(2)} equals approx. ${hours} hours of working time. Invested at 7% return, it would grow to $${compound10Yr} in 10 years.`
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWarning();

    return () => {
      isMounted = false;
    };
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const hoursOfLabor = (transaction.amount / 25).toFixed(1);
  const tenYearGrowth = (transaction.amount * Math.pow(1.07, 10)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-amber-600 p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <AlertOctagon className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Mindful Cooling-Off Check</h2>
          <p className="text-xs text-rose-100 mt-1">
            Large Purchase Intercept: {formatCurrency(transaction.amount, currency)}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Labor Required</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ~{hoursOfLabor} hrs
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">10-Yr Invested Value</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ${tenYearGrowth}
              </span>
            </div>
          </div>

          {/* AI Opportunity Cost Message */}
          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-rose-700 dark:text-rose-300 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Opportunity Cost Analysis</span>
            </div>

            {loading ? (
              <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <span className="animate-pulse">Gemini is analyzing financial opportunity tradeoffs...</span>
              </div>
            ) : (
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{warningMessage}"
              </p>
            )}
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Item: <span className="font-semibold text-slate-700 dark:text-slate-200">{transaction.description || transaction.merchant || 'Expense'}</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" /> Wait, I'll Save the Money
            </button>
            <button
              type="button"
              onClick={() => onConfirm(transaction)}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
