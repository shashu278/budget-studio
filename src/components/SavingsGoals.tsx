import { useState } from 'react';
import { SavingsGoal } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Plus, PiggyBank, PlusCircle, MinusCircle, CheckCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  currency: string;
  onOpenAddGoalModal: () => void;
  onOpenDepositModal: (goal: SavingsGoal, actionType: 'deposit' | 'withdraw') => void;
  onDeleteGoal: (goalId: string) => void;
}

export function SavingsGoals({
  goals,
  currency,
  onOpenAddGoalModal,
  onOpenDepositModal,
  onDeleteGoal,
}: SavingsGoalsProps) {
  const [celebratedId, setCelebratedId] = useState<string | null>(null);

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const triggerCelebration = (goal: SavingsGoal) => {
    setCelebratedId(goal.id);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
    });
    setTimeout(() => setCelebratedId(null), 3000);
  };

  return (
    <div id="savings-goals-section" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Savings Goals & Sinking Funds</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
              {goals.length} Active Goals
            </span>
          </div>
          <p className="text-xs text-slate-500">Plan and track your long-term wealth milestones</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-goal"
            onClick={onOpenAddGoalModal}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Goal</span>
          </button>
        </div>
      </div>

      {/* Aggregate Savings Summary */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 sm:p-5 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
            Total Sinking Funds Saved
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            {formatCurrency(totalSaved, currency)}
            <span className="text-slate-400 text-sm sm:text-base font-normal ml-2">
              / {formatCurrency(totalTarget, currency)} target
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-emerald-400 font-semibold block">{overallProgress}% funded</span>
            <span className="text-[11px] text-slate-300">
              {formatCurrency(Math.max(0, totalTarget - totalSaved), currency)} to reach all goals
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
          const isComplete = goal.currentAmount >= goal.targetAmount;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                isComplete
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: goal.color }}
                    >
                      <CategoryIcon iconName={goal.icon} size={20} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{goal.name}</h4>
                      <span className="text-[11px] text-slate-400">{goal.category}</span>
                    </div>
                  </div>

                  {isComplete ? (
                    <button
                      onClick={() => triggerCelebration(goal)}
                      title="Goal accomplished! Click to celebrate"
                      className="p-1 text-emerald-600 bg-emerald-100 rounded-full hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {percent}%
                    </span>
                  )}
                </div>

                {goal.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic line-clamp-1">{goal.notes}</p>
                )}

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-900">{formatCurrency(goal.currentAmount, currency)}</span>
                    <span className="text-slate-500 text-[11px]">Goal: {formatCurrency(goal.targetAmount, currency)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target: {formatDate(goal.targetDate)}</span>
                    <span>{isComplete ? 'Reached!' : `${formatCurrency(remaining, currency)} left`}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenDepositModal(goal, 'deposit')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Deposit</span>
                  </button>
                  <button
                    onClick={() => onOpenDepositModal(goal, 'withdraw')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Withdraw</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove the goal "${goal.name}"?`)) {
                      onDeleteGoal(goal.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-600 text-[11px] font-medium p-1 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
