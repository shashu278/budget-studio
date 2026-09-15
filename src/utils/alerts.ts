import { Transaction, Category, SavingsGoal, SmartAlert } from '../types';

export function generateId(): string {
  return 'alert-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Checks for subscription price hikes / price creep
 */
export function checkSubscriptionCreep(transactions: Transaction[]): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const subscriptionMap: { [key: string]: Transaction[] } = {};

  transactions
    .filter((t) => t.type === 'expense' && (t.isSubscription || /subscription|membership|plan|monthly/i.test(t.description)))
    .forEach((t) => {
      const key = (t.merchant || t.description || t.categoryId).toLowerCase().trim();
      if (!subscriptionMap[key]) {
        subscriptionMap[key] = [];
      }
      subscriptionMap[key].push(t);
    });

  Object.keys(subscriptionMap).forEach((key) => {
    const subs = subscriptionMap[key];
    subs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (subs.length >= 2) {
      const latest = subs[0];
      const previous = subs[1];
      const latestAmt = Number(latest.amount) || 0;
      const prevAmt = Number(previous.amount) || 0;

      // If latest is > 5% higher than previous
      if (prevAmt > 0 && latestAmt > prevAmt * 1.05) {
        const diff = latestAmt - prevAmt;
        alerts.push({
          id: `creep-${latest.id}`,
          type: 'warning',
          title: 'Subscription Price Hike Detected',
          message: `Recent charge for ${latest.merchant || latest.description} was $${latestAmt.toFixed(2)}, which is $${diff.toFixed(2)} (+${Math.round((diff / prevAmt) * 100)}%) higher than previous billing ($${prevAmt.toFixed(2)}).`,
          category: 'subscription',
          icon: 'TrendingUp',
          createdAt: new Date().toISOString(),
        });
      }
    }
  });

  return alerts;
}

/**
 * Check for budget limit threshold warnings (80% and 100%)
 */
export function checkBudgetAlerts(
  transactions: Transaction[],
  categories: Category[],
  periodTransactions: Transaction[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  const spendingByCategory: { [catId: string]: number } = {};
  periodTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const amt = Number(t.amount) || 0;
      spendingByCategory[t.categoryId] = (spendingByCategory[t.categoryId] || 0) + amt;
    });

  categories
    .filter((c) => c.type === 'expense' && c.budgetLimit && Number(c.budgetLimit) > 0)
    .forEach((c) => {
      const spent = spendingByCategory[c.id] || 0;
      const limit = Number(c.budgetLimit) || 0;
      const percent = (spent / limit) * 100;

      if (percent >= 100) {
        alerts.push({
          id: `budget-over-${c.id}`,
          type: 'danger',
          title: `${c.name} Over Budget`,
          message: `You have spent $${spent.toFixed(2)} of your $${limit.toFixed(2)} limit (${Math.round(percent)}%). Consider pausing non-essential spending.`,
          category: c.id,
          icon: 'AlertTriangle',
          createdAt: new Date().toISOString(),
        });
      } else if (percent >= 80) {
        alerts.push({
          id: `budget-warn-${c.id}`,
          type: 'warning',
          title: `${c.name} Budget Warning`,
          message: `You have reached ${Math.round(percent)}% ($${spent.toFixed(2)} / $${limit.toFixed(2)}) of your monthly cap.`,
          category: c.id,
          icon: 'AlertCircle',
          createdAt: new Date().toISOString(),
        });
      }
    });

  return alerts;
}

/**
 * Check for goal milestone celebrations
 */
export function checkGoalMilestones(goals: SavingsGoal[]): SmartAlert[] {
  const alerts: SmartAlert[] = [];

  goals.forEach((goal) => {
    const targetAmt = Number(goal.targetAmount) || 0;
    const currentAmt = Number(goal.currentAmount) || 0;
    if (targetAmt <= 0) return;
    const percentage = (currentAmt / targetAmt) * 100;

    if (percentage >= 100) {
      alerts.push({
        id: `goal-100-${goal.id}`,
        type: 'success',
        title: 'Goal Achieved! 🎉',
        message: `Congratulations! You've reached 100% of your "${goal.name}" target ($${currentAmt.toFixed(2)}).`,
        category: 'goal',
        icon: 'Award',
        createdAt: new Date().toISOString(),
      });
    } else if (percentage >= 75) {
      alerts.push({
        id: `goal-75-${goal.id}`,
        type: 'info',
        title: 'Goal Milestone: 75% Reached',
        message: `You're in the final stretch for "${goal.name}" ($${currentAmt.toFixed(2)} / $${targetAmt.toFixed(2)}).`,
        category: 'goal',
        icon: 'TrendingUp',
        createdAt: new Date().toISOString(),
      });
    } else if (percentage >= 50) {
      alerts.push({
        id: `goal-50-${goal.id}`,
        type: 'info',
        title: 'Goal Halfway Reached (50%)',
        message: `You're halfway to reaching your "${goal.name}" milestone!`,
        category: 'goal',
        icon: 'Star',
        createdAt: new Date().toISOString(),
      });
    }
  });

  return alerts;
}

/**
 * Check for Micro-Savings Sweep opportunities (end of month surplus)
 */
export function checkMicroSavingsSweeps(
  categories: Category[],
  periodTransactions: Transaction[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Highlight sweeps in the last 7 days of the month
  if (today.getDate() < daysInMonth - 7) return alerts;

  const spendingByCategory: { [catId: string]: number } = {};
  periodTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const amt = Number(t.amount) || 0;
      spendingByCategory[t.categoryId] = (spendingByCategory[t.categoryId] || 0) + amt;
    });

  let totalSurplus = 0;
  categories
    .filter((c) => c.type === 'expense' && c.budgetLimit && Number(c.budgetLimit) > 0)
    .forEach((c) => {
      const spent = spendingByCategory[c.id] || 0;
      const remaining = (Number(c.budgetLimit) || 0) - spent;
      if (remaining > 25) {
        totalSurplus += remaining;
      }
    });

  if (totalSurplus > 50) {
    alerts.push({
      id: `sweep-month-${today.getMonth()}-${today.getFullYear()}`,
      type: 'success',
      title: 'Micro-Savings Sweep Opportunity',
      message: `You have an estimated $${totalSurplus.toFixed(2)} unspent surplus across your categories this month. Sweep it into your savings goals!`,
      category: 'savings',
      icon: 'PiggyBank',
      createdAt: new Date().toISOString(),
    });
  }

  return alerts;
}
