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
- Node.js
- Express.js
- PostgreSQL (pg)
- Supabase JavaScript Client

## Database
- Supabase PostgreSQL
- Typesense (Vector Search Engine)

## AI Integrations
- Vanna AI (Natural Language to SQL)
- OpenCLIP ViT-B-32 (Image Embeddings)
- Local lightweight LLMs for summarization

---

# System Architecture

```text
                 React (Vite)
                       │
                       ▼
               Express.js Backend
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        Vanna Service      PostgreSQL
       (Python Flask,      (Supabase)
       Typesense, 
       OpenCLIP)
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
Vanna AI (Python Service)
      │
Generated SQL
      │
Express Validates & Executes
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
OpenCLIP (Python Service)
        │
Vector Embedding (ViT-B-32)
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

## Dashboard

```
GET /dashboard
```

Returns business analytics and dashboard metrics.

---

## Buyers

```
GET /buyers
```

Returns all buyers.

---

## Suppliers

```
GET /suppliers
```

Returns all suppliers.

---

## Products

```
GET /products
GET /products/search
GET /products/filters
GET /products/:styleNumber
```

Supports advanced product exploration.

---

## Orders

```
GET /orders
```

Returns all sales orders.

---

## Invoices

```
GET /invoices
```

Returns all invoices.

---

## AI

```
POST /ai/query
POST /ai/image-search
```

Supports:

- Natural Language to SQL
- AI-powered Image Search

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

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SECRET_KEY=<your-secret-key>
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
TYPESENSE_API_KEY=<your-typesense-key>
TYPESENSE_HOST=<your-typesense-host>
PYTHON_SERVICE_URL=http://localhost:5000
```

Run backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:3000
```

---

## Python Microservice (Vanna AI & OpenCLIP) Setup

Navigate to service:

```bash
cd vanna-service
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run indexing script to populate Typesense:

```bash
# Ensure DATABASE_URL and TYPESENSE env vars are set
python index_data.py
```

Run service:

```bash
python app.py
```

Service runs on:

```text
http://localhost:5000
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
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   └── server.js
│
├── frontend/
│   ├── src/
│
├── vanna-service/
│   ├── app.py
│   ├── index_data.py
│   └── requirements.txt
│
├── README.md
└── .gitignore
```

---

# Environment Variables

Backend requires:

```env
SUPABASE_URL
SUPABASE_SECRET_KEY
DATABASE_URL
TYPESENSE_API_KEY
TYPESENSE_HOST
PYTHON_SERVICE_URL
```

Python Service requires:

```env
DATABASE_URL
TYPESENSE_API_KEY
TYPESENSE_HOST
GEMINI_API_KEY
```

---
## Live Demo

Frontend:
https://wfx-intern.vercel.app/

Backend:
https://wfx-intern.onrender.com

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