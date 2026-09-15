import { Transaction, Category, PredictiveCashFlowData } from '../types';

/**
 * Predict cash flow for the next 90 days based on:
 * 1. Current liquid balance
 * 2. 30-day non-recurring expense burn velocity
 * 3. Scheduled recurring incomes and expenses (daily, weekly, monthly, yearly)
 */
export function getPredictiveCashFlow(transactions: Transaction[]): PredictiveCashFlowData {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Settled transactions up to today
  const settled = transactions.filter((t) => t.date <= todayStr);

  const totalIncome = settled
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const totalExpense = settled
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  let currentBalance = totalIncome - totalExpense;

  // Recurring transactions
  const recurring = transactions.filter((t) => t.isRecurring || t.isSubscription);

  // 30-day burn velocity of non-recurring expenses
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentNonRecurringExpenses = settled
    .filter(
      (t) =>
        t.type === 'expense' &&
        !t.isRecurring &&
        !t.isSubscription &&
        new Date(t.date) >= thirtyDaysAgo
    )
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const dailyVelocity = recentNonRecurringExpenses > 0 ? recentNonRecurringExpenses / 30 : 25;

  const projection: Array<{ days: number; date: string; balance: number }> = [];
  let runningBalance = currentBalance;

  for (let i = 1; i <= 90; i++) {
    const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    runningBalance -= dailyVelocity;

    recurring.forEach((t) => {
      const seedDate = new Date(t.date);
      let hitsToday = false;

      if (futureDate >= seedDate) {
        const interval = t.recurringInterval || 'monthly';
        if (interval === 'daily') {
          hitsToday = true;
        } else if (interval === 'weekly') {
          hitsToday = futureDate.getDay() === seedDate.getDay();
        } else if (interval === 'biweekly') {
          const diffDays = Math.floor((futureDate.getTime() - seedDate.getTime()) / (1000 * 60 * 60 * 24));
          hitsToday = diffDays % 14 === 0;
        } else if (interval === 'yearly') {
          hitsToday =
            futureDate.getMonth() === seedDate.getMonth() &&
            futureDate.getDate() === seedDate.getDate();
        } else {
          // Monthly default
          hitsToday = futureDate.getDate() === seedDate.getDate();
        }
      }

      if (hitsToday) {
        if (t.type === 'income') {
          runningBalance += Math.abs(Number(t.amount));
        } else {
          runningBalance -= Math.abs(Number(t.amount));
        }
      }
    });

    if (i === 15 || i === 30 || i === 45 || i === 60 || i === 75 || i === 90) {
      projection.push({
        days: i,
        date: futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: Math.round(runningBalance * 100) / 100,
      });
    }
  }

  return {
    currentBalance: Math.round(currentBalance * 100) / 100,
    dailyVelocity: Math.round(dailyVelocity * 100) / 100,
    projection,
  };
}

/**
 * Calculates tracking streak in consecutive days with activity
 */
export function getTrackingStreak(transactions: Transaction[]): number {
  if (!transactions.length) return 0;

  const dates = new Set(transactions.map((t) => t.date));
  let streak = 0;
  let currentCheck = new Date();

  const todayStr = currentCheck.toISOString().split('T')[0];
  currentCheck.setDate(currentCheck.getDate() - 1);
  const yesterdayStr = currentCheck.toISOString().split('T')[0];

  if (!dates.has(todayStr) && !dates.has(yesterdayStr)) {
    return 0;
  }

  currentCheck = new Date(dates.has(todayStr) ? todayStr : yesterdayStr);

  while (true) {
    const checkStr = currentCheck.toISOString().split('T')[0];
    if (dates.has(checkStr)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Breakdown by 50/30/20 Rule: Needs (50%), Wants (30%), Savings (20%)
 */
export function get50_30_20_Breakdown(transactions: Transaction[], categories: Category[]) {
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const expenses = transactions.filter((t) => t.type === 'expense');

  let needsAmount = 0;
  let wantsAmount = 0;

  const needKeywords = /housing|rent|mortgage|grocer|food & dining|utilit|bill|health|medical|transport|fuel|insurance/i;

  expenses.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const cat = catMap.get(t.categoryId);
    const catName = cat ? cat.name : '';
    if (needKeywords.test(catName) || needKeywords.test(t.description)) {
      needsAmount += amt;
    } else {
      wantsAmount += amt;
    }
  });

  const totalExpense = needsAmount + wantsAmount;
  const netSavings = Math.max(0, totalIncome - totalExpense);

  const totalBase = totalIncome > 0 ? totalIncome : totalExpense || 1;

  return {
    needs: {
      amount: needsAmount,
      percent: Math.round((needsAmount / totalBase) * 100),
      targetPercent: 50,
    },
    wants: {
      amount: wantsAmount,
      percent: Math.round((wantsAmount / totalBase) * 100),
      targetPercent: 30,
    },
    savings: {
      amount: netSavings,
      percent: Math.round((netSavings / totalBase) * 100),
      targetPercent: 20,
    },
  };
}
