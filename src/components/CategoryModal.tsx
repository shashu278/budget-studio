import React, { useState, useEffect } from 'react';
import { Category, TransactionType } from '../types';
import { CategoryIcon, AVAILABLE_ICONS } from './CategoryIcon';
import { X, Check } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Omit<Category, 'id'>, existingId?: string) => void;
  initialCategory?: Category | null;
  currencySymbol: string;
}

const COLOR_SWATCHES = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#64748b',
  '#0284c7',
  '#d97706',
  '#e11d48',
  '#475569',
];

const POPULAR_ICONS = [
  'Home',
  'ShoppingCart',
  'Utensils',
  'Car',
  'Zap',
  'Film',
  'HeartPulse',
  'ShoppingBag',
  'GraduationCap',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'DollarSign',
  'Gift',
  'ShieldCheck',
  'Plane',
  'Coffee',
  'Smartphone',
  'PiggyBank',
  'Award',
  'Tag',
  'CreditCard',
  'Building',
  'Music',
  'Heart',
  'BookOpen',
  'Wifi',
];

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  currencySymbol,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#6366f1');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setType(initialCategory.type);
      setIcon(initialCategory.icon);
      setColor(initialCategory.color);
      setBudgetLimit(initialCategory.budgetLimit ? String(initialCategory.budgetLimit) : '');
    } else {
      setName('');
      setType('expense');
      setIcon('Tag');
      setColor('#6366f1');
      setBudgetLimit('');
    }
    setError('');
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    const limitNum = budgetLimit ? parseFloat(budgetLimit) : undefined;
    if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 0)) {
      setError('Please enter a valid budget limit');
      return;
    }

    onSave(
      {
        name: name.trim(),
        type,
        icon,
        color,
        budgetLimit: type === 'expense' ? limitNum : undefined,
      },
      initialCategory ? initialCategory.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialCategory ? 'Edit Category' : 'Create New Category'}
            </h3>
            <p className="text-xs text-slate-500">Configure visual badges and spending caps</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {error}
            </div>
          )}

          {/* Type Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                type === 'expense' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                type === 'income' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Income Category
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g., Subscriptions, Coffee, Side Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Monthly Budget Cap (For Expense) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly Budget Limit ({currencySymbol})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Optional spending target (e.g., 300)"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          )}

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Badge Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center cursor-pointer ${
                    color === swatch ? 'ring-2 ring-slate-900 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch }}
                >
                  {color === swatch && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category Icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl">
              {POPULAR_ICONS.map((iconKey) => {
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <CategoryIcon iconName={iconKey} size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {initialCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
