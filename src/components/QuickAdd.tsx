import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mic, MicOff, Camera, Loader2, Check, X, Tag, FileText, AlertCircle } from 'lucide-react';
import { Transaction, Category, CurrencyConfig } from '../types';
import { formatCurrency } from '../utils/formatters';
import { callGeminiApi } from '../utils/apiClient';

interface QuickAddProps {
  categories: Category[];
  currency: CurrencyConfig;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onOpenReceiptScanner: () => void;
  onInterceptPurchase?: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({
  categories,
  currency,
  onAddTransaction,
  onOpenReceiptScanner,
  onInterceptPurchase,
}) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [parsedTx, setParsedTx] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParse = async (promptText = text) => {
    if (!promptText.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await callGeminiApi('/api/gemini/parse', {
        text: promptText,
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Sign in to use AI Smart Log.');
        throw new Error('Failed to parse text with AI');
      }

      const data = await res.json();

      // Find matching category ID
      const matchedCat =
        categories.find((c) => c.name.toLowerCase() === (data.category || '').toLowerCase()) ||
        categories.find((c) => c.type === (data.type || 'expense')) ||
        categories[0];

      setParsedTx({
        ...data,
        categoryId: matchedCat ? matchedCat.id : categories[0].id,
        paymentMethod: data.paymentMethod || 'credit_card',
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Could not parse input. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your entry.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        handleParse(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Error starting speech recognition:', e);
      setIsRecording(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedTx) return;

    const payload: Omit<Transaction, 'id' | 'createdAt'> = {
      type: parsedTx.type || 'expense',
      amount: Math.abs(Number(parsedTx.amount)) || 0,
      categoryId: parsedTx.categoryId,
      date: parsedTx.date || new Date().toISOString().split('T')[0],
      description: parsedTx.description || parsedTx.merchant || 'Quick Log',
      merchant: parsedTx.merchant || '',
      paymentMethod: parsedTx.paymentMethod || 'credit_card',
      notes: parsedTx.notes || '',
      aiAnalysis: parsedTx.aiAnalysis || '',
      isTaxDeductible: Boolean(parsedTx.isTaxDeductible),
      isSubscription: Boolean(parsedTx.isSubscription),
      isRecurring: Boolean(parsedTx.isSubscription),
      recurringInterval: parsedTx.isSubscription ? 'monthly' : 'none',
    };

    // If it's a large expense (> $100) and interceptor handler exists
    if (payload.type === 'expense' && payload.amount >= 100 && onInterceptPurchase) {
      onInterceptPurchase(payload);
      setParsedTx(null);
      setText('');
      return;
    }

    onAddTransaction(payload);
    setParsedTx(null);
    setText('');
  };

  return (
    <div id="quick-add-container" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              AI Smart Quick Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type naturally, dictate with voice, or scan a receipt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-scan-receipt-quick"
            type="button"
            onClick={onOpenReceiptScanner}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Scan Receipt</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleParse();
        }}
        className="relative flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            id="quick-add-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., 'Spent $42.50 at Trader Joe\'s on groceries' or 'Received $950 freelance project payout'"
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />

          <button
            type="button"
            id="btn-voice-dictation"
            onClick={toggleVoiceRecording}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Voice Dictate'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          id="btn-parse-quick-add"
          type="submit"
          disabled={isLoading || !text.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Auto Log</span>
            </>
          )}
        </button>
      </form>

      {errorMsg && (
        <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <AnimatePresence>
        {parsedTx && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Extracted Transaction
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  parsedTx.type === 'income'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                }`}
              >
                {parsedTx.type === 'income' ? '+ Income' : '- Expense'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Amount</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {formatCurrency(parsedTx.amount || 0, currency)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {categories.find((c) => c.id === parsedTx.categoryId)?.name || parsedTx.category || 'General'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Merchant / Vendor</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {parsedTx.merchant || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Date</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {parsedTx.date || 'Today'}
                </span>
              </div>
            </div>

            {parsedTx.aiAnalysis && (
              <div className="mb-3 p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-indigo-100 dark:border-indigo-900/40">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                  AI Financial & Behavioral Breakdown:
                </span>
                <p className="italic">{parsedTx.aiAnalysis}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parsedTx.isTaxDeductible && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-medium">
                      <Tag className="w-3 h-3" /> Tax Deductible
                    </span>
                  )}
                  {parsedTx.isSubscription && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                      <FileText className="w-3 h-3" /> Recurring Subscription
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => setParsedTx(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Confirm & Log
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
