# WFX AI-Native ERP Explorer Platform

An AI-native ERP exploration platform built for the apparel industry that enables business users to interact with ERP data using natural language. The platform combines AI-powered Natural Language to SQL (NL2SQL), intelligent product search, multimodal image search, and interactive analytics to simplify data exploration and decision-making.

---

# Key Features

- AI-powered Natural Language to SQL (NL2SQL) using Vanna AI
- AI-generated summaries for query results
- Interactive business analytics dashboard
- Advanced product search with dynamic filters
- AI-powered image search using OpenCLIP and Typesense vector search
- Finished Goods Explorer with Tech Pack details
- Responsive user interface with Light/Dark mode support
- PostgreSQL database hosted on Supabase

---

# Architecture & Tech Stack

## Frontend
- React.js (Vite)
- Vanilla CSS
- Lucide React Icons
- Custom SVG Charts
- Responsive UI
- Persistent Light/Dark Theme

## Backend
- Python (FastAPI)
- Uvicorn
- PostgreSQL (psycopg2)
- Supabase Python Client

## Database
- Supabase PostgreSQL
- Typesense (Vector Search Engine)

## AI Integrations
- Vanna AI (Natural Language to SQL)
- OpenCLIP MobileCLIP2-S0 (Image Embeddings, highly memory optimized)
- OpenRouter API for LLM summarization and NL2SQL generation

---

# System Architecture

```text
                 React (Vite)
                       │
                       ▼
                 FastAPI Backend
               ┌───────┴───────┐
               │               │
               ▼               ▼
          AI Services      PostgreSQL
         (Vanna AI,       (Supabase)
          OpenCLIP, 
          Typesense)
```

---

# Implemented Features

## Dashboard

The dashboard provides an overview of the ERP system through interactive analytics.

Features include:

- Total Revenue
- Total Finished Goods
- Total Sales Orders
- Total Buyers
- Total Suppliers
- Order Status Distribution
- Invoice Payment Status Analytics
- Interactive SVG Charts

---

## Natural Language Query

Business users can ask questions in plain English.

Example:

> Show all buyers from Canada

Workflow:

```text
User Question
      │
      ▼
FastAPI Backend (Vanna AI)
      │
Generated SQL
      │
FastAPI Validates & Executes
      │
Interactive Result Table
```

The page displays:

- User Question
- Generated SQL
- AI-generated Summary
- Query Result Table

---

## Product Search

Provides intelligent product discovery with multiple filters.

Supported filters:

- Category
- Fabric
- GSM
- Color
- Print
- Season
- Supplier
- Price Range

Features:

- Real-time filtering
- Pagination
- Sorting
- Dynamic filter generation

---

## AI Image Search

Supports both image upload and natural language descriptions.

Workflow:

```text
Image / Description
        │
        ▼
FastAPI Backend (OpenCLIP)
        │
Vector Embedding (MobileCLIP2-S0)
        │
Search Typesense
        │
Rank Similar Products
```

Products are matched based on cosine similarity of their image/text embeddings.

---

## Finished Goods Explorer

A catalog explorer for apparel products.

Features:

- Product Cards
- Pagination
- Sorting
- Detailed Product View
- Tech Pack Information

Tech Pack includes:

- Fabric Details
- Construction
- Wash Instructions

---

# Security

The application implements several security best practices:

- API keys stored securely using environment variables
- Backend-only access to Typesense and Supabase credentials
- AI-generated SQL restricted to SELECT statements
- Generated SQL validated before execution
- CORS enabled for frontend-backend communication
- Sensitive credentials excluded from version control

---

# API Endpoints

All API endpoints are prefixed with `/api`.

## Dashboard
```
GET /api/stats
```

## Buyers
```
GET /api/buyers
```

## Suppliers
```
GET /api/suppliers
```

## Products
```
GET /api/products
GET /api/products/search
GET /api/products/filters
GET /api/products/:styleNumber
```

## Orders
```
GET /api/orders
```

## Invoices
```
GET /api/invoices
```

## AI
```
POST /api/ask
POST /api/search-image
POST /api/train
```

---

# Getting Started

## Clone Repository

```bash
git clone <repository-url>
```

---

## Backend Setup

Navigate to backend:

```bash
cd backend
```

Create a virtual environment and install dependencies:

```bash
python -m venv venv
.\venv\Scripts\activate  # On Windows
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```env
# Supabase / PostgreSQL
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SECRET_KEY=<your-secret-key>
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

# OpenRouter / Vanna
OPENROUTER_API_KEY=<your-openrouter-key>

# Typesense
TYPESENSE_HOST=<your-typesense-host>
TYPESENSE_PORT=<your-typesense-port>
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=<your-typesense-key>
```

Run the backend server:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

Backend runs on:

```text
http://localhost:8000
```

---

## Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# Project Structure

```
WFX-AI-ERP/
│
├── backend/
│   ├── app/
│   │   ├── ai/          # OpenCLIP, Vanna, Typesense logic
│   │   ├── api/         # FastAPI Routes
│   │   ├── database/    # DB connections
│   │   └── main.py      # Entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.json
│
├── frontend/
│   └── src/
│
├── README.md
└── .gitignore
```

---

# Future Enhancements

Potential improvements include:

- User Authentication (Optional)
- Role-Based Access Control (RBAC)
- Query History
- Saved Reports
- Dashboard Export (PDF/Excel)
- Supabase Row Level Security (RLS)
- Advanced Analytics
- Caching for Frequently Executed Queries

---

# License

This project was developed as part of the **WFX AI-Native ERP Explorer Challenge** and is intended for educational and evaluation purposes.