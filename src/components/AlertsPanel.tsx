import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Award,
  PiggyBank,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SmartAlert } from '../types';

interface AlertsPanelProps {
  alerts: SmartAlert[];
  onDismissAlert?: (id: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onDismissAlert }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeAlerts = alerts.filter((a) => !dismissedIds.has(a.id));

  if (activeAlerts.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    if (onDismissAlert) onDismissAlert(id);
  };

  const getIcon = (type: SmartAlert['type'], iconName?: string) => {
    if (iconName === 'TrendingUp') return <TrendingUp className="w-4 h-4 text-amber-500" />;
    if (iconName === 'Award') return <Award className="w-4 h-4 text-emerald-500" />;
    if (iconName === 'PiggyBank') return <PiggyBank className="w-4 h-4 text-indigo-500" />;
    if (type === 'danger') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (type === 'warning') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <Bell className="w-4 h-4 text-indigo-500" />;
  };

  const getBgClass = (type: SmartAlert['type']) => {
    if (type === 'danger') return 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50';
    if (type === 'warning') return 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50';
    if (type === 'success') return 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50';
    return 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50';
  };

  return (
    <div id="smart-alerts-panel" className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Smart Alerts & Proactive Notifications ({activeAlerts.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {activeAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 shadow-sm ${getBgClass(
                  alert.type
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-2xs mt-0.5">
                    {getIcon(alert.type, alert.icon)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismiss(alert.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors shrink-0"
                  title="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
