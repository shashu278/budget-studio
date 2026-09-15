import { Category, Transaction, SavingsGoal } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { id: 'cat-housing', name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#6366f1', budgetLimit: 1500 },
  { id: 'cat-groceries', name: 'Groceries & Food', type: 'expense', icon: 'ShoppingCart', color: '#10b981', budgetLimit: 600 },
  { id: 'cat-dining', name: 'Dining Out & Cafes', type: 'expense', icon: 'Utensils', color: '#f59e0b', budgetLimit: 350 },
  { id: 'cat-transport', name: 'Transport & Fuel', type: 'expense', icon: 'Car', color: '#3b82f6', budgetLimit: 300 },
  { id: 'cat-utilities', name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#8b5cf6', budgetLimit: 250 },
  { id: 'cat-entertainment', name: 'Entertainment & Fun', type: 'expense', icon: 'Film', color: '#ec4899', budgetLimit: 200 },
  { id: 'cat-health', name: 'Healthcare & Fitness', type: 'expense', icon: 'HeartPulse', color: '#ef4444', budgetLimit: 180 },
  { id: 'cat-shopping', name: 'Shopping & Gear', type: 'expense', icon: 'ShoppingBag', color: '#14b8a6', budgetLimit: 250 },
  { id: 'cat-education', name: 'Education & Books', type: 'expense', icon: 'GraduationCap', color: '#06b6d4', budgetLimit: 100 },
  { id: 'cat-misc-exp', name: 'Miscellaneous', type: 'expense', icon: 'HelpCircle', color: '#64748b', budgetLimit: 150 },

  // Income Categories
  { id: 'cat-salary', name: 'Primary Salary', type: 'income', icon: 'Briefcase', color: '#10b981' },
  { id: 'cat-freelance', name: 'Freelance & Projects', type: 'income', icon: 'Laptop', color: '#3b82f6' },
  { id: 'cat-investments', name: 'Dividends & Capital', type: 'income', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: 'cat-sidehustle', name: 'Side Hustle / Sales', type: 'income', icon: 'DollarSign', color: '#f59e0b' },
  { id: 'cat-gifts', name: 'Gifts & Refunds', type: 'income', icon: 'Gift', color: '#ec4899' },
];

export const DEFAULT_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Emergency Fund (6 Months)',
    targetAmount: 12000,
    currentAmount: 8450,
    targetDate: '2026-12-31',
    category: 'Safety',
    color: '#10b981',
    icon: 'ShieldCheck',
    notes: 'Cover 6 months of fixed living expenses',
  },
  {
    id: 'goal-2',
    name: 'New Electric Vehicle',
    targetAmount: 25000,
    currentAmount: 14200,
    targetDate: '2027-06-30',
    category: 'Vehicle',
    color: '#3b82f6',
    icon: 'Car',
    notes: 'Downpayment for Tesla Model 3 or Ioniq 5',
  },
  {
    id: 'goal-3',
    name: 'Kyoto Autumn Vacation',
    targetAmount: 4500,
    currentAmount: 3800,
    targetDate: '2026-10-15',
    category: 'Travel',
    color: '#ec4899',
    icon: 'Plane',
    notes: 'Flights, Ryokan, and culinary tour',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // August 2026 Income
  {
    id: 'tx-001',
    type: 'income',
    amount: 4800,
    categoryId: 'cat-salary',
    date: '2026-08-01',
    description: 'Monthly Tech Salary - Direct Deposit',
    paymentMethod: 'bank_transfer',
    createdAt: Date.now() - 23 * 86400000,
  },
  {
    id: 'tx-002',
    type: 'income',
    amount: 950,
    categoryId: 'cat-freelance',
    date: '2026-08-12',
    description: 'UI Design System Contract',
    paymentMethod: 'digital_wallet',
    createdAt: Date.now() - 12 * 86400000,
  },
  {
    id: 'tx-003',
    type: 'income',
    amount: 280,
    categoryId: 'cat-investments',
    date: '2026-08-18',
    description: 'Index Fund Dividend Payout',
    paymentMethod: 'bank_transfer',
    createdAt: Date.now() - 6 * 86400000,
  },

  // August 2026 Expenses
  {
    id: 'tx-004',
    type: 'expense',
    amount: 1450,
    categoryId: 'cat-housing',
    date: '2026-08-02',
    description: 'Apartment Monthly Rent & HOA',
    paymentMethod: 'bank_transfer',
    createdAt: Date.now() - 22 * 86400000,
  },
  {
    id: 'tx-005',
    type: 'expense',
    amount: 135.5,
    categoryId: 'cat-groceries',
    date: '2026-08-03',
    description: 'Whole Foods Market - Weekly Stock',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 21 * 86400000,
  },
  {
    id: 'tx-006',
    type: 'expense',
    amount: 65,
    categoryId: 'cat-utilities',
    date: '2026-08-05',
    description: 'High-Speed Fiber Internet Bill',
    paymentMethod: 'debit_card',
    createdAt: Date.now() - 19 * 86400000,
  },
  {
    id: 'tx-007',
    type: 'expense',
    amount: 48.75,
    categoryId: 'cat-dining',
    date: '2026-08-07',
    description: 'Sushi Dinner with Colleagues',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 17 * 86400000,
  },
  {
    id: 'tx-008',
    type: 'expense',
    amount: 55,
    categoryId: 'cat-transport',
    date: '2026-08-09',
    description: 'Shell Gas Station Fill-up',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 15 * 86400000,
  },
  {
    id: 'tx-009',
    type: 'expense',
    amount: 162.2,
    categoryId: 'cat-groceries',
    date: '2026-08-11',
    description: 'Trader Joe\'s Bulk Groceries',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 13 * 86400000,
  },
  {
    id: 'tx-010',
    type: 'expense',
    amount: 29.99,
    categoryId: 'cat-entertainment',
    date: '2026-08-13',
    description: 'Streaming & Music Subscriptions',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 11 * 86400000,
  },
  {
    id: 'tx-011',
    type: 'expense',
    amount: 85,
    categoryId: 'cat-health',
    date: '2026-08-15',
    description: 'Monthly Rock Climbing Gym Membership',
    paymentMethod: 'debit_card',
    createdAt: Date.now() - 9 * 86400000,
  },
  {
    id: 'tx-012',
    type: 'expense',
    amount: 72.4,
    categoryId: 'cat-dining',
    date: '2026-08-17',
    description: 'Weekend Brunch & Espresso Bar',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 7 * 86400000,
  },
  {
    id: 'tx-013',
    type: 'expense',
    amount: 120,
    categoryId: 'cat-shopping',
    date: '2026-08-19',
    description: 'Ergonomic Desk Accessories',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 5 * 86400000,
  },
  {
    id: 'tx-014',
    type: 'expense',
    amount: 110.8,
    categoryId: 'cat-groceries',
    date: '2026-08-21',
    description: 'Farmers Market Fresh Produce',
    paymentMethod: 'digital_wallet',
    createdAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'tx-015',
    type: 'expense',
    amount: 45,
    categoryId: 'cat-education',
    date: '2026-08-23',
    description: 'TypeScript Architecture & Algorithms Book',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 1 * 86400000,
  },

  // July 2026 (Previous Month History)
  {
    id: 'tx-016',
    type: 'income',
    amount: 4800,
    categoryId: 'cat-salary',
    date: '2026-07-01',
    description: 'Monthly Tech Salary',
    paymentMethod: 'bank_transfer',
    createdAt: Date.now() - 54 * 86400000,
  },
  {
    id: 'tx-017',
    type: 'income',
    amount: 600,
    categoryId: 'cat-sidehustle',
    date: '2026-07-15',
    description: 'Vintage Camera Sale on eBay',
    paymentMethod: 'digital_wallet',
    createdAt: Date.now() - 40 * 86400000,
  },
  {
    id: 'tx-018',
    type: 'expense',
    amount: 1450,
    categoryId: 'cat-housing',
    date: '2026-07-02',
    description: 'Apartment Rent',
    paymentMethod: 'bank_transfer',
    createdAt: Date.now() - 53 * 86400000,
  },
  {
    id: 'tx-019',
    type: 'expense',
    amount: 512,
    categoryId: 'cat-groceries',
    date: '2026-07-14',
    description: 'Monthly Groceries Total',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 41 * 86400000,
  },
  {
    id: 'tx-020',
    type: 'expense',
    amount: 280,
    categoryId: 'cat-dining',
    date: '2026-07-20',
    description: 'Dining & Social Gatherings',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 35 * 86400000,
  },
  {
    id: 'tx-021',
    type: 'expense',
    amount: 195,
    categoryId: 'cat-transport',
    date: '2026-07-22',
    description: 'Fuel & Highway Tolls',
    paymentMethod: 'credit_card',
    createdAt: Date.now() - 33 * 86400000,
  },
];

const STORAGE_KEYS = {
  TRANSACTIONS: 'budget_tracker_transactions_v1',
  CATEGORIES: 'budget_tracker_categories_v1',
  SAVINGS_GOALS: 'budget_tracker_goals_v1',
  CURRENCY: 'budget_tracker_currency_v1',
};

// Alternate / legacy keys that user app versions may have stored
const KNOWN_TRANSACTION_KEYS = [
  'budget_tracker_transactions_v1',
  'budget_tracker_transactions',
  'budget-tracker-transactions',
  'transactions',
  'budget_transactions',
  'expense_tracker_transactions',
  'expenses',
  'budgetTracker_transactions',
  'budget_data',
  'my_transactions',
];

const KNOWN_CATEGORY_KEYS = [
  'budget_tracker_categories_v1',
  'budget_tracker_categories',
  'budget-tracker-categories',
  'categories',
  'budget_categories',
];

const KNOWN_GOALS_KEYS = [
  'budget_tracker_goals_v1',
  'budget_tracker_goals',
  'budget-tracker-goals',
  'savingsGoals',
  'goals',
  'budget_goals',
];

// Helper to normalize any transaction object into strict numeric TypeScript schema
export function normalizeTransaction(raw: any, categories: Category[] = DEFAULT_CATEGORIES): Transaction | null {
  if (!raw || typeof raw !== 'object') return null;

  // 1. Amount parsing (handles "$45.00", "45,00", negative amounts, cost/price/value fields)
  let rawAmount = raw.amount !== undefined ? raw.amount : raw.price !== undefined ? raw.price : raw.cost !== undefined ? raw.cost : raw.value;
  let parsedAmount = 0;
  if (typeof rawAmount === 'number') {
    parsedAmount = Math.abs(rawAmount);
  } else if (typeof rawAmount === 'string') {
    const cleaned = rawAmount.replace(/[^0-9.-]+/g, '').replace(',', '.');
    parsedAmount = Math.abs(parseFloat(cleaned) || 0);
  }

  if (isNaN(parsedAmount) || parsedAmount < 0) {
    parsedAmount = 0;
  }

  // 2. Type parsing
  let type: 'income' | 'expense' = 'expense';
  const rawType = String(raw.type || '').toLowerCase();
  if (
    rawType === 'income' ||
    rawType === 'deposit' ||
    rawType === 'salary' ||
    rawType === 'credit' ||
    rawType === 'earning' ||
    (typeof raw.amount === 'number' && raw.amount < 0 && rawType === 'income')
  ) {
    type = 'income';
  }

  // 3. Category matching (by ID or name)
  let categoryId = raw.categoryId || raw.category_id;
  const rawCategoryName = raw.category || raw.categoryName;
  
  if (!categoryId && rawCategoryName) {
    const matched = categories.find(
      (c) => c.name.toLowerCase() === String(rawCategoryName).toLowerCase() || c.id === rawCategoryName
    );
    if (matched) {
      categoryId = matched.id;
    } else {
      // Find category by keyword
      const keywordMatch = categories.find((c) =>
        String(rawCategoryName).toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
      );
      categoryId = keywordMatch ? keywordMatch.id : (type === 'income' ? 'cat-salary' : 'cat-misc-exp');
    }
  }

  if (!categoryId) {
    categoryId = type === 'income' ? 'cat-salary' : 'cat-misc-exp';
  }

  // 4. Date normalization (YYYY-MM-DD)
  let dateStr = String(raw.date || '').trim();
  if (dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Valid YYYY-MM-DD
  } else if (typeof raw.date === 'number' || /^\d{10,13}$/.test(dateStr)) {
    const d = new Date(Number(raw.date));
    if (!isNaN(d.getTime())) {
      dateStr = d.toISOString().split('T')[0];
    }
  } else {
    // Fallback to today or valid date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      dateStr = d.toISOString().split('T')[0];
    } else {
      dateStr = new Date().toISOString().split('T')[0];
    }
  }

  // 5. Description & Merchant
  const description = String(raw.description || raw.title || raw.name || raw.merchant || 'Transaction').trim();
  const merchant = raw.merchant ? String(raw.merchant).trim() : undefined;

  // 6. ID & Timestamps
  const id = String(raw.id || raw._id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  const createdAt = Number(raw.createdAt) || (Date.now() - Math.floor(Math.random() * 1000000));

  return {
    id,
    type,
    amount: parsedAmount,
    categoryId,
    date: dateStr,
    description,
    merchant,
    paymentMethod: raw.paymentMethod || 'credit_card',
    notes: raw.notes ? String(raw.notes) : undefined,
    isRecurring: Boolean(raw.isRecurring),
    recurringInterval: raw.recurringInterval,
    isTaxDeductible: Boolean(raw.isTaxDeductible),
    isSubscription: Boolean(raw.isSubscription),
    aiAnalysis: raw.aiAnalysis ? String(raw.aiAnalysis) : undefined,
    createdAt,
  };
}

export function loadTransactions(): Transaction[] {
  const currentCategories = loadCategories();
  const foundTransactions: Transaction[] = [];
  const seenIds = new Set<string>();

  // Check all known transaction keys across localStorage
  for (const key of KNOWN_TRANSACTION_KEYS) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        let parsed = JSON.parse(saved);
        // Handle { transactions: [...] } or direct array [...]
        if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.transactions)) {
          parsed = parsed.transactions;
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            const normalized = normalizeTransaction(item, currentCategories);
            if (normalized && !seenIds.has(normalized.id)) {
              seenIds.add(normalized.id);
              foundTransactions.push(normalized);
            }
          }
        }
      }
    } catch (e) {
      console.warn(`Could not parse transactions from key ${key}:`, e);
    }
  }

  if (foundTransactions.length > 0) {
    // Sort newest first
    foundTransactions.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    saveTransactions(foundTransactions);
    return foundTransactions;
  }

  // If no transactions found anywhere, initialize with rich baseline sample
  saveTransactions(INITIAL_TRANSACTIONS);
  return INITIAL_TRANSACTIONS;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    const cleanList = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount) || 0,
      createdAt: Number(t.createdAt) || Date.now(),
    }));
    const newJson = JSON.stringify(cleanList);
    if (newJson !== localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, newJson);
      // Trigger in-app sync event for components/windows
      window.dispatchEvent(new CustomEvent('budget_tracker_sync', { detail: { key: 'transactions' } }));
    }
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
}

export function loadCategories(): Category[] {
  for (const key of KNOWN_CATEGORY_KEYS) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.categories)) {
          parsed = parsed.categories;
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanCategories = parsed.map((c) => ({
            ...c,
            budgetLimit: Number(c.budgetLimit) || 0,
          }));
          return cleanCategories;
        }
      }
    } catch (e) {
      console.warn(`Could not load categories from key ${key}`, e);
    }
  }
  saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: Category[]): void {
  try {
    const cleanList = categories.map((c) => ({
      ...c,
      budgetLimit: Number(c.budgetLimit) || 0,
    }));
    const newJson = JSON.stringify(cleanList);
    if (newJson !== localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, newJson);
      window.dispatchEvent(new CustomEvent('budget_tracker_sync', { detail: { key: 'categories' } }));
    }
  } catch (e) {
    console.error('Failed to save categories to localStorage', e);
  }
}

export function loadSavingsGoals(): SavingsGoal[] {
  for (const key of KNOWN_GOALS_KEYS) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.savingsGoals || parsed.goals)) {
          parsed = parsed.savingsGoals || parsed.goals;
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleanGoals = parsed.map((g) => ({
            ...g,
            targetAmount: Number(g.targetAmount) || 0,
            currentAmount: Number(g.currentAmount) || 0,
          }));
          return cleanGoals;
        }
      }
    } catch (e) {
      console.warn(`Could not load goals from key ${key}`, e);
    }
  }
  saveSavingsGoals(DEFAULT_SAVINGS_GOALS);
  return DEFAULT_SAVINGS_GOALS;
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  try {
    const cleanList = goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount) || 0,
      currentAmount: Number(g.currentAmount) || 0,
    }));
    const newJson = JSON.stringify(cleanList);
    if (newJson !== localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS)) {
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, newJson);
      window.dispatchEvent(new CustomEvent('budget_tracker_sync', { detail: { key: 'goals' } }));
    }
  } catch (e) {
    console.error('Failed to save savings goals to localStorage', e);
  }
}

export function loadCurrency(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || localStorage.getItem('currency') || 'USD';
  } catch {
    return 'USD';
  }
}

export function saveCurrency(currency: string): void {
  try {
    if (currency !== localStorage.getItem(STORAGE_KEYS.CURRENCY)) {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
      window.dispatchEvent(new CustomEvent('budget_tracker_sync', { detail: { key: 'currency' } }));
    }
  } catch (e) {
    console.error('Failed to save currency to localStorage', e);
  }
}

// Export data to JSON string
export function exportAllDataAsJSON(): string {
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    transactions: loadTransactions(),
    categories: loadCategories(),
    savingsGoals: loadSavingsGoals(),
    currency: loadCurrency(),
  };
  return JSON.stringify(data, null, 2);
}

// Export transactions to CSV format
export function exportTransactionsAsCSV(transactions: Transaction[], categories: Category[]): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes'];
  
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type.toUpperCase(),
    `"${(categoryMap.get(t.categoryId) || 'Uncategorized').replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    (Number(t.amount) || 0).toFixed(2),
    t.paymentMethod,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Import JSON data or universal string
export function importAllDataFromJSON(jsonString: string): boolean {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) return false;

    // Check if it's CSV
    if (trimmed.includes(',') && (trimmed.toLowerCase().includes('date') || trimmed.toLowerCase().includes('amount') || trimmed.toLowerCase().includes('description'))) {
      return importTransactionsFromCSV(trimmed);
    }

    const data = JSON.parse(trimmed);
    let rawTransactions: any[] | null = null;
    let rawCategories: any[] | null = null;
    let rawGoals: any[] | null = null;

    if (Array.isArray(data)) {
      rawTransactions = data;
    } else if (typeof data === 'object' && data !== null) {
      // Check if it's a full localStorage key-value dump: e.g. { "budget_tracker_transactions_v1": "[...]", ... }
      for (const [k, v] of Object.entries(data)) {
        if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
          try {
            const parsedVal = JSON.parse(v);
            if (Array.isArray(parsedVal)) {
              if (k.toLowerCase().includes('transaction') || k.toLowerCase().includes('expense')) {
                rawTransactions = parsedVal;
              } else if (k.toLowerCase().includes('categor')) {
                rawCategories = parsedVal;
              } else if (k.toLowerCase().includes('goal')) {
                rawGoals = parsedVal;
              }
            }
          } catch {
            // ignore
          }
        }
      }

      if (!rawTransactions && data.transactions && Array.isArray(data.transactions)) {
        rawTransactions = data.transactions;
      }
      if (!rawTransactions && data.expenses && Array.isArray(data.expenses)) {
        rawTransactions = data.expenses;
      }
      if (!rawCategories && data.categories && Array.isArray(data.categories)) {
        rawCategories = data.categories;
      }
      if (!rawGoals && (data.savingsGoals || data.goals) && Array.isArray(data.savingsGoals || data.goals)) {
        rawGoals = data.savingsGoals || data.goals;
      }
    }

    if (rawCategories && Array.isArray(rawCategories) && rawCategories.length > 0) {
      saveCategories(rawCategories);
    }
    if (rawGoals && Array.isArray(rawGoals) && rawGoals.length > 0) {
      saveSavingsGoals(rawGoals);
    }
    if (rawTransactions && Array.isArray(rawTransactions) && rawTransactions.length > 0) {
      const cats = loadCategories();
      const cleanTxs = rawTransactions
        .map((t) => normalizeTransaction(t, cats))
        .filter((t): t is Transaction => t !== null);
      if (cleanTxs.length > 0) {
        saveTransactions(cleanTxs);
      }
    }
    if (data && data.currency && typeof data.currency === 'string') {
      saveCurrency(data.currency);
    }
    return true;
  } catch (e) {
    console.error('Failed to import data', e);
    return false;
  }
}

// Import from CSV formatted string
export function importTransactionsFromCSV(csvString: string): boolean {
  try {
    const lines = csvString.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return false;

    const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase());
    const dateIdx = headers.findIndex((h) => h.includes('date'));
    const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('price') || h.includes('cost') || h.includes('total'));
    const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('title') || h.includes('name') || h.includes('merchant'));
    const typeIdx = headers.findIndex((h) => h.includes('type'));
    const catIdx = headers.findIndex((h) => h.includes('cat'));

    const cats = loadCategories();
    const importedTxs: Transaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV tokenizing handling quotes
      const tokens: string[] = [];
      let inQuote = false;
      let cur = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          tokens.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      tokens.push(cur.trim().replace(/^["']|["']$/g, ''));

      const rawAmount = amountIdx >= 0 ? tokens[amountIdx] : tokens[tokens.length - 1];
      const rawDate = dateIdx >= 0 ? tokens[dateIdx] : new Date().toISOString().split('T')[0];
      const rawDesc = descIdx >= 0 ? tokens[descIdx] : 'Imported Item';
      const rawType = typeIdx >= 0 ? tokens[typeIdx] : undefined;
      const rawCat = catIdx >= 0 ? tokens[catIdx] : undefined;

      const norm = normalizeTransaction({
        date: rawDate,
        amount: rawAmount,
        description: rawDesc,
        type: rawType,
        category: rawCat,
      }, cats);

      if (norm) {
        importedTxs.push(norm);
      }
    }

    if (importedTxs.length > 0) {
      saveTransactions(importedTxs);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to parse CSV transactions:', e);
    return false;
  }
}

// Reset data to defaults
export function resetDataToDefaults(): void {
  saveTransactions(INITIAL_TRANSACTIONS);
  saveCategories(DEFAULT_CATEGORIES);
  saveSavingsGoals(DEFAULT_SAVINGS_GOALS);
  saveCurrency('USD');
}

// Clear all data
export function clearAllData(): void {
  saveTransactions([]);
  saveCategories(DEFAULT_CATEGORIES);
  saveSavingsGoals([]);
  saveCurrency('USD');
}

