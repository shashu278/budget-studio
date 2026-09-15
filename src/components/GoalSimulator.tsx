import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Calculator, Clock, TrendingDown, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { SavingsGoal, CurrencyConfig } from '../types';
import { formatCurrency } from '../utils/formatters';

interface GoalSimulatorProps {
  goals: SavingsGoal[];
  netMonthlySavings: number;
  currency: CurrencyConfig;
}

export const GoalSimulator: React.FC<GoalSimulatorProps> = ({
  goals,
  netMonthlySavings,
  currency,
}) => {
  const [purchaseAmount, setPurchaseAmount] = useState<string>('250');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    goals.find((g) => g.currentAmount < g.targetAmount)?.id || goals[0]?.id || ''
  );

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const remainingTarget = selectedGoal ? Math.max(0, selectedGoal.targetAmount - selectedGoal.currentAmount) : 0;
  const numPurchase = parseFloat(purchaseAmount) || 0;

  // Monthly savings rate (fallback to $500 if zero to demonstrate)
  const effectiveSavings = netMonthlySavings > 0 ? netMonthlySavings : 0;

  const currentMonths = effectiveSavings > 0 ? remainingTarget / effectiveSavings : null;
  const delayedMonths = effectiveSavings > 0 ? (remainingTarget + numPurchase) / effectiveSavings : null;

  const delayInMonths = delayedMonths && currentMonths ? delayedMonths - currentMonths : 0;
  const delayInDays = Math.round(delayInMonths * 30.4);

  return (
    <div id="goal-simulator-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2.5 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Ripple-Effect Goal Delay Simulator
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulate how an unplanned impulse purchase will postpone your financial milestones
          </p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">
          Create at least one savings goal above to run hypothetical delay simulations.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hypothetical Purchase Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                  {currency.symbol}
                </span>
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Savings Goal to Test
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({formatCurrency(g.currentAmount, currency)} / {formatCurrency(g.targetAmount, currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-center text-center">
            {!selectedGoal || numPurchase <= 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Enter an amount above to simulate timeline delay.
              </div>
            ) : effectiveSavings <= 0 ? (
              <div className="space-y-2">
                <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Current Monthly Savings Velocity is $0 or In Deficit
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Making this {formatCurrency(numPurchase, currency)} purchase now will require borrowing or reducing essential buffers.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={purchaseAmount + selectedGoalId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Goal Delayed by ~{delayInDays} Days
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Based on your net monthly savings of <strong>{formatCurrency(effectiveSavings, currency)}/mo</strong>, spending{' '}
                    <strong>{formatCurrency(numPurchase, currency)}</strong> will push back achieving{' '}
                    <strong>{selectedGoal.name}</strong> by ~{delayInMonths.toFixed(1)} months.
                  </p>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
