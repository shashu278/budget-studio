import { useState, useMemo } from 'react';
import { Transaction, Category, TransactionType, PaymentMethod } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Edit,
  Copy,
  CreditCard,
  Building2,
  Wallet,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Tag,
  FileText,
  Sparkles,
  Store,
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onOpenAddModal: () => void;
  onOpenEditModal: (tx: Transaction) => void;
  onDuplicateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function TransactionList({
  transactions,
  categories,
  currency,
  onOpenAddModal,
  onOpenEditModal,
  onDuplicateTransaction,
  onDeleteTransaction,
}: TransactionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType | 'subscription' | 'tax_deductible'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type / Special tag filter
      if (selectedType === 'expense' || selectedType === 'income') {
        if (tx.type !== selectedType) return false;
      } else if (selectedType === 'subscription') {
        if (!tx.isSubscription) return false;
      } else if (selectedType === 'tax_deductible') {
        if (!tx.isTaxDeductible) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      // Payment method filter
      if (selectedPayment !== 'all' && tx.paymentMethod !== selectedPayment) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const catName = categoryMap.get(tx.categoryId)?.name.toLowerCase() || '';
        const desc = tx.description.toLowerCase();
        const merchant = (tx.merchant || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const aiAnalysis = (tx.aiAnalysis || '').toLowerCase();
        if (
          !desc.includes(query) &&
          !catName.includes(query) &&
          !merchant.includes(query) &&
          !notes.includes(query) &&
          !aiAnalysis.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedType, selectedCategory, selectedPayment, searchQuery, categoryMap]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortOrder === 'date_desc') return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
      if (sortOrder === 'date_asc') return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      if (sortOrder === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortOrder === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return 0;
    });
  }, [filteredTransactions, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(start, start + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const filteredIncomeSum = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const filteredExpenseSum = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'digital_wallet':
        return 'Digital Wallet';
      case 'cash':
        return 'Cash';
      default:
        return method;
    }
  };

  return (
    <div id="transaction-list-section" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Transaction History</h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredTransactions.length} records
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Filtered Total: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{formatCurrency(filteredIncomeSum, currency)}</span> /{' '}
            <span className="text-rose-600 dark:text-rose-400 font-semibold">-{formatCurrency(filteredExpenseSum, currency)}</span>
          </p>
        </div>

        <button
          id="btn-add-transaction-list"
          onClick={onOpenAddModal}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
        {/* Search Field */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-search-transactions"
            type="text"
            placeholder="Search description, merchant, AI tag..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Type / Tag Chips */}
        <div className="lg:col-span-4 flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'expense', label: 'Expenses' },
            { id: 'income', label: 'Income' },
            { id: 'subscription', label: 'Subs' },
            { id: 'tax_deductible', label: 'Tax Deduct.' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`filter-type-${tab.id}`}
              onClick={() => {
                setSelectedType(tab.id as any);
                setCurrentPage(1);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="lg:col-span-2">
          <select
            id="filter-category-select"
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.type === 'income' ? '🟢' : '🔴'} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="lg:col-span-2">
          <select
            id="filter-sort-select"
            aria-label="Sort transactions"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="w-full py-2 px-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Transaction Table / List */}
      <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl">
        {paginatedTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedTransactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  id={`tx-row-${tx.id}`}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Left info: Icon, Description, Category, Date, Merchant, Tags */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon iconName={cat?.icon} size={18} className="text-white" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {tx.description}
                        </span>
                        {tx.merchant && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                            <Store className="w-3 h-3 text-slate-400" /> {tx.merchant}
                          </span>
                        )}
                        {tx.isRecurring && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            <Repeat className="w-2.5 h-2.5" />
                            {tx.recurringInterval || 'Recurring'}
                          </span>
                        )}
                        {tx.isSubscription && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            <FileText className="w-2.5 h-2.5" />
                            Subscription
                          </span>
                        )}
                        {tx.isTaxDeductible && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                            <Tag className="w-2.5 h-2.5" />
                            Tax Deductible
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{cat?.name || 'General'}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400 capitalize">{getPaymentLabel(tx.paymentMethod)}</span>
                      </div>

                      {tx.aiAnalysis && (
                        <div className="flex items-start gap-1 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                          <Sparkles className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                          <p className="line-clamp-1 italic">{tx.aiAnalysis}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right info: Amount & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-base font-extrabold block ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpenEditModal(tx)}
                        title="Edit transaction"
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicateTransaction(tx)}
                        title="Duplicate transaction"
                        className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete transaction "${tx.description}"?`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        title="Delete transaction"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No transactions match your criteria</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search query, period filter, or category selection to see results.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
            >
              Add New Transaction
            </button>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
