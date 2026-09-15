import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, Loader2, Check, Sparkles, AlertCircle, FileText, Tag, Receipt } from 'lucide-react';
import { Transaction, Category, CurrencyConfig } from '../types';
import { formatCurrency } from '../utils/formatters';
import { callGeminiApi } from '../utils/apiClient';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currency: CurrencyConfig;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  categories,
  currency,
  onAddTransaction,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setMimeType(file.type);
    setErrorMsg(null);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      processReceiptWithAI(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processReceiptWithAI = async (base64String: string, type: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await callGeminiApi('/api/gemini/vision', {
        imageBase64: base64String,
        mimeType: type,
        categories: categories.map((c) => ({ id: c.id, name: c.name })),
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error('Sign in to use the Receipt Scanner.');
        throw new Error('Receipt scanner failed to analyze image.');
      }

      const data = await res.json();

      const matchedCat =
        categories.find((c) => c.name.toLowerCase() === (data.category || '').toLowerCase()) ||
        categories.find((c) => c.id === 'cat-groceries') ||
        categories[0];

      setExtractedData({
        ...data,
        categoryId: matchedCat ? matchedCat.id : categories[0].id,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error processing receipt with Gemini Vision.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!extractedData) return;

    onAddTransaction({
      type: 'expense',
      amount: Math.abs(Number(extractedData.amount)) || 0,
      categoryId: extractedData.categoryId,
      date: extractedData.date || new Date().toISOString().split('T')[0],
      description: extractedData.description || extractedData.merchant || 'Scanned Receipt',
      merchant: extractedData.merchant || '',
      paymentMethod: 'credit_card',
      notes: extractedData.description || '',
      aiAnalysis: extractedData.aiAnalysis || '',
      isTaxDeductible: Boolean(extractedData.isTaxDeductible),
      isSubscription: false,
      isRecurring: false,
      receiptUrl: imagePreview || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setImagePreview(null);
    setExtractedData(null);
    setErrorMsg(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gemini AI Receipt & Invoice Scanner
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extract totals, line items, and tax deductibility automatically
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center bg-slate-50 dark:bg-slate-950/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Drop your receipt image here, or browse
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
                Supports camera snapshots, supermarket invoices, and restaurant bills (PNG, JPG, WEBP)
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" /> Take Photo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-56 bg-black/5 flex items-center justify-center">
                <img src={imagePreview} alt="Receipt Preview" className="max-h-56 object-contain" />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setExtractedData(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isLoading && (
                <div className="p-6 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-center">
                  <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Gemini Vision is analyzing receipt items...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Extracting merchant, line items, taxes, and totals
                  </p>
                </div>
              )}

              {extractedData && (
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/30 pb-2">
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Extracted Details
                    </span>
                    <span className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                      {formatCurrency(extractedData.amount || 0, currency)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Merchant</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {extractedData.merchant || 'Vendor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Category</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {categories.find((c) => c.id === extractedData.categoryId)?.name || extractedData.category}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-slate-400 block">Description / Items</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {extractedData.description || 'Receipt items'}
                      </span>
                    </div>
                  </div>

                  {extractedData.aiAnalysis && (
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-emerald-100 dark:border-emerald-900/30">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                        AI Spending Insight:
                      </span>
                      <p className="italic">{extractedData.aiAnalysis}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {extractedData.isTaxDeductible && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-medium flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Tax Deductible
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!extractedData || isLoading}
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Check className="w-4 h-4" /> Add Scanned Transaction
          </button>
        </div>
      </motion.div>
    </div>
  );
};
