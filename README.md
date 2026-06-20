# FinSight: Personal Financial Intelligence

FinSight is a next-generation AI-powered financial assistant that adapts to your unique lifestyle. Built with React, Tailwind CSS, and the Gemini 3 API, it goes beyond generic tracking by learning your spending habits, providing conversational data entry, and tailoring its dashboard to your specific financial persona.

## 🌟 Core Philosophy: Persona-Driven Tracking
Unlike traditional finance apps that force everyone into the same "budget/expense" box, FinSight dynamically morphs its logic, metrics, and insights based on **who you are**:

- **Founder**: Tracks Start-up Runway, Burn Rates, and MRR. Prioritizes SaaS spending and startup survival metrics.
- **Freelancer**: Focuses on Effective Hourly Rate, Pending Invoices (accounts receivable), and tracking highest-paying clients.
- **Side Project**: Focuses on Project P&L, Infrastructure Costs, Subscriptions, and Break-even points.
- **Student**: Tracks Tuition goals, part-time income, and manages essential lifestyle budgets (Food, Entertainment).
- **Family**: Centers on household budgets (Groceries, Childcare) and long-term Savings Goals (College Funds, Holidays).
- **Digital Nomad**: Monitors travel velocity, Geo-arbitrage analytics, Flight budgets, and Accommodation tracking.
- **Personal**: The standard, powerful interface for individuals focusing on Savings Rate, daily discipline, and wealth-building.

## ✨ Features

- **🗣️ Conversational Logging & AI Assistant**: Forget frustrating manual forms. Just tell FinSight: *"I paid my $120 AWS bill today"* or *"Got a $500 payout from Upwork"*, and the Gemini AI engine parses the merchant, amount, category, and date automatically.
- **📊 Adaptive Dashboards**: Your *Overview* tab reorganizes completely based on your selected Persona. Founders see runway health scores; Freelancers see missing client payments.
- **🔮 Predictive Analytics**: FinSight analyzes historical trends and predicts your end-of-month spend, alongside calculating unique health scores designed per persona.
- **🎯 Smart Goals & Budgets**: Set categorical spending limits and visually track your progress towards life milestones. Bars dynamically change color as you approach your limits.
- **🌎 Multi-Currency & Theming**: Switch your base currency (USD, EUR, GBP, ZAR, etc.) instantly and toggle gracefully between built-in Dark, Light, or System themes.
- **🌱 One-Click Demo Seeding**: Instantly populate 90 days of deep, synthetic financial history (transactions, clients, budgets) tailored exactly to your active persona for testing.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Recharts, Lucide Icons
- **Backend Architecture**: Node.js, Express (Full-stack integrated with Vite)
- **Data & Auth Layer**: Firebase Client & Firebase Admin (`firebase`, `firebase-admin`)
- **AI Integration**: `@google/genai` (powered by Gemini Flash) for transaction extraction and context understanding.

## 🚀 Setup & Execution

### 1. Environment Configuration
Create a `.env` file in the root directory. At a minimum, you must provide your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key

# Additional Firebase/Firestore variables if configured mapping to config:
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
*(This commands uses `tsx` to run the Express backend smoothly alongside Vite's HMR middleware)*

### 4. Build for Production
```bash
npm run build
npm run start
```
*(Compiles the client SPA and bundles the standalone Node server cleanly via `esbuild`)*

## 💡 Architecture Note
FinSight strictly utilizes a proxy-backend architecture. The Express server acts as the primary orchestrator (`server.ts`), securely holding all AI and database credentials. The AI API route (`/api/chat`) invokes Gemini server-side with structured tool prompts, converting natural user chat strings into real database mutations.
