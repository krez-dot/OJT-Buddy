# OJT Buddy

A full-stack internship management web app built for Filipino BSIT students. Track company applications, log daily hours, prep for interviews, manage required documents, and share progress with batchmates — all in one place.

---

## Features

- **Company Tracker** — 5-stage application pipeline (wishlist → applied → interview → accepted → rejected) with status history, priority levels, deadlines, AI company research, AI autofill from company name, and location-aware AI suggestions
- **Daily Logbook** — Log hours, tasks, location, and mood per day. Export a PDF report. AI can polish rough notes into professional entries
- **Interview Prep** — Curated OJT interview questions with an AI coach that gives instant feedback on your practice answers
- **Document Checklist** — Track required documents (NBI, MOA, endorsement letters, etc.) per company
- **Batch Share** — Share your progress feed with classmates; view public or private batch updates
- **Dashboard** — Daily hours chart (last 14 days), OJT journey progress tracker, company pipeline overview, upcoming deadlines, and mood trend
- **Calendar** — Visual calendar view of logged days and company deadlines
- **Profile & Settings** — Update OJT info, change password, pick accent color theme, generate AI resume summary, download a Certificate of Completion PDF
- **AI Chat** — Floating assistant with conversation memory, aware of your OJT context

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, React Router v7, Recharts, jsPDF, Lucide React |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Auth | JWT + bcryptjs |

---

## Project Structure

```
OJT-Buddy/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js          # pg pool
│   │   │   └── schema.sql        # full DB schema
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT middleware
│   │   ├── routes/
│   │   │   ├── ai.js             # Groq AI endpoints
│   │   │   ├── auth.js           # login / register
│   │   │   ├── companies.js      # CRUD + status history
│   │   │   ├── documents.js      # checklist CRUD
│   │   │   ├── interview.js      # questions CRUD
│   │   │   ├── logbook.js        # entries CRUD
│   │   │   ├── shares.js         # batch share feed
│   │   │   └── users.js          # profile, certificate
│   │   └── index.js              # Express app entry
│   ├── .env                      # secrets (see below)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/index.js          # Axios API helpers
    │   ├── components/           # Layout, Skeleton
    │   ├── context/              # AuthContext, ToastContext
    │   └── pages/                # one file per route
    ├── vite.config.js
    └── package.json
```

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database

```sql
-- Create a database
CREATE DATABASE ojtbuddy;
```

Then run the schema:

```bash
psql -U postgres -d ojtbuddy -f backend/src/db/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ojtbuddy
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

Start the server:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

The API runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `backend/.env` | Secret for signing JWTs |
| `GROQ_API_KEY` | `backend/.env` | Groq API key (get one free at console.groq.com) |
| `PORT` | `backend/.env` | Backend port (default: 5000) |
| `ALLOWED_ORIGIN` | `backend/.env` | Frontend URL for CORS in production |
| `VITE_API_URL` | `frontend/.env` | Backend API base URL (production) |

See `.env.example` for the template.

---

## API Routes

All routes are prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, returns JWT |
| GET/PUT | `/users/profile` | Get/update profile |
| GET/POST | `/companies` | List/create companies |
| PUT/DELETE | `/companies/:id` | Update/delete company |
| GET | `/companies/:id/history` | Status change timeline |
| GET/POST | `/logbook` | List/create log entries |
| PUT/DELETE | `/logbook/:id` | Update/delete entry |
| GET | `/logbook/stats` | Totals + required hours |
| GET/POST | `/documents` | List/create documents |
| PUT/DELETE | `/documents/:id` | Update/delete document |
| GET/POST | `/interview/questions` | List/add questions |
| DELETE | `/interview/questions/:id` | Delete custom question |
| GET/POST | `/shares` | Batch feed |
| POST | `/ai/interview-feedback` | AI answer feedback |
| POST | `/ai/logbook-helper` | AI entry polish |
| POST | `/ai/company-research` | AI company info |

---

## Getting a Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up for a free account
3. Create an API key under **API Keys**
4. Add it to `backend/.env` as `GROQ_API_KEY`

The free tier is sufficient for development and light usage.

---

## PDF Exports

- **Logbook PDF** — Export all log entries from the Logbook page
- **Certificate of Completion** — Available on the Profile page once required hours are met (default: 486h)
