import { useState } from 'react';
import {
  X,
  Github,
  Check,
  Copy,
  Terminal,
  FolderTree,
  ExternalLink,
  ShieldCheck,
  PackageCheck,
  Sparkles,
} from 'lucide-react';

interface GithubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GithubModal({ isOpen, onClose }: GithubModalProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const localRunSnippet = `# 1. Clone repository
git clone https://github.com/shashu278/budget-tracker.git
cd budget-tracker

# 2. Install dependencies
npm install

# 3. (Optional) Set your Gemini API key for live AI features
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# 4. Start local development server
npm run dev

# 5. Build for production deployment
npm run build`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">GitHub Repository & Codebase</h3>
              <p className="text-xs text-slate-300">Integrated with all advanced features from your repo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Repo Link Banner */}
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">
                Source Repository
              </span>
              <a
                href="https://github.com/shashu278/budget-tracker"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-mono flex items-center gap-1 mt-0.5"
              >
                <span>github.com/shashu278/budget-tracker</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-full">
              Synced & Merged
            </span>
          </div>

          {/* Integrated Features Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Integrated Advanced Features:</span>
            </div>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li><strong>Gemini AI Vision Receipt Scanner</strong>: Instant receipt OCR extraction</li>
              <li><strong>Natural Language & Voice Quick Log</strong>: Speech dictation + intent parser</li>
              <li><strong>90-Day Predictive Cash Flow</strong>: Forward projection based on 30-day velocity</li>
              <li><strong>AI Auto-Balancing Budgets</strong>: Surplus reallocation across categories</li>
              <li><strong>Ripple-Effect Goal Delay Simulator</strong>: Opportunity cost calculator</li>
              <li><strong>Smart Alerts Engine</strong>: Subscription creep, budget caps & micro-savings</li>
              <li><strong>AI Financial Advisor & Monthly Grading</strong>: Contextual chat + 50/30/20 gauge</li>
            </ul>
          </div>

          {/* Quick Terminal Guide */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Running Locally</span>
              </div>
              <button
                onClick={() => copyToClipboard(localRunSnippet, 'commands')}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                {copiedSection === 'commands' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Commands</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
              {localRunSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">TypeScript &bull; React 19 &bull; Tailwind CSS &bull; @google/genai</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
