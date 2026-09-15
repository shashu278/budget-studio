import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Transaction,
  Category,
  SavingsGoal,
  DateFilter,
  SmartAlert,
} from './types';
import {
  loadTransactions,
  saveTransactions,
  loadCategories,
  saveCategories,
  loadSavingsGoals,
  saveSavingsGoals,
  loadCurrency,
  saveCurrency,
} from './utils/storage';
import { SUPPORTED_CURRENCIES } from './utils/formatters';
import { checkSubscriptionCreep, checkBudgetAlerts, checkGoalMilestones, checkMicroSavingsSweeps } from './utils/alerts';
import { useAuth } from './context/AuthContext';
import {
  newId,
  reconcileOnSignIn,
  fetchCloudTransactions,
  fetchCloudGoals,
  upsertCloudTransaction,
  deleteCloudTransaction,
  upsertCloudGoal,
  deleteCloudGoal,
  subscribeToCloudChanges,
} from './utils/cloudSync';

import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { BudgetOverview } from './components/BudgetOverview';
import { SavingsGoals } from './components/SavingsGoals';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TransactionModal } from './components/TransactionModal';
import { CategoryModal } from './components/CategoryModal';
import { GoalModal, DepositModal } from './components/GoalModal';
import { ExportModal } from './components/ExportModal';
import { GithubModal } from './components/GithubModal';
import { AccountModal } from './components/AccountModal';

// Advanced Integrated Features
import { QuickAdd } from './components/QuickAdd';
import { ReceiptScannerModal } from './components/ReceiptScannerModal';
import { PurchaseInterceptorModal } from './components/PurchaseInterceptorModal';
import { PredictiveCashFlowCard } from './components/PredictiveCashFlowCard';
import { AutoBalanceCard } from './components/AutoBalanceCard';
import { GoalSimulator } from './components/GoalSimulator';
import { AIInsightsCard } from './components/AIInsightsCard';
import { AlertsPanel } from './components/AlertsPanel';
import { AIChatAdvisor } from './components/AIChatAdvisor';

export default function App() {
  // State Initialization
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => loadSavingsGoals());
  const [currency, setCurrency] = useState<string>(() => loadCurrency());
  const [dateFilter, setDateFilter] = useState<DateFilter>({ period: 'this_month' });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'goals' | 'forecast' | 'analytics'>('dashboard');

  // Modals & Interceptor States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [depositModalState, setDepositModalState] = useState<{
    isOpen: boolean;
    goal: SavingsGoal | null;
    actionType: 'deposit' | 'withdraw';
  }>({
    isOpen: false,
    goal: null,
    actionType: 'deposit',
  });

  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [interceptedTx, setInterceptedTx] = useState<Omit<Transaction, 'id' | 'createdAt'> | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);

  // Persist every local change to localStorage. This is now just the
  // offline cache — the cloud is the source of truth whenever signed in
  // (see the sign-in effect and refetchCloud below). Cloud writes happen
  // explicitly at the point of each mutation (handleSaveTransaction etc.),
  // not from a blanket "watch the array and push everything" effect —
  // the old version of this app pushed the *entire* local transaction
  // list to Supabase on every keystroke-driven state change, which is
  // both wasteful and racy across devices.
  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveSavingsGoals(savingsGoals);
  }, [savingsGoals]);

  useEffect(() => {
    saveCurrency(currency);
  }, [currency]);

  // Plain pull from the cloud (no push) — used after a realtime change
  // notification fires, so another device's edit shows up here live.
  const refetchCloud = useCallback(async () => {
    if (!user) return;
    const [cloudTx, cloudGoals] = await Promise.all([
      fetchCloudTransactions(user.id, loadCategories()),
      fetchCloudGoals(user.id),
    ]);
    setTransactions(cloudTx);
    setSavingsGoals(cloudGoals);
    setLastSyncedAt(Date.now());
  }, [user]);

  // Manual "Sync Now" button in the Account modal: push+pull reconcile.
  const handleManualResync = useCallback(async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const merged = await reconcileOnSignIn(user.id, loadTransactions(), loadSavingsGoals(), loadCategories());
      setTransactions(merged.transactions);
      setSavingsGoals(merged.goals);
      setLastSyncedAt(Date.now());
    } finally {
      setIsSyncing(false);
    }
  }, [user]);

  // On sign-in: push any local-only records up, pull the authoritative
  // cloud state down, then subscribe to live realtime changes so edits
  // on another signed-in device show up here without a refresh. On
  // sign-out: unsubscribe and fall back to whatever's in localStorage.
  useEffect(() => {
    if (realtimeUnsubscribeRef.current) {
      realtimeUnsubscribeRef.current();
      realtimeUnsubscribeRef.current = null;
    }

    if (!user) return;

    let cancelled = false;
    setIsSyncing(true);
    reconcileOnSignIn(user.id, loadTransactions(), loadSavingsGoals(), loadCategories())
      .then((merged) => {
        if (cancelled) return;
        setTransactions(merged.transactions);
        setSavingsGoals(merged.goals);
        setLastSyncedAt(Date.now());
      })
      .catch((err) => console.error('Initial cloud reconcile failed:', err))
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });

    realtimeUnsubscribeRef.current = subscribeToCloudChanges(user.id, () => {
      refetchCloud();
    });

    return () => {
      cancelled = true;
    };
    // Only re-run when the signed-in user actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Cross-tab sync fallback while signed OUT (multiple tabs of the local
  // demo). Once signed in, Realtime is the cross-device source of truth.
  useEffect(() => {
    if (user) return;
    const handleStorageSync = () => {
      setTransactions(loadTransactions());
      setCategories(loadCategories());
      setSavingsGoals(loadSavingsGoals());
      setCurrency(loadCurrency());
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('budget_tracker_sync', handleStorageSync);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('budget_tracker_sync', handleStorageSync);
    };
  }, [user]);

  // Current currency object
  const currentCurrencyObj = useMemo(() => {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
    return found || { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 };
  }, [currency]);

  // Filter transactions based on date filter (dynamically matching active transaction date range or current time)
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const systemYear = now.getFullYear();
    const systemMonth = now.getMonth();

    // Determine reference year and month from the latest transaction or current date
    let refYear = systemYear;
    let refMonth = systemMonth;

    if (transactions.length > 0) {
      const validDates = transactions
        .map((t) => t.date)
        .filter((d) => Boolean(d) && /^\d{4}-\d{2}-\d{2}/.test(d))
        .sort((a, b) => b.localeCompare(a));
      
      if (validDates.length > 0) {
        const [ly, lm] = validDates[0].split('-').map(Number);
        if (ly && lm) {
          refYear = ly;
          refMonth = lm - 1;
        }
      }
    }

    return transactions.filter((tx) => {
      if (!tx.date) return dateFilter.period === 'all';
      const [y, m] = tx.date.split('-').map(Number);
      const txYear = y || refYear;
      const txMonth = (m ? m - 1 : refMonth);

      switch (dateFilter.period) {
        case 'this_month':
          return txYear === refYear && txMonth === refMonth;
        case 'last_month':
          if (refMonth === 0) {
            return txYear === refYear - 1 && txMonth === 11;
          }
          return txYear === refYear && txMonth === refMonth - 1;
        case 'last_3_months': {
          const diffMonths = (refYear - txYear) * 12 + (refMonth - txMonth);
          return diffMonths >= 0 && diffMonths < 3;
        }
        case 'this_year':
          return txYear === refYear;
        case 'all':
        default:
          return true;
      }
    });
  }, [transactions, dateFilter]);

  // Summary Metrics calculations with guaranteed numeric summation
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    });

    const totalBudgeted = categories
      .filter((c) => c.type === 'expense')
      .reduce((acc, c) => acc + (Number(c.budgetLimit) || 0), 0);

    const lifetimeIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const lifetimeExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const totalBalance = lifetimeIncome - lifetimeExpense;

    const savingsTotal = savingsGoals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);
    const netMonthlySavings = Math.max(0, totalIncome - totalExpense);

    return {
      totalIncome,
      totalExpense,
      totalBudgeted,
      totalBalance,
      savingsTotal,
      savingsCount: savingsGoals.length,
      netMonthlySavings,
    };
  }, [filteredTransactions, transactions, categories, savingsGoals]);

  // Compute Smart Alerts
  const smartAlerts = useMemo<SmartAlert[]>(() => {
    const creepAlerts = checkSubscriptionCreep(transactions);
    const budgetAlerts = checkBudgetAlerts(transactions, categories, filteredTransactions);
    const goalAlerts = checkGoalMilestones(savingsGoals);
    const sweepAlerts = checkMicroSavingsSweeps(categories, filteredTransactions);

    return [...creepAlerts, ...budgetAlerts, ...goalAlerts, ...sweepAlerts];
  }, [transactions, categories, filteredTransactions, savingsGoals]);

  // Transaction Handlers. Local state is always updated optimistically;
  // when signed in, the same change is also written to the cloud so it
  // reaches every other device (Realtime then reflects it back down).
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      let updated: Transaction | undefined;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id !== existingId) return t;
          updated = { ...t, ...data };
          return updated;
        })
      );
      if (user && updated) upsertCloudTransaction(updated, user.id, categories).catch(() => {});
    } else {
      const newTx: Transaction = {
        ...data,
        id: newId(),
        createdAt: Date.now(),
      };
      setTransactions((prev) => [newTx, ...prev]);
      if (user) upsertCloudTransaction(newTx, user.id, categories).catch(() => {});
    }
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: newId(),
      description: `${tx.description} (Copy)`,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [duplicated, ...prev]);
    if (user) upsertCloudTransaction(duplicated, user.id, categories).catch(() => {});
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (user) deleteCloudTransaction(id, user.id).catch(() => {});
  };

  // Category Handlers
  const handleSaveCategory = (
    data: Omit<Category, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      setCategories((prev) =>
        prev.map((c) => (c.id === existingId ? { ...c, ...data } : c))
      );
    } else {
      const newCat: Category = {
        ...data,
        id: newId(),
      };
      setCategories((prev) => [...prev, newCat]);
    }
  };

  const handleUpdateCategoryBudget = (categoryId: string, newLimit: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, budgetLimit: newLimit } : c))
    );
  };

  // Savings Goal Handlers (same optimistic-local + cloud-write pattern)
  const handleSaveGoal = (
    data: Omit<SavingsGoal, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      let updated: SavingsGoal | undefined;
      setSavingsGoals((prev) =>
        prev.map((g) => {
          if (g.id !== existingId) return g;
          updated = { ...g, ...data };
          return updated;
        })
      );
      if (user && updated) upsertCloudGoal(updated, user.id).catch(() => {});
    } else {
      const newGoal: SavingsGoal = {
        ...data,
        id: newId(),
      };
      setSavingsGoals((prev) => [...prev, newGoal]);
      if (user) upsertCloudGoal(newGoal, user.id).catch(() => {});
    }
  };

  const handleDepositWithdraw = (goalId: string, deltaAmount: number) => {
    let updated: SavingsGoal | undefined;
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedAmount = Math.max(0, g.currentAmount + deltaAmount);
          updated = {
            ...g,
            currentAmount: updatedAmount,
            completedAt: updatedAmount >= g.targetAmount ? new Date().toISOString() : undefined,
          };
          return updated;
        }
        return g;
      })
    );
    if (user && updated) upsertCloudGoal(updated, user.id).catch(() => {});
  };

  const handleDeleteGoal = (goalId: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== goalId));
    if (user) deleteCloudGoal(goalId, user.id).catch(() => {});
  };

  // Refresh data from storage
  const handleDataRefresh = () => {
    setTransactions(loadTransactions());
    setCategories(loadCategories());
    setSavingsGoals(loadSavingsGoals());
    setCurrency(loadCurrency());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 flex flex-col transition-colors">
      {/* Top Header */}
      <Header
        currentCurrency={currency}
        onCurrencyChange={setCurrency}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onOpenAddModal={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenGithubModal={() => setIsGithubModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        isCloudSignedIn={Boolean(user)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <SummaryCards
          totalIncome={summary.totalIncome}
          totalExpense={summary.totalExpense}
          totalBudgeted={summary.totalBudgeted}
          currency={currency}
          totalBalance={summary.totalBalance}
          savingsCount={summary.savingsCount}
          savingsTotal={summary.savingsTotal}
        />

        {/* AI Smart Quick Log Bar (Universal across views or in dashboard) */}
        <QuickAdd
          categories={categories}
          currency={currentCurrencyObj}
          onAddTransaction={handleSaveTransaction}
          onOpenReceiptScanner={() => setIsReceiptScannerOpen(true)}
          onInterceptPurchase={(tx) => setInterceptedTx(tx)}
        />

        {/* Smart Alerts & Notifications Engine */}
        <AlertsPanel alerts={smartAlerts} />

        {/* Tab 1: Dashboard / Overview */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* AI Auto-Balance Banner if overspending detected */}
            <AutoBalanceCard
              categories={categories}
              transactions={filteredTransactions}
              currency={currentCurrencyObj}
              onUpdateCategories={setCategories}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Analytics Preview */}
              <div className="lg:col-span-7">
                <AnalyticsCharts
                  transactions={filteredTransactions}
                  categories={categories}
                  currency={currency}
                />
              </div>

              {/* Category Budgets Overview */}
              <div className="lg:col-span-5">
                <BudgetOverview
                  categories={categories}
                  transactions={filteredTransactions}
                  currency={currency}
                  onUpdateCategoryBudget={handleUpdateCategoryBudget}
                  onOpenAddCategoryModal={() => {
                    setEditingCat(null);
                    setIsCatModalOpen(true);
                  }}
                  onOpenEditCategoryModal={(cat) => {
                    setEditingCat(cat);
                    setIsCatModalOpen(true);
                  }}
                />
              </div>
            </div>

            {/* Savings Goals Grid */}
            <SavingsGoals
              goals={savingsGoals}
              currency={currency}
              onOpenAddGoalModal={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              onOpenDepositModal={(goal, actionType) => {
                setDepositModalState({
                  isOpen: true,
                  goal,
                  actionType,
                });
              }}
              onDeleteGoal={handleDeleteGoal}
            />

            {/* 90-Day Cash Flow Preview */}
            <PredictiveCashFlowCard
              transactions={transactions}
              currency={currentCurrencyObj}
            />

            {/* Recent Transactions List */}
            <TransactionList
              transactions={filteredTransactions}
              categories={categories}
              currency={currency}
              onOpenAddModal={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              onOpenEditModal={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onDuplicateTransaction={handleDuplicateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
        )}

        {/* Tab 2: Transactions View */}
        {activeTab === 'transactions' && (
          <TransactionList
            transactions={filteredTransactions}
            categories={categories}
            currency={currency}
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            onOpenEditModal={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onDuplicateTransaction={handleDuplicateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* Tab 3: Budgets View */}
        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <AutoBalanceCard
              categories={categories}
              transactions={filteredTransactions}
              currency={currentCurrencyObj}
              onUpdateCategories={setCategories}
            />
            <BudgetOverview
              categories={categories}
              transactions={filteredTransactions}
              currency={currency}
              onUpdateCategoryBudget={handleUpdateCategoryBudget}
              onOpenAddCategoryModal={() => {
                setEditingCat(null);
                setIsCatModalOpen(true);
              }}
              onOpenEditCategoryModal={(cat) => {
                setEditingCat(cat);
                setIsCatModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 4: Goals View */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <GoalSimulator
              goals={savingsGoals}
              netMonthlySavings={summary.netMonthlySavings}
              currency={currentCurrencyObj}
            />
            <SavingsGoals
              goals={savingsGoals}
              currency={currency}
              onOpenAddGoalModal={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              onOpenDepositModal={(goal, actionType) => {
                setDepositModalState({
                  isOpen: true,
                  goal,
                  actionType,
                });
              }}
              onDeleteGoal={handleDeleteGoal}
            />
          </div>
        )}

        {/* Tab 5: 90-Day Cash Flow & Simulator View */}
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <PredictiveCashFlowCard
              transactions={transactions}
              currency={currentCurrencyObj}
            />
            <GoalSimulator
              goals={savingsGoals}
              netMonthlySavings={summary.netMonthlySavings}
              currency={currentCurrencyObj}
            />
          </div>
        )}

        {/* Tab 6: AI Health & Analytics View */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AIInsightsCard
              transactions={filteredTransactions}
              categories={categories}
              currency={currentCurrencyObj}
              selectedMonth={7}
              selectedYear={2026}
            />
            <AnalyticsCharts
              transactions={filteredTransactions}
              categories={categories}
              currency={currency}
            />
          </div>
        )}
      </main>

      {/* Floating AI Financial Advisor Assistant */}
      <AIChatAdvisor
        transactions={transactions}
        categories={categories}
        goals={savingsGoals}
        currency={currentCurrencyObj}
        onAddTransaction={handleSaveTransaction}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
        initialTransaction={editingTx}
        currencySymbol={currentCurrencyObj.symbol}
      />

      <ReceiptScannerModal
        isOpen={isReceiptScannerOpen}
        onClose={() => setIsReceiptScannerOpen(false)}
        categories={categories}
        currency={currentCurrencyObj}
        onAddTransaction={handleSaveTransaction}
      />

      <PurchaseInterceptorModal
        isOpen={Boolean(interceptedTx)}
        transaction={interceptedTx}
        currency={currentCurrencyObj}
        onCancel={() => setInterceptedTx(null)}
        onConfirm={(tx) => {
          handleSaveTransaction(tx);
          setInterceptedTx(null);
        }}
      />

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        onSave={handleSaveCategory}
        initialCategory={editingCat}
        currencySymbol={currentCurrencyObj.symbol}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
        currencySymbol={currentCurrencyObj.symbol}
      />

      <DepositModal
        isOpen={depositModalState.isOpen}
        onClose={() =>
          setDepositModalState({ isOpen: false, goal: null, actionType: 'deposit' })
        }
        goal={depositModalState.goal}
        actionType={depositModalState.actionType}
        onConfirm={handleDepositWithdraw}
        currencySymbol={currentCurrencyObj.symbol}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        categories={categories}
        onDataChanged={handleDataRefresh}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      <GithubModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onManualResync={handleManualResync}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
      />
    </div>
  );
}
