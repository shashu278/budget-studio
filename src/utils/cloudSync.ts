// Real cloud sync against the shared production schema (the same
// `transactions` / `goals` tables the Next.js BudgetIQ app writes to),
// gated by Supabase Auth + Row Level Security — not the old
// paste-your-own-project-and-maybe-a-service_role-key flow.
//
// Column-mapping notes (why this file exists instead of just using the
// objects as-is):
// - The DB stores `category` as a text name (e.g. "Groceries & Food"),
//   this app models categories as objects with an id — so every read
//   resolves a categoryId by name, and every write resolves back to a name.
// - Transaction ids in this app were plain strings like "tx-<ts>-<rand>".
//   The DB primary key is `uuid`. New records now get a real
//   crypto.randomUUID() (see App.tsx); this file also repairs any
//   legacy non-UUID ids the first time a record is pushed to the cloud.
// - A couple of fields this app uses (notes, paymentMethod) and a couple
//   the goals table didn't have (category, notes, completedAt) required
//   additive columns — see supabase/migrations/0002_studio_compat.sql.
//   Run that once in the Supabase SQL editor before relying on cloud sync.

import type { RealtimeChannel } from '@supabase/supabase-js';
import { Transaction, Category, SavingsGoal, RecurringInterval } from '../types';
import { supabase } from './supabaseClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Extremely old browsers only; good enough as a last-resort fallback.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function resolveCategoryId(categoryName: string | null | undefined, type: 'income' | 'expense', categories: Category[]): string {
  const name = (categoryName || '').trim().toLowerCase();
  if (name) {
    const exact = categories.find((c) => c.name.toLowerCase() === name);
    if (exact) return exact.id;
    const firstWord = name.split(' ')[0];
    const partial = categories.find((c) => c.name.toLowerCase().includes(firstWord) || name.includes(c.name.toLowerCase().split(' ')[0]));
    if (partial) return partial.id;
  }
  const fallback = categories.find((c) => c.type === type);
  return fallback ? fallback.id : (categories[0]?.id || 'cat-misc-exp');
}

function resolveCategoryName(categoryId: string, categories: Category[]): string {
  return categories.find((c) => c.id === categoryId)?.name || 'Miscellaneous';
}

const ALLOWED_DB_FREQUENCIES = new Set(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']);

function dbRowToTransaction(row: any, categories: Category[]): Transaction {
  const type: 'income' | 'expense' = row.type === 'income' ? 'income' : 'expense';
  return {
    id: String(row.id),
    type,
    amount: Number(row.amount) || 0,
    categoryId: resolveCategoryId(row.category, type, categories),
    date: row.date,
    description: row.description || row.category || 'Transaction',
    merchant: row.merchant || undefined,
    paymentMethod: (row.payment_method as Transaction['paymentMethod']) || 'credit_card',
    notes: row.notes || undefined,
    isRecurring: Boolean(row.is_recurring),
    recurringInterval: (row.recurring_frequency as RecurringInterval) || (row.is_recurring ? 'monthly' : 'none'),
    aiAnalysis: row.ai_analysis || undefined,
    isTaxDeductible: Boolean(row.is_tax_deductible),
    isSubscription: Boolean(row.is_subscription),
    receiptUrl: row.receipt_url || undefined,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  };
}

function transactionToDbRow(tx: Transaction, userId: string, categories: Category[]) {
  return {
    id: isValidUuid(tx.id) ? tx.id : newId(),
    user_id: userId,
    type: tx.type,
    amount: Number(tx.amount) || 0,
    category: resolveCategoryName(tx.categoryId, categories),
    merchant: tx.merchant || null,
    description: tx.description || null,
    date: tx.date,
    is_recurring: Boolean(tx.isRecurring),
    recurring_frequency:
      tx.isRecurring && tx.recurringInterval && ALLOWED_DB_FREQUENCIES.has(tx.recurringInterval)
        ? tx.recurringInterval
        : null,
    ai_analysis: tx.aiAnalysis || null,
    is_tax_deductible: Boolean(tx.isTaxDeductible),
    is_subscription: Boolean(tx.isSubscription),
    receipt_url: tx.receiptUrl || null,
    notes: tx.notes || null,
    payment_method: tx.paymentMethod || null,
    created_at: new Date(tx.createdAt || Date.now()).toISOString(),
  };
}

function dbRowToGoal(row: any): SavingsGoal {
  return {
    id: String(row.id),
    name: row.name,
    targetAmount: Number(row.target_amount) || 0,
    currentAmount: Number(row.current_amount) || 0,
    targetDate: row.deadline || new Date().toISOString().split('T')[0],
    category: row.category || 'General',
    color: row.color || '#10b981',
    icon: row.emoji || 'Target',
    notes: row.notes || undefined,
    completedAt: row.completed_at || undefined,
  };
}

function goalToDbRow(goal: SavingsGoal, userId: string) {
  return {
    id: isValidUuid(goal.id) ? goal.id : newId(),
    user_id: userId,
    name: goal.name,
    target_amount: Number(goal.targetAmount) || 0,
    current_amount: Number(goal.currentAmount) || 0,
    deadline: goal.targetDate || null,
    emoji: goal.icon || null,
    color: goal.color || null,
    category: goal.category || null,
    notes: goal.notes || null,
    completed_at: goal.completedAt || null,
  };
}

export async function fetchCloudTransactions(userId: string, categories: Category[]): Promise<Transaction[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) {
    console.error('fetchCloudTransactions failed:', error.message);
    return [];
  }
  return (data || []).map((row) => dbRowToTransaction(row, categories));
}

export async function fetchCloudGoals(userId: string): Promise<SavingsGoal[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId);
  if (error) {
    console.error('fetchCloudGoals failed:', error.message);
    return [];
  }
  return (data || []).map(dbRowToGoal);
}

export async function upsertCloudTransaction(tx: Transaction, userId: string, categories: Category[]): Promise<{ id: string; error: string | null }> {
  if (!supabase) return { id: tx.id, error: 'Cloud sync not configured.' };
  const row = transactionToDbRow(tx, userId, categories);
  const { error } = await supabase.from('transactions').upsert(row);
  return { id: row.id, error: error ? error.message : null };
}

export async function deleteCloudTransaction(id: string, userId: string): Promise<{ error: string | null }> {
  if (!supabase || !isValidUuid(id)) return { error: null };
  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
  return { error: error ? error.message : null };
}

export async function upsertCloudGoal(goal: SavingsGoal, userId: string): Promise<{ id: string; error: string | null }> {
  if (!supabase) return { id: goal.id, error: 'Cloud sync not configured.' };
  const row = goalToDbRow(goal, userId);
  const { error } = await supabase.from('goals').upsert(row);
  return { id: row.id, error: error ? error.message : null };
}

export async function deleteCloudGoal(id: string, userId: string): Promise<{ error: string | null }> {
  if (!supabase || !isValidUuid(id)) return { error: null };
  const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId);
  return { error: error ? error.message : null };
}

/**
 * One-time reconciliation run right after sign-in (or app load while
 * already signed in): push any local-only records up (repairing legacy
 * non-UUID ids as it goes), then return the authoritative merged lists
 * from the cloud. After this runs, the cloud is the source of truth and
 * local storage is just an offline cache of it.
 */
export async function reconcileOnSignIn(
  userId: string,
  localTransactions: Transaction[],
  localGoals: SavingsGoal[],
  categories: Category[]
): Promise<{ transactions: Transaction[]; goals: SavingsGoal[] }> {
  if (!supabase) return { transactions: localTransactions, goals: localGoals };

  const cloudTx = await fetchCloudTransactions(userId, categories);
  const cloudTxIds = new Set(cloudTx.map((t) => t.id));
  // A local transaction is "local-only" if the cloud has no row that
  // could plausibly be it. We key on id when the id is already a valid
  // UUID (it round-tripped from the cloud before); non-UUID local ids are
  // always treated as not-yet-pushed.
  const localOnlyTx = localTransactions.filter((t) => !(isValidUuid(t.id) && cloudTxIds.has(t.id)));
  for (const tx of localOnlyTx) {
    await upsertCloudTransaction(tx, userId, categories);
  }

  const cloudGoals = await fetchCloudGoals(userId);
  const cloudGoalIds = new Set(cloudGoals.map((g) => g.id));
  const localOnlyGoals = localGoals.filter((g) => !(isValidUuid(g.id) && cloudGoalIds.has(g.id)));
  for (const goal of localOnlyGoals) {
    await upsertCloudGoal(goal, userId);
  }

  const finalTransactions = localOnlyTx.length > 0 ? await fetchCloudTransactions(userId, categories) : cloudTx;
  const finalGoals = localOnlyGoals.length > 0 ? await fetchCloudGoals(userId) : cloudGoals;

  return { transactions: finalTransactions, goals: finalGoals };
}

export function subscribeToCloudChanges(userId: string, onChange: () => void): (() => void) {
  if (!supabase) return () => {};

  const channel: RealtimeChannel = supabase
    .channel(`budget-sync-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
