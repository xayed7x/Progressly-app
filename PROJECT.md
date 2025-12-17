# Progressly - Project Constitution

> **Last Updated:** December 18, 2024
> 
> This is the single source of truth for the Progressly application. Review this file for full context before making any changes.

---

## 📋 Overview

**Progressly** is a personal productivity and time-tracking application that allows users to log their daily activities, set goals, and visualize their progress. The unique feature is the **"Wake-up to Wake-up"** day cycle that reflects natural sleep patterns rather than arbitrary midnight boundaries.

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, TailwindCSS |
| **Backend** | FastAPI (Python), SQLModel |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth |
| **Hosting** | Frontend: Vercel, Backend: Render |

### Directory Structure

```
progressly-app/
├── progressly/                 # Next.js Frontend
│   └── src/
│       ├── app/
│       │   ├── dashboard/      # Main activity tracking
│       │   ├── goals/          # Goals & daily targets
│       │   ├── chat/           # AI chat feature
│       │   ├── auth/           # Authentication
│       │   └── onboarding/     # New user onboarding
│       ├── components/ui/      # Reusable UI components
│       └── lib/                # Utilities, types, API clients
│
├── progressly-api/             # FastAPI Backend
│   ├── main.py                 # Main API endpoints
│   ├── models.py               # SQLModel database models
│   ├── routers/                # API route modules
│   └── dependencies.py         # Auth & DB dependencies
│
└── schema.sql                  # Database schema reference
```

---

## 🗃️ Database Models

### Core Tables

| Table | Purpose |
|-------|---------|
| `goal` | User goals (onboarding) |
| `category` | Activity categories (Work, Sleep, etc.) |
| `logged_activity` | Individual activity entries |
| `daily_target` | Daily time targets per category |
| `conversations` | AI chat conversations |
| `messages` | Chat messages |

### Key Relationships

- `LoggedActivity` → `Category` (many-to-one)
- `Message` → `Conversation` (many-to-one)

---

## ✨ Implemented Features

### 1. Activity Logging
- Log activities with name, start/end time, category
- Automatic overnight activity detection
- Category color coding

### 2. Dashboard
- Daily activity list
- Pie chart visualization
- Previous/Next day navigation
- Activities wrapper with edit/delete

### 3. Day Cycle System (Wake-up to Wake-up)

**Smart Night Sleep Detection:**
- Day advances ONLY when:
  - Sleep activity ends between **4 AM - 12 PM**
  - Sleep duration >= **2 hours**
- Naps (afternoon sleep) do NOT trigger day change

**Manual "End My Day" Button:**
- Golden accent button appears when not on today's date
- Click to manually advance to next day
- Useful when sleep logging is missed

**Backend `effective_date`:**
- API returns `effective_date` based on sleep patterns
- Frontend initializes `selectedDate` from this value

### 4. Categories
- Default categories: Work, Study, Exercise, Leisure, Sleep, Social, Self-care, Other
- Custom category creation
- Category colors

### 5. Daily Targets
- Set hourly targets per category
- Progress tracking against targets
- Edit/delete targets

### 6. Goals
- User goals (set during onboarding)
- Goals page with target list

### 7. Chat (AI)
- AI assistant for productivity advice
- Conversation history

### 8. Authentication
- Supabase Auth (email/password)
- Email verification
- Protected routes

---

## 🔗 API Endpoints

### Dashboard
- `GET /api/dashboard-bootstrap` - All data for dashboard (activities, categories, pie chart, effective_date)

### Activities
- `GET /api/activities?target_date=YYYY-MM-DD` - Activities for date
- `POST /api/activities` - Create activity
- `PUT /api/activities/{id}` - Update activity
- `DELETE /api/activities/{id}` - Delete activity

### Categories
- `GET /api/categories` - User's categories
- `POST /api/categories` - Create category

### Targets
- `GET /api/targets` - User's daily targets
- `POST /api/targets` - Create/update target
- `DELETE /api/targets/{id}` - Delete target

### Goals
- `GET /api/goals` - User's goals
- `POST /api/goals` - Create goal

---

## 🎨 UI Components

### Dashboard Components
| Component | Purpose |
|-----------|---------|
| `ActivityLogger` | Form to log new activities |
| `DaySelector` | Day navigation + End My Day button |
| `ActivitiesWrapper` | Activity list container |
| `ActivityCard` | Individual activity display |
| `DailySummaryChart` | Pie chart visualization |
| `CategorySelect` | Category dropdown |

### Design System
- **Primary Color:** Accent (golden/amber)
- **Background:** Black with gradient blurs
- **Font:** Custom serif headings, sans-serif body

---

## 🔒 Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=
```

### Backend (`.env`)
```
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
FRONTEND_URL=
CLEANUP_SECRET_TOKEN=
```

---

## 📝 Recent Changes Log

### December 18, 2024
- **Smart Day Change:** Day no longer changes at midnight
- **Night Sleep Detection:** 4AM-12PM + 2hr minimum
- **End My Day Button:** Manual day advancement
- **effective_date API:** Backend returns user's current "day"

---

## 🚀 Deployment

### Frontend (Vercel)
- Auto-deploys from `main` branch
- Domain: https://autex.vercel.app/

### Backend (Render)
- Auto-deploys from `main` branch
- Uses uvicorn with gunicorn

---

## 🛠️ Development

### Running Locally

**Frontend:**
```bash
cd progressly
npm install
npm run dev
```

**Backend:**
```bash
cd progressly-api
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 📌 Important Notes

1. **Day Boundary Logic:** Always consider wake-up to wake-up, not midnight
2. **Offline Support:** IndexedDB for offline activity queuing (partial)
3. **Categories:** "Sleep" category is special - triggers day detection
4. **Time Format:** API uses 24-hour format (HH:MM:SS)

---

> **To update this document:** After implementing new features, add them to the appropriate section above.
