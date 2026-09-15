import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { Transaction, Category, SavingsGoal, AIChatMessage, CurrencyConfig } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AIChatAdvisorProps {
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
  currency: CurrencyConfig;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const AIChatAdvisor: React.FC<AIChatAdvisorProps> = ({
  transactions,
  categories,
  goals,
  currency,
  onAddTransaction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content:
        "Hello! I am your AI Financial Advisor. I have full context of your recent income, expenses, budgets, and savings milestones. Ask me anything, or tell me to log transactions directly!",
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend = input) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: AIChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          transactions,
          budgets: categories.map((c) => ({ name: c.name, limit: c.budgetLimit })),
          goals: goals.map((g) => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get advisor reply');
      }

      const data = await res.json();

      const assistantMsg: AIChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: data.response || 'I analyzed your query.',
        timestamp: Date.now(),
        action: data.action,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If action returned, auto execute add_transaction
      if (data.action && data.action.type === 'add_transaction' && data.action.transaction) {
        const tx = data.action.transaction;
        const matchedCat =
          categories.find((c) => c.name.toLowerCase() === (tx.category || '').toLowerCase()) ||
          categories[0];

        onAddTransaction({
          type: tx.type || 'expense',
          amount: Math.abs(Number(tx.amount)) || 20,
          categoryId: matchedCat.id,
          date: tx.date || new Date().toISOString().split('T')[0],
          description: tx.description || tx.merchant || 'AI Logged Entry',
          merchant: tx.merchant || '',
          paymentMethod: 'credit_card',
          isRecurring: Boolean(tx.isRecurring),
          recurringInterval: tx.recurringFrequency || 'none',
        });
      }
    } catch (e: any) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I ran into an error connecting with the AI advisor. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'How can I save $200 more this month?',
    'Review my subscription expenses',
    'What is my 90-day cash flow outlook?',
    'Add $45 weekly groceries expense',
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        id="btn-open-ai-chat"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 group transition-all"
        title="Chat with AI Advisor"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline text-xs font-bold pr-1">AI Financial Advisor</span>
      </motion.button>

      {/* Advisor Chat Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="w-full sm:max-w-md h-[90vh] sm:h-[650px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">BudgetIQ AI Advisor</h3>
                    <p className="text-[11px] text-indigo-100">Powered by Gemini 3.7 Flash</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {m.action && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Action Executed & Added to Ledger</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    <span>Advisor is analyzing records...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1.5 overflow-x-auto text-[11px]">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full shrink-0 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question or log an expense..."
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
