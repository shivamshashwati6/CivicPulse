# CivicPulse

> AI-Powered Civic Issue Reporting & Management Platform

CivicPulse is a modern full-stack web application designed for citizens to report public infrastructure issues (such as potholes, broken streetlights, illegal garbage dumping, water leakage, and damaged roads) by capturing/uploading photos. The platform utilizes AI vision triage (powered by Google Gemini API) to classify, rate severity, and route reports to municipal administrative teams.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM v7, Lucide React Icons
- **Backend & Database**: Supabase (Authentication, PostgreSQL Database, Storage)
- **AI Triage Integration**: Prepared for Google Gemini Vision API
- **Maps & Geolocation**: Prepared for Leaflet + OpenStreetMap integration

---

## 📂 Project Architecture

```text
src/
├── assets/                  # Media & graphic assets
├── components/
│   ├── common/              # LoadingSpinner, PageHeader
│   ├── layout/              # Navbar, Footer, Layout
│   └── ui/                  # Button, Card, Input, Badge primitives
├── context/                 # AuthContext provider
├── hooks/                   # useAuth, useIssues custom hooks
├── pages/
│   ├── Admin/               # Municipal administration view
│   ├── Dashboard/           # Citizen overview dashboard
│   ├── Landing/             # Platform landing page
│   ├── Login/               # Auth login view
│   ├── Report/              # Issue reporting photo form
│   └── Track/               # Live issue tracking list
├── routes/                  # AppRoutes React Router config
├── services/                # Supabase client & API services
└── utils/                   # Constants and utility functions
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 🔒 License

MIT License. Built with ❤️ for civic empowerment.
