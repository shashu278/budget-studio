import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Activity, TrendingUp, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { Transaction, CurrencyConfig } from '../types';
import { getPredictiveCashFlow } from '../utils/analytics';
import { formatCurrency } from '../utils/formatters';

interface PredictiveCashFlowCardProps {
  transactions: Transaction[];
  currency: CurrencyConfig;
}

export const PredictiveCashFlowCard: React.FC<PredictiveCashFlowCardProps> = ({
  transactions,
  currency,
}) => {
  const { currentBalance, dailyVelocity, projection } = getPredictiveCashFlow(transactions);

  const chartData = [
    {
      days: 0,
      date: 'Today',
      balance: currentBalance,
    },
    ...projection,
  ];

  const minProjected = Math.min(...chartData.map((d) => d.balance));
  const isNegativeForecast = minProjected < 0;

  return (
    <div id="predictive-cashflow-card" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              90-Day Predictive Cash Flow
              {isNegativeForecast && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Deficit Risk
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Forward projection factoring 30-day velocity ({formatCurrency(dailyVelocity, currency)}/day) & recurring schedules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>Liquid Balance: <strong>{formatCurrency(currentBalance, currency)}</strong></span>
          </div>
        </div>
      </div>

      <div className="h-56 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => `${currency.symbol}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                      <p className="text-slate-400 font-medium">{data.date}</p>
                      <p className="text-sm font-bold mt-0.5 text-indigo-300">
                        {formatCurrency(data.balance, currency)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {data.days === 0 ? 'Starting balance' : `Projected at day +${data.days}`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#4f46e5' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
        {projection.slice(0, 3).map((p) => (
          <div key={p.days} className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{p.days} Days ({p.date})</span>
            <span
              className={`text-xs font-bold ${
                p.balance >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(p.balance, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
