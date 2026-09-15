# Budget Tracker 📊

A personal finance and budget management application built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Recharts**, with optional real-time cross-device sync backed by **Supabase**.

---

## 🌟 Key Features

- **Ledger & Transactions**: Track income and expense records with categories, payment methods, recurring schedules, and notes.
- **Category Budgets**: Set and monitor monthly spending caps per category with visual utilization meters and over-budget alerts.
- **Savings Goals & Sinking Funds**: Create target milestones (Emergency Fund, Vacation, Vehicle, etc.) with real-time deposit/withdrawal tracking and confetti celebrations.
- **Interactive Analytics**: Dynamic cashflow charts, category expense donuts, and cumulative daily spending velocity powered by Recharts.
- **Multi-Currency Support**: Switch instantly between USD ($), EUR (€), GBP (£), JPY (¥), CAD, AUD, INR (₹), CHF, and SGD.
- **Account & Cloud Sync**: Sign in (email/password, via Supabase Auth) to sync transactions and goals live across every device signed into the same account — no local-only silo, no pasted database keys. Without signing in, the app runs entirely offline against `localStorage`.
- **Data Privacy & Backup**: Instant **CSV Export**, **JSON Backup & Restore**, and demo sample data reset, independent of cloud sync.
- **Export to GitHub**: Fully structured, modular codebase ready to push directly to GitHub via Google AI Studio's export menu or cloned for local development.

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/shashu278/budget-studio.git
cd budget-studio
```

### 2. Install dependencies
```bash
npm install
```

### 3. (Optional) Enable AI features and cloud sync
```bash
cp .env.example .env
# then fill in:
#   GEMINI_API_KEY=...
#   VITE_SUPABASE_URL=...           (same project as your other BudgetIQ app, if any)
#   VITE_SUPABASE_ANON_KEY=...
```
Without these, the app still runs fully offline: AI features fall back to
local heuristics, and data stays in this browser's `localStorage`.

If you're pointing this at the same Supabase project as another BudgetIQ
app, run `supabase/migrations/0001_schema_and_rls.sql` and
`supabase/migrations/0002_studio_compat.sql` once in the Supabase SQL
Editor first — they're additive and safe to re-run.

### 4. Start development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production
```bash
npm run build
```

---

## 📁 Project Architecture

```
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Main navigation, period & currency selector
│   │   ├── SummaryCards.tsx        # Net cashflow, savings rate, and budget health cards
│   │   ├── TransactionList.tsx     # Filterable, searchable transaction ledger
│   │   ├── TransactionModal.tsx    # Add/edit transaction modal
│   │   ├── BudgetOverview.tsx      # Category budget meters and limit editor
│   │   ├── CategoryModal.tsx       # Custom category & color manager
│   │   ├── SavingsGoals.tsx        # Sinking funds & milestone progress rings
│   │   ├── GoalModal.tsx           # Savings goal & deposit/withdraw modals
│   │   ├── AnalyticsCharts.tsx     # Recharts cashflow & category breakdown
│   │   ├── ExportModal.tsx         # CSV / JSON backup and restore hub
│   │   ├── GithubModal.tsx         # GitHub export instructions and commands
│   │   └── CategoryIcon.tsx        # Lucide vector icon mapper
│   ├── types/
│   │   └── index.ts                # TypeScript domain models and interfaces
│   ├── utils/
│   │   ├── formatters.ts           # Currency and date formatting utilities
│   │   └── storage.ts              # LocalStorage persistence & backup engine
│   ├── App.tsx                     # Root state coordinator
│   ├── main.tsx                    # React DOM entry point
│   └── index.css                   # Global styles & Tailwind CSS
├── index.html                      # HTML document entry
├── package.json                    # Project scripts & dependencies
└── tsconfig.json                   # TypeScript configuration
```

---

## 📄 License
Open source under the [Apache-2.0 License](LICENSE).
