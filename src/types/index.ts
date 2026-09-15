export type TransactionType = 'expense' | 'income';

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';

export type RecurringInterval = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // lucide icon identifier
  color: string; // hex or tailwind color
  budgetLimit?: number; // monthly budget limit for expenses
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // ISO format: YYYY-MM-DD
  description: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  aiAnalysis?: string;
  isTaxDeductible?: boolean;
  isSubscription?: boolean;
  receiptUrl?: string;
  userContext?: string;
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  color: string;
  icon: string;
  notes?: string;
  completedAt?: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rate: number; // vs USD
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // percentage
  totalBudgeted: number;
  budgetRemaining: number;
  budgetUsagePercent: number;
}

export interface DateFilter {
  period: 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface SmartAlert {
  id: string;
  type: 'warning' | 'danger' | 'success' | 'info';
  title: string;
  message: string;
  category?: string;
  icon?: string;
  createdAt: string;
}

export interface PredictiveCashFlowData {
  currentBalance: number;
  dailyVelocity: number;
  projection: Array<{
    days: number;
    date: string;
    balance: number;
  }>;
}

export interface AIInsightsReport {
  grade: string;
  benchmark: string;
  insights: string[];
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: {
    type: string;
    transaction?: Partial<Transaction>;
  };
}
