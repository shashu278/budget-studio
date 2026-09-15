import { useState } from 'react';
import { Category, Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Plus, Edit2, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface BudgetOverviewProps {
  categories: Category[];
  transactions: Transaction[];
  currency: string;
  onUpdateCategoryBudget: (categoryId: string, newLimit: number) => void;
  onOpenAddCategoryModal: () => void;
  onOpenEditCategoryModal: (category: Category) => void;
}

export function BudgetOverview({
  categories,
  transactions,
  currency,
  onUpdateCategoryBudget,
  onOpenAddCategoryModal,
  onOpenEditCategoryModal,
}: BudgetOverviewProps) {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<string>('');

  // Only expense categories have budgets
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Compute spend per category in current period
  const spendMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const amt = Number(t.amount) || 0;
      spendMap[t.categoryId] = (spendMap[t.categoryId] || 0) + amt;
    });

  const totalBudgeted = expenseCategories.reduce((acc, c) => acc + (Number(c.budgetLimit) || 0), 0);
  const totalSpent = expenseCategories.reduce((acc, c) => acc + (Number(spendMap[c.id]) || 0), 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setTempLimit(String(cat.budgetLimit || 0));
  };

  const handleSaveEdit = (catId: string) => {
    const num = parseFloat(tempLimit);
    if (!isNaN(num) && num >= 0) {
      onUpdateCategoryBudget(catId, num);
    }
    setEditingCatId(null);
  };

  return (
    <div id="budget-overview-section" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* Top Banner & Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Monthly Category Budgets</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700">
              {expenseCategories.length} Categories
            </span>
          </div>
          <p className="text-xs text-slate-500">Track and cap your monthly spending targets</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-category"
            onClick={onOpenAddCategoryModal}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between text-xs mb-2 font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-bold">Total Monthly Budget Utilization</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                overallPercentage > 100
                  ? 'bg-rose-100 text-rose-700'
                  : overallPercentage > 85
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {overallPercentage}%
            </span>
          </div>
          <div className="text-slate-600">
            <span className="font-bold text-slate-900">{formatCurrency(totalSpent, currency)}</span> of{' '}
            <span>{formatCurrency(totalBudgeted, currency)}</span>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage > 100
                ? 'bg-rose-500'
                : overallPercentage > 85
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>{totalBudgeted - totalSpent >= 0 ? 'Safe remaining:' : 'Over budget by:'}</span>
          <span className={`font-semibold ${totalBudgeted - totalSpent >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatCurrency(Math.abs(totalBudgeted - totalSpent), currency)}
          </span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {expenseCategories.map((category) => {
          const spent = spendMap[category.id] || 0;
          const limit = category.budgetLimit || 0;
          const remaining = limit - spent;
          const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          const isOver = spent > limit && limit > 0;
          const isWarning = percent >= 85 && percent <= 100;
          const isEditing = editingCatId === category.id;

          return (
            <div
              key={category.id}
              className={`p-4 rounded-xl border transition-all ${
                isOver
                  ? 'border-rose-200 bg-rose-50/20'
                  : isWarning
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: category.color }}
                  >
                    <CategoryIcon iconName={category.icon} size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-sm">{category.name}</span>
                      <button
                        onClick={() => onOpenEditCategoryModal(category)}
                        title="Edit category settings"
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isOver ? (
                        <span className="text-rose-600 font-semibold inline-flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Over by {formatCurrency(Math.abs(remaining), currency)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-slate-500">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {formatCurrency(remaining, currency)} left
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Right: Budget Limit Setting */}
                <div className="text-right">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={tempLimit}
                        onChange={(e) => setTempLimit(e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-bold border border-indigo-400 rounded focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(category.id);
                          if (e.key === 'Escape') setEditingCatId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveEdit(category.id)}
                        className="px-2 py-1 bg-indigo-600 text-white rounded text-[11px] font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(category)}
                      className="group flex flex-col items-end cursor-pointer"
                      title="Click to edit budget limit"
                    >
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {formatCurrency(spent, currency)}{' '}
                        <span className="text-slate-400 font-normal">/ {formatCurrency(limit, currency)}</span>
                      </span>
                      <span className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        click to edit cap
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Progress meter */}
              <div className="mt-3">
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{percent}% spent</span>
                  <span>Cap: {formatCurrency(limit, currency)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
