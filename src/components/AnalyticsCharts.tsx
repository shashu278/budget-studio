import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}

const PALETTE = [
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
];

export function AnalyticsCharts({ transactions, categories, currency }: AnalyticsChartsProps) {
  const [chartView, setChartView] = useState<'category' | 'monthly' | 'daily'>('category');

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // 1. Calculate Category Spending Data (Expenses only)
  const categorySpendingMap: Record<string, { name: string; value: number; color: string; icon: string }> = {};
  let totalExpenseAmount = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'expense') {
      totalExpenseAmount += amt;
      const cat = categoryMap.get(tx.categoryId);
      const catName = cat?.name || 'Uncategorized';
      const catColor = cat?.color || '#64748b';
      const catIcon = cat?.icon || 'Tag';

      if (!categorySpendingMap[tx.categoryId]) {
        categorySpendingMap[tx.categoryId] = {
          name: catName,
          value: 0,
          color: catColor,
          icon: catIcon,
        };
      }
      categorySpendingMap[tx.categoryId].value += amt;
    }
  });

  const categoryPieData = Object.values(categorySpendingMap)
    .sort((a, b) => b.value - a.value)
    .map((item, idx) => ({
      ...item,
      color: item.color || PALETTE[idx % PALETTE.length],
      percentage: totalExpenseAmount > 0 ? Math.round((item.value / totalExpenseAmount) * 100) : 0,
    }));

  // 2. Calculate Monthly Trends (Last 6 Months or from transactions)
  const monthlyDataMap: Record<string, { month: string; income: number; expense: number; net: number }> = {};
  transactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const monthKey = tx.date ? tx.date.substring(0, 7) : 'Unknown'; // YYYY-MM
    if (!monthlyDataMap[monthKey]) {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year) || 2026, (parseInt(month) || 1) - 1, 1);
      const monthLabel = !isNaN(date.getTime())
        ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        : monthKey;
      monthlyDataMap[monthKey] = {
        month: monthLabel,
        income: 0,
        expense: 0,
        net: 0,
      };
    }
    if (tx.type === 'income') {
      monthlyDataMap[monthKey].income += amt;
    } else {
      monthlyDataMap[monthKey].expense += amt;
    }
  });

  const monthlyChartData = Object.keys(monthlyDataMap)
    .sort()
    .map((key) => ({
      ...monthlyDataMap[key],
      net: monthlyDataMap[key].income - monthlyDataMap[key].expense,
    }));

  // 3. Daily Spending Curve (Sorted by date)
  const dailyMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.date) {
        dailyMap[tx.date] = (dailyMap[tx.date] || 0) + amt;
      }
    });

  const sortedDates = Object.keys(dailyMap).sort();
  let cumulative = 0;
  const dailyChartData = sortedDates.map((dateStr) => {
    cumulative += dailyMap[dateStr];
    return {
      date: dateStr.substring(5), // MM-DD
      daily: dailyMap[dateStr],
      cumulative: Math.round(cumulative),
    };
  });

  return (
    <div id="analytics-section" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Spending & Cash Flow Analytics</h3>
          <p className="text-xs text-slate-500">Visual breakdown of your financial allocations and trends</p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            id="btn-chart-category"
            onClick={() => setChartView('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              chartView === 'category' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
          <button
            id="btn-chart-monthly"
            onClick={() => setChartView('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              chartView === 'monthly' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cash Flow</span>
          </button>
          <button
            id="btn-chart-daily"
            onClick={() => setChartView('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              chartView === 'daily' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Daily Velocity</span>
          </button>
        </div>
      </div>

      {/* Chart Views */}
      {chartView === 'category' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="lg:col-span-6 h-64 sm:h-72 w-full">
            {categoryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number | string | undefined) => [
                      formatCurrency(typeof val === 'number' ? val : Number(val || 0), currency),
                      'Spent',
                    ]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No expense data for this period
              </div>
            )}
          </div>

          {/* Category Share List */}
          <div className="lg:col-span-6 space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Top Expense Categories
            </div>
            {categoryPieData.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon iconName={cat.icon} size={14} className="text-white" />
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 block truncate">{cat.name}</span>
                    <span className="text-[11px] text-slate-400">{cat.percentage}% of total</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-slate-900 block">{formatCurrency(cat.value, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {chartView === 'monthly' && (
        <div className="h-72 w-full">
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: number | string | undefined) => [
                    formatCurrency(typeof val === 'number' ? val : Number(val || 0), currency),
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Not enough data for monthly trends
            </div>
          )}
        </div>
      )}

      {chartView === 'daily' && (
        <div className="h-72 w-full">
          {dailyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: number | string | undefined) => [
                    formatCurrency(typeof val === 'number' ? val : Number(val || 0), currency),
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Spending"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCumulative)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No daily expense trends for this selection
            </div>
          )}
        </div>
      )}
    </div>
  );
}
