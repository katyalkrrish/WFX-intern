# WFX AI-Native ERP Explorer Platform

An AI-native ERP exploration platform designed for the apparel industry. Built with Node.js/Express, PostgreSQL (Supabase), and React/Vite.

## Architecture & Tech Stack
- **Frontend**: React.js (Vite), Lucide Icons, Custom SVG Charts, Vanilla CSS (with persistent Light/Dark mode).
- **Backend**: Node.js/Express, pg Pool, Supabase JS client.
- **AI Integrations**: OpenRouter API (`openai/gpt-4.1-mini` for NL-to-SQL, `google/gemini-2.5-flash` for multimodal image search).
- **Database**: Supabase PostgreSQL.

---

## Getting Started

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in a `.env` file:
   ```env
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_SECRET_KEY=<your-secret-key>
   OPENROUTER_API_KEY=<your-openrouter-key>
   DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   The backend will run on port `3000`.

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Implemented Features

### Screen 1 — Dashboard
- Visual metrics summarizing: Total Revenue, Finished Goods count, Sales Orders count, and Suppliers/Buyers active in the system.
- Custom dynamic SVG Donut Chart representing order status distributions (Shipped, Pending, Processing).
- Vertical SVG Bar Chart displaying invoice amounts aggregated by payment status (Paid, Partially Paid, Unpaid).

### Screen 2 — Natural Language Query
- A conversational interface where business users can ask questions about the ERP data.
- Generates PostgreSQL syntax via LLM, executes it safely, and returns the query results in an interactive table alongside an AI-generated summary.

### Screen 3 — Product Search
- Real-time catalog search filtering.
- Users can filter garments by: Category, Fabric, GSM (weight slider), Color, Season, Supplier, Print, and Price range.
- Live results reload instantly.

### Screen 4 — AI Image Search
- Supporting both visual description text and drag-and-drop file uploads.
- Analyzes photos using Gemini Vision LLM to identify visual tags (category, fabric, print, color) and ranks similar garments from the database based on matching attributes.

### Screen 5 — Finished Goods Explorer
- Paginated catalog gallery displaying style cards.
- Supports sorting by Style code, price, and fabric thickness (GSM).
- Clicking any card details the garment details and pulls the manufacturing **Tech Pack** specifications (construction, fabric composition, wash instructions).
