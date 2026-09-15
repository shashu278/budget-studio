import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction, Category, SavingsGoal } from '../types';
import { normalizeTransaction, saveTransactions, loadTransactions, loadCategories, saveCategories, saveSavingsGoals } from './storage';

const SUPABASE_URL_STORAGE_KEY = 'budget_tracker_supabase_url';
const SUPABASE_ANON_KEY_STORAGE_KEY = 'budget_tracker_supabase_anon_key';
const SUPABASE_AUTO_SYNC_KEY = 'budget_tracker_supabase_auto_sync';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName?: string;
  autoSync: boolean;
}

const SUPABASE_TABLE_STORAGE_KEY = 'budget_tracker_supabase_table';

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const url = localStorage.getItem(SUPABASE_URL_STORAGE_KEY) || envUrl;
  const anonKey = localStorage.getItem(SUPABASE_ANON_KEY_STORAGE_KEY) || envKey;
  const tableName = localStorage.getItem(SUPABASE_TABLE_STORAGE_KEY) || '';
  const autoSync = localStorage.getItem(SUPABASE_AUTO_SYNC_KEY) === 'true';

  return { url: url.trim(), anonKey: anonKey.trim(), tableName: tableName.trim(), autoSync };
}

export function saveSupabaseConfig(config: { url: string; anonKey: string; tableName?: string; autoSync?: boolean }) {
  if (config.url !== undefined) {
    localStorage.setItem(SUPABASE_URL_STORAGE_KEY, config.url.trim());
  }
  if (config.anonKey !== undefined) {
    localStorage.setItem(SUPABASE_ANON_KEY_STORAGE_KEY, config.anonKey.trim());
  }
  if (config.tableName !== undefined) {
    localStorage.setItem(SUPABASE_TABLE_STORAGE_KEY, config.tableName.trim());
  }
  if (config.autoSync !== undefined) {
    localStorage.setItem(SUPABASE_AUTO_SYNC_KEY, String(config.autoSync));
  }
}

export function createSupabaseInstance(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
    return null;
  }
}

// Discover tables by reading the PostgREST OpenAPI spec
async function discoverTables(url: string, key: string): Promise<string[]> {
  try {
    const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data && data.paths) {
      return Object.keys(data.paths)
        .filter(p => !p.startsWith('/rpc/') && p !== '/')
        .map(p => p.substring(1).split('?')[0]);
    }
  } catch (e) {
    console.error('Failed to fetch OpenAPI spec', e);
  }
  return [];
}

// Push local transactions up to Supabase
export async function pushToSupabase(customTable?: string): Promise<{
  success: boolean;
  message: string;
  details?: string[];
}> {
  const supabase = createSupabaseInstance();
  const config = getSupabaseConfig();
  if (!supabase || !config.url || !config.anonKey) {
    return {
      success: false,
      message: 'Supabase URL and Key are required. Please configure your credentials.',
    };
  }

  const { tableName: savedTable } = config;
  const targetTable = customTable?.trim() || savedTable?.trim() || 'transactions';

  const localTxs = loadTransactions();
  if (localTxs.length === 0) {
    return { success: false, message: 'No local transactions found to push.' };
  }

  const queryLogs: string[] = [];
  queryLogs.push(`Attempting to push ${localTxs.length} records to table "${targetTable}"...`);

  // Map local transactions to a standard DB format
  const dataToPush = localTxs.map((t) => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    type: t.type,
    category_id: t.categoryId,
    date: t.date,
    created_at: new Date(t.createdAt).toISOString(),
    merchant: t.merchant || null,
    payment_method: t.paymentMethod || null,
    notes: t.notes || null
  }));

  try {
    const { error } = await supabase.from(targetTable).upsert(dataToPush);
    if (error) {
      queryLogs.push(`Upsert failed: ${error.message} (Code: ${error.code})`);
      return { success: false, message: `Failed to push to Supabase: ${error.message}`, details: queryLogs };
    }
    
    queryLogs.push(`Successfully upserted ${localTxs.length} rows.`);
    return { 
      success: true, 
      message: `Successfully backed up ${localTxs.length} transactions to Supabase!`,
      details: queryLogs
    };
  } catch (e: any) {
    queryLogs.push(`Push exception: ${e?.message || 'Unknown error'}`);
    return { success: false, message: `Exception while pushing: ${e?.message}`, details: queryLogs };
  }
}

// Fetch and sync all records from Supabase
export async function syncFromSupabase(customTable?: string): Promise<{
  success: boolean;
  transactionsCount: number;
  categoriesCount: number;
  goalsCount: number;
  message: string;
  details?: string[];
}> {
  const supabase = createSupabaseInstance();
  const config = getSupabaseConfig();
  if (!supabase || !config.url || !config.anonKey) {
    return {
      success: false,
      transactionsCount: 0,
      categoriesCount: 0,
      goalsCount: 0,
      message: 'Supabase URL and Key are required. Please configure your credentials.',
    };
  }

  const { tableName: savedTable } = config;
  const specifiedTable = customTable?.trim() || savedTable?.trim();

  let candidateTables = specifiedTable ? [specifiedTable] : [];
  const queryLogs: string[] = [];

  if (!specifiedTable) {
    queryLogs.push('Fetching database schema via OpenAPI...');
    const discovered = await discoverTables(config.url, config.anonKey);
    if (discovered.length > 0) {
      queryLogs.push(`Auto-discovered tables: ${discovered.join(', ')}`);
      candidateTables = discovered;
    } else {
      queryLogs.push('Could not discover tables. Falling back to default names.');
      candidateTables = [
        'transactions', 'Transactions', 'expenses', 'Expenses', 'budget_transactions',
        'records', 'items', 'user_transactions', 'budget', 'finance', 'entries',
        'tracker', 'expense_records', 'incomes', 'transaction_history'
      ];
    }
  }

  let rawTransactions: any[] = [];
  let foundTable = '';
  let rlsBlockedDetected = false;

  for (const table of candidateTables) {
    try {
      const { data, error, status } = await supabase.from(table).select('*').limit(2000);
      if (error) {
        queryLogs.push(`Table "${table}": ${error.message} (Code ${error.code || status})`);
      } else if (Array.isArray(data)) {
        if (data.length > 0) {
          rawTransactions = data;
          foundTable = table;
          queryLogs.push(`Table "${table}": Found ${data.length} rows`);
          break;
        } else {
          queryLogs.push(`Table "${table}": Exists but has 0 rows (Likely blocked by RLS)`);
          rlsBlockedDetected = true;
        }
      }
    } catch (e: any) {
      queryLogs.push(`Table "${table}": ${e?.message || 'Failed'}`);
    }
  }

  const currentCategories = loadCategories();
  let validTxs: Transaction[] = [];

  if (rawTransactions.length > 0) {
    validTxs = rawTransactions
      .map((item) => normalizeTransaction(item, currentCategories))
      .filter((t): t is Transaction => t !== null);

    if (validTxs.length > 0) {
      // Merge with existing local transactions so we don't delete phone-only un-synced data
      const localTxs = loadTransactions();
      const merged = [...validTxs];
      
      const cloudIds = new Set(validTxs.map(t => t.id));
      // Add any local transactions that aren't in the cloud yet
      for (const localTx of localTxs) {
        if (!cloudIds.has(localTx.id)) {
          merged.push(localTx);
        }
      }
      saveTransactions(merged);
    }
  }

  // Also check categories table if available
  let categoriesCount = 0;
  try {
    const { data: catData, error: catError } = await supabase.from('categories').select('*');
    if (!catError && Array.isArray(catData) && catData.length > 0) {
      const mappedCats: Category[] = catData.map((c: any) => ({
        id: String(c.id || c._id || `cat-${Date.now()}`),
        name: String(c.name || c.title || 'Category'),
        icon: c.icon || 'Tag',
        color: c.color || '#6366f1',
        budgetLimit: Number(c.budgetLimit || c.budget_limit || c.limit || 0),
        type: c.type === 'income' ? 'income' : 'expense',
      }));
      saveCategories(mappedCats);
      categoriesCount = mappedCats.length;
    }
  } catch {
    // optional
  }

  // Also check savings goals table if available
  let goalsCount = 0;
  try {
    const { data: goalData, error: goalError } = await supabase.from('savings_goals').select('*');
    if (!goalError && Array.isArray(goalData) && goalData.length > 0) {
      const mappedGoals: SavingsGoal[] = goalData.map((g: any) => ({
        id: String(g.id || `goal-${Date.now()}`),
        name: String(g.name || g.title || 'Goal'),
        targetAmount: Number(g.targetAmount || g.target_amount || g.target || 0),
        currentAmount: Number(g.currentAmount || g.current_amount || g.saved || 0),
        targetDate: g.targetDate || g.target_date || g.deadline || new Date().toISOString().split('T')[0],
        category: g.category || 'General',
        color: g.color || '#10b981',
        icon: g.icon || 'Target',
      }));
      saveSavingsGoals(mappedGoals);
      goalsCount = mappedGoals.length;
    }
  } catch {
    // optional
  }

  if (validTxs.length > 0) {
    return {
      success: true,
      transactionsCount: validTxs.length,
      categoriesCount,
      goalsCount,
      message: `Successfully synced ${validTxs.length} transactions from Supabase table "${foundTable}"!`,
      details: queryLogs,
    };
  }

  let errorMessage = specifiedTable
    ? `Connected to Supabase, but no readable records in table "${specifiedTable}".`
    : 'Connected to Supabase, but could not find any records.';

  if (rlsBlockedDetected) {
    errorMessage += ' Your tables exist but returned 0 rows, which means they are protected by Row Level Security (RLS). Please paste your "service_role" secret key instead of the anon key to bypass RLS and export your data.';
  } else {
    errorMessage += ' Ensure your table name is correct or disable RLS in your Supabase dashboard.';
  }

  return {
    success: false,
    transactionsCount: 0,
    categoriesCount,
    goalsCount,
    message: errorMessage,
    details: queryLogs,
  };
}
