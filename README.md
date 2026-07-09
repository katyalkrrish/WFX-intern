# WFX AI-Native ERP Explorer Platform

An AI-native ERP exploration platform built for the apparel industry that enables business users to interact with ERP data using natural language. The platform combines AI-powered Natural Language to SQL (NL2SQL), intelligent product search, multimodal image search, and interactive analytics to simplify data exploration and decision-making.

---

# Key Features

- AI-powered Natural Language to SQL (NL2SQL)
- AI-generated summaries for query results
- Interactive business analytics dashboard
- Advanced product search with dynamic filters
- AI-powered image search using Gemini Vision
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

## AI Integrations
- OpenRouter API
- GPT-4.1-mini (Natural Language to SQL)
- Gemini 2.5 Flash (Multimodal Image Understanding)

---

# System Architecture

```
                 React (Vite)
                       │
                       ▼
               Express.js Backend
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        OpenRouter API     PostgreSQL
      (GPT-4.1-mini &      (Supabase)
      Gemini 2.5 Flash)
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

```
User Question
      │
      ▼
GPT-4.1-mini
      │
Generated SQL
      │
Execute on PostgreSQL
      │
AI Summary
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

```
Image / Description
        │
        ▼
Gemini Vision
        │
Extract Visual Tags
        │
Search PostgreSQL
        │
Rank Similar Products
```

Extracted attributes include:

- Category
- Fabric
- Color
- Print
- Keywords

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
- Backend-only access to OpenRouter and Supabase credentials
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
OPENROUTER_API_KEY=<your-openrouter-key>
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Run backend:

```bash
npm run dev
```

Backend runs on:

```
http://localhost:3000
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
│   ├── utils/
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── assets/
│   │   └── App.jsx
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

OPENROUTER_API_KEY
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