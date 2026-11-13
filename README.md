# TEAMFLOW — Design Lead Control Centre
### Project Management | Team Operations | Attendance | Leave | Revisions | HR Reporting

TeamFlow is a private, production-ready internal management platform engineered exclusively for a **Design Lead** managing a multidisciplinary team of designers, frontend and backend developers, video editors, and creative specialists.

The platform provides complete control over project lifecycles, workload distribution, daily attendance, extended availability, weekend extra work, client revision loops, and HR-ready audit reports.

---

## 🚀 Key Features

### 1. Project & Lifecycle Management
- **Full Project Tracking**: Manage design, development, branding, UI/UX, and marketing initiatives.
- **Client & Target Tracking**: Record clients, target delivery dates, actual delivery milestones, and priority tiers.
- **Workstreams & Stages**: Multi-stage workflow pipelines (Ideation, Wireframing, UI Design, Development, Review, QA, Delivery).
- **Archive & Reopen Flow**: Safe archiving with instant reactivation for subsequent phases.

### 2. Task Management & Workload Balancing
- **Kanban & List Views**: Drag-and-drop task boards powered by `@dnd-kit`.
- **Multi-Assignee Support**: Assign multiple team members to complex deliverables.
- **Priority & Stage Matrix**: Visual badges for urgent, high, medium, and low priorities with automated stage transitions.

### 3. Attendance, HR & Extended Work Operations
- **Daily Attendance Register**: Track daily arrival, departure, break durations, and office working hours in Indian Standard Time (IST).
- **Bulk Check-in**: One-click bulk check-in for the entire multidisciplinary team.
- **Half-Day Permissions**: Log official First-Half and Second-Half permissions, calculate time windows and maintain audit history.
- **Early Log-Off Tracking**: Record departures prior to standard closing (18:00 IST), automatically calculate difference in minutes, and log justifications without falsely penalising attendance.
- **Late Availability / Extended Hours**: Track presence after regular office hours, cleanly distinguishing **active work** (urgent releases, client meetings) from **standby / availability** (on-call).
- **Saturday & Sunday Extra Work**: Capture weekend work sessions with project association or standalone work, hours tracking, and Design Lead approval status.
- **Consolidated Approvals Queue**: Single unified dashboard to approve or reject pending permissions, early log-offs, and weekend work.

### 4. Revisions & Delivery Audit History
- **Client Revision Tracking**: Track revision cycles (R1, R2, R3...), change requests, priority, and assignees.
- **Delivery Log**: Permanent timestamped record of initial and revision deliveries.

### 5. HR Statements & PDF Report Generation
- **9 High-Fidelity PDF Generators**: Generates HR-compliant A4 reports with official letterhead, IST timestamps, tabular summaries, and Design Lead signature blocks.
- **Direct Cloud Archival**: Generated reports automatically upload to private Supabase storage (`teamflow-reports`) with signed temporary access URLs.
- **Export Formats**: PDF reports and Excel-compatible data exports.

### 6. Cloud Persistence & Data Resilience
- **Permanent Cloud Storage**: 100% cloud-persisted in Supabase PostgreSQL; no fragile LocalStorage dependencies for core business data.
- **Complete JSON Backup & Restore**: One-click full database export and restore functionality.
- **Real-time Operations Audit**: Automated activity logging for all administrative actions.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | React 18+ & TypeScript | Strictly-typed component architecture |
| **Build Tool** | Vite | Lightning-fast HMR and optimized production bundling |
| **Routing** | React Router v6 | Single Page App (SPA) with route guards |
| **Styling** | Tailwind CSS | SaaS design system (`#F7F8FA`, `#17191F`, `#6258E8`) |
| **Icons** | Lucide React | Consistent vector iconography |
| **State Management** | Zustand & TanStack Query | Client UI state and cached server queries |
| **Database & Auth** | Supabase PostgreSQL & Auth | Row Level Security (RLS) and single-admin model |
| **Cloud Storage** | Supabase Storage | Private S3-compatible buckets with signed URLs |
| **Drag & Drop** | `@dnd-kit/core` & `@dnd-kit/sortable` | Accessible Kanban interaction |
| **PDF Generation** | `jspdf` & `jspdf-autotable` | High-fidelity vector PDF rendering |
| **Timezone & Dates** | `date-fns` & `date-fns-tz` | Hardened to `Asia/Kolkata` (IST) |

---

## 📦 Project Structure

```text
TeamFlow/
├── index.html                   # HTML entry point
├── package.json                 # Project dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS theme configuration
├── tsconfig.json                # TypeScript compiler settings
├── vercel.json                  # Vercel SPA routing and cache headers
├── vite.config.ts               # Vite bundler configuration
├── .env.example                 # Template for environment variables
├── .gitignore                   # Version control exclusion rules
├── src/
│   ├── main.tsx                 # Application bootstrap
│   ├── App.tsx                  # Top-level routing and providers
│   ├── index.css                # Global styles and design system variables
│   ├── components/
│   │   ├── layout/              # Sidebar, Header, ProtectedRoute
│   │   └── shared/              # Reusable Card, Modal, Badge, Button, Tables
│   ├── hooks/                   # Custom React hooks (useAuth, useSupabase)
│   ├── pages/                   # Application pages (Dashboard, Projects, Attendance, etc.)
│   ├── services/
│   │   └── supabase/            # Database query services, auth, and storage
│   ├── store/                   # Zustand stores (useAppStore)
│   ├── types/                   # TypeScript domain interfaces and types
│   └── utils/                   # Calculations, dates (IST), Excel, and PDF generators
└── supabase/
    └── migrations/              # Ordered PostgreSQL schema migrations (1 to 8)
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18.0+ or 20.0+
- npm 9.0+
- A Supabase project

### 1. Clone the Repository
```bash
git clone https://github.com/abishekradhakrishnan97-sketch/TeamFlow.git
cd TeamFlow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_APP_NAME=TeamFlow
VITE_APP_TIMEZONE=Asia/Kolkata
```

> **Security Notice**: Never commit `.env.local` or expose your Supabase `service_role` key in frontend code.

### 4. Run Development Server
```bash
npm run dev
```

---

## 🗄️ Database Migrations

Apply the migration scripts in `supabase/migrations/` in numerical sequence via the **Supabase Dashboard → SQL Editor**:

1. `20261101000001_create_extensions.sql` — UUID extension and timezone defaults.
2. `20261101000002_create_tables.sql` — Relational schema for projects, tasks, attendance, leaves, and revisions.
3. `20261101000003_create_indexes.sql` — Performance B-Tree and full-text search indexes.
4. `20261101000004_create_functions.sql` — Trigger functions for timestamp updates.
5. `20261101000005_rls_policies.sql` — Row Level Security restricting all tables to the authenticated administrator.
6. `20261101000006_seed_data.sql` — Initial departments and team member profiles.
7. `20261101000007_storage_setup.sql` — Storage buckets and RLS policies for reports and backups.
8. `20261101000008_attendance_extensions.sql` — Schema for half-day permissions, early log-offs, extended hours, and weekend work.

---

## 🪣 Supabase Storage Configuration

Create the following **3 private buckets** in **Supabase Dashboard → Storage**:

| Bucket Name | Privacy | Max File Size | Allowed MIME Types | Purpose |
|---|---|---|---|---|
| `teamflow-reports` | **Private** | 50 MB | `application/pdf` | HR and Attendance statements |
| `teamflow-backups` | **Private** | 100 MB | `application/json` | JSON database backups |
| `teamflow-assets` | **Private** | 10 MB | Image formats | Logos and branding assets |

---

## 🚀 Vercel Production Deployment

### 1. Connect Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import the GitHub repository: `abishekradhakrishnan97-sketch/TeamFlow`.

### 2. Configure Build & Output Settings
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Add Environment Variables in Vercel
Add the following under **Project Settings → Environment Variables**:

| Variable Name | Value | Environments |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-or-publishable-key` | Production, Preview, Development |
| `VITE_APP_NAME` | `TeamFlow` | Production, Preview, Development |
| `VITE_APP_TIMEZONE` | `Asia/Kolkata` | Production, Preview, Development |

### 4. Client-Side Routing
The repository includes `vercel.json` with SPA rewrite rules (`/(.*)` → `/index.html`), ensuring nested route refreshes (e.g. `/team/:id`, `/projects/:id`) resolve smoothly without 404 errors.

### 5. Supabase Auth Configuration for Production
In the **Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL**: Enter your production Vercel URL (e.g., `https://teamflow.vercel.app`).
- **Redirect URLs**: Add your production domain and preview wildcard URLs:
  - `https://teamflow.vercel.app/**`
  - `https://*-abishekradhakrishnan97-sketchs-projects.vercel.app/**`

---

## 🔒 Security Architecture

- **Single-Administrator Access**: Only authorized Design Lead accounts can log in; public self-registration is permanently disabled.
- **Row Level Security (RLS)**: Enforced at the database layer on every table.
- **Private Storage**: Confidential reports and backups are stored in private buckets accessible only through short-lived signed URLs.
- **Zero Secrets Exposure**: The Supabase `service_role` key is strictly excluded from frontend client code.

---

## 🛠️ Build & Verification Commands

```bash
# Verify TypeScript type check and compile bundle
npm run build

# Start local preview of production build
npm run preview
```
