# Progressly - Project Constitution

> **Last Updated:** December 20, 2024
> 
> This is the single source of truth for the Progressly application. Review this file for full context before making any changes.

---

## 📋 Overview

**Progressly** is a personal productivity and time-tracking application that allows users to log their daily activities, set goals, complete challenges, and visualize their progress. Features include **100-day consistency challenges**, **AI coaching**, and **"Wake-up to Wake-up"** day cycle that reflects natural sleep patterns.

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), TypeScript, TailwindCSS, Recharts |
| **Backend** | FastAPI (Python), SQLModel |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Hosting** | Frontend: Vercel, Backend: Render |

### Directory Structure

```
progressly-app/
├── progressly/                 # Next.js Frontend
│   └── src/
│       ├── app/
│       │   ├── dashboard/      # Main activity tracking + Challenge Dashboard
│       │   ├── analytics/      # Analytics & Insights (NEW)
│       │   ├── settings/       # Unified Settings (NEW - replaces /goals, /account)
│       │   ├── chat/           # AI chat feature
│       │   ├── auth/           # Authentication
│       │   └── onboarding/     # New user onboarding
│       ├── components/ui/      # Reusable UI components
│       └── lib/                # Utilities, types, API clients, services
│
├── progressly-api/             # FastAPI Backend
│   ├── main.py                 # Main API entry + routers
│   ├── models.py               # SQLModel database models
│   ├── routers/                # API route modules
│   │   ├── activities.py
│   │   ├── categories.py
│   │   ├── challenges.py       # Challenge CRUD + abandon
│   │   ├── targets.py
│   │   ├── ai.py
│   │   └── goals.py
│   └── dependencies.py         # Auth & DB dependencies
│
├── schema.sql                  # Database schema reference
├── PROGRESS.md                 # Session-by-session progress tracker
└── PROJECT.md                  # This file (constitution)
```

---

## 🗃️ Database Models

### Core Tables

| Table | Purpose |
|-------|---------|
| `goal` | User goals (onboarding) |
| `category` | Activity categories (Work, Sleep, etc.) |
| `logged_activity` | Individual activity entries with `effective_date` |
| `daily_target` | Daily time targets per category |
| `user_sessions` | End My Day state for cross-device sync |
| `challenges` | 100-day consistency challenges |
| `daily_challenge_metrics` | Daily stats for challenges |
| `behavior_patterns` | Detected user patterns |
| `conversations` | AI chat conversations |
| `messages` | Chat messages |

### Key Relationships

- `LoggedActivity` → `Category` (many-to-one)
- `Message` → `Conversation` (many-to-one)
- `DailyChallengeMetrics` → `Challenge` (many-to-one)

---

## ✨ Implemented Features

### 1. Challenge System (NEW)
- **100-day consistency challenges**
- Challenge setup wizard (duration, commitments)
- Challenge Dashboard with progress tracking
- Abandon/complete challenge functionality
- Day-by-day metrics and completion rates

### 2. Activity Logging
- Log activities with name, start/end time, category
- **Quick Tap Logging** - One-tap timer-based logging
- **Voice Logging** - Speech-to-text activity entry
- Manual entry with animated placeholders
- Automatic overnight activity detection
- Category color coding

### 3. Dashboard
- **Coach Insight** - AI-generated daily motivation
- **Challenge Header** - Current challenge & progress
- **Log Center** - Quick Log & Manual Entry tabs
- **Today's Commitments** - Target activities
- **Day Selector** - Navigation between dates
- **Activity List** - Daily logged activities
- **Daily Summary Chart** - Pie/Bar chart visualization
- **Overall Progress** - Dual ring indicators
- **Heatmap Calendar** - GitHub-style activity viz
- **End of Day Summary** - Daily recap modal

### 4. Analytics Dashboard (NEW)
- **Overview Tab** - Today/Week/Month totals, daily average, top categories
- **Trends Tab** - Line chart (30 days), Bar chart (weekly comparison)
- **Patterns Tab** - Behavioral insights
- **Comparison Tab** - Target vs Actual with progress bars

### 5. Settings Page (NEW - Unified)
- **Profile Tab** - User info, logout
- **Challenge Tab** - Edit name, view commitments, abandon
- **Categories Tab** - Add/delete categories
- **Goals Tab** - Big dream goal, daily targets per category

### 6. Categories
- Default: Work, Study, Exercise, Leisure, Sleep, Social, Self-care, Other, Spiritual, Skill, Health, Family, Eating
- Custom category creation with color picker
- Delete with warning (activities become uncategorized)

### 7. Daily Targets
- Set hourly targets per category
- Progress tracking against targets
- Visual comparison in Analytics

### 8. AI Chat (Enhanced)
- **Psychology-Informed Coaching**
  - AVE Prevention (Abstinence Violation Effect) - External attribution for setbacks
  - Identity Reinforcement - References user's challenge identity statement
  - Pattern-Based Advice - Uses specific data from behavioral patterns
  - Asymmetric Celebration - Big celebrations for milestones and resilience
- **Comprehensive Context Building**
  - Challenge info (name, day X/Y, commitments, identity/why statements)
  - Today's progress per commitment
  - Last 7 days summary with visual indicators
  - Current & longest streak calculations
  - Goals and daily targets
- **Concise, Actionable Responses** - 2-3 sentences for simple questions
- Conversation history persistence

### 9. Authentication
- Supabase Auth with Google OAuth
- Protected routes via middleware
- Email verification

---

## 🧭 Navigation

### Mobile Bottom Nav (4 items)
| Icon | Label | Route |
|------|-------|-------|
| 🏠 | Home | `/dashboard` |
| 📊 | Analytics | `/analytics` |
| 💬 | Chat | `/chat` |
| ⚙️ | Settings | `/settings` |

---

## 🔗 API Endpoints

### Dashboard
- `GET /api/dashboard-bootstrap` - All data for dashboard

### Activities
- `GET /api/activities?target_date=YYYY-MM-DD` - Activities for date
- `GET /api/activities?days=N` - Last N days of activities
- `POST /api/activities` - Create activity
- `PUT /api/activities/{id}` - Update activity
- `DELETE /api/activities/{id}` - Delete activity

### Categories
- `GET /api/categories` - User's categories
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Challenges
- `GET /api/challenges/active` - Active challenge
- `POST /api/challenges` - Create challenge
- `PUT /api/challenges/{id}` - Update challenge
- `POST /api/challenges/{id}/abandon` - Abandon challenge
- `DELETE /api/challenges/{id}` - Delete challenge

### Targets
- `GET /api/targets` - User's daily targets
- `POST /api/targets` - Create/update target
- `DELETE /api/targets/{id}` - Delete target

### Goals
- `GET /api/goals` - User's goals
- `POST /api/goals` - Create goal

### AI
- `POST /api/chat` - Send message to AI coach
- `POST /api/ai/daily-insight` - Generate daily insight

---

## 🎨 UI Components

### Dashboard Components
| Component | Purpose |
|-----------|---------|
| `ChallengeDashboard` | Main dashboard when challenge active |
| `ChallengeSetup` | Wizard to create new challenge |
| `QuickTapLogging` | One-tap timer logging |
| `VoiceLogging` | Speech-to-text logging |
| `ActivityLogger` | Manual activity form |
| `DaySelector` | Day navigation + End My Day |
| `ActivitiesWrapper` | Activity list container |
| `ActivityCard` | Individual activity display |
| `DailySummaryChart` | Pie/Bar chart |
| `HeatmapCalendar` | GitHub-style activity calendar |
| `DualRingProgress` | Challenge/daily progress rings |
| `EndOfDaySummary` | Daily recap modal |
| `DailyCoachInsight` | AI motivation widget |
| `PatternInsights` | Detected patterns display |

### Design System
- **Primary Color:** Accent (golden/amber `#f5c542`)
- **Background:** Black with gradient blurs
- **Glass Effect:** `bg-gray-900/50 backdrop-blur-xl`
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
ANTHROPIC_API_KEY=
```

---

## 📝 Recent Changes Log

### December 20, 2024 - **AI Coach Enhancement** ✅

**Psychology-Informed Coaching:**
- AVE Prevention (Abstinence Violation Effect) - External attribution for setbacks
- Identity Reinforcement - References user's challenge identity statement
- Pattern-Based Advice - Data-driven, not generic motivation
- Asymmetric Celebration - Milestone and resilience recognition

**New Files:**
- `services/ai_context_builder.py` - Comprehensive context builder
- `utils/metrics.py` - Streak calculation utilities

**Modified:**
- `routers/ai.py` - Enhanced system prompt + context integration

---

### December 20, 2024 - **Phase 11: Analytics Dashboard** ✅

**New Features:**
| Feature | Description |
|---------|-------------|
| **Analytics Page** | `/analytics` with 4 tabs: Overview, Trends, Patterns, Comparison |
| **Settings Page** | Unified `/settings` replaces `/goals` and `/account` |
| **Bottom Nav Update** | 4 items: Home, Analytics, Chat, Settings |

**API Additions:**
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
- `PUT /api/challenges/{id}` - Update challenge
- `POST /api/challenges/{id}/abandon` - Abandon challenge

**Deleted Pages:**
- `/goals` → Merged into `/settings` (Goals tab)
- `/account` → Merged into `/settings` (Profile tab)

### December 20, 2024 - **Challenge System + Dashboard Overhaul**

- Implemented 100-day consistency challenge system
- Created ChallengeSetup wizard (5-step flow)
- Built ChallengeDashboard with "Action-First" layout
- Integrated QuickTapLogging with cross-device timer sync
- Added VoiceLogging with Web Speech API
- Created HeatmapCalendar, DualRingProgress, EndOfDaySummary
- Fixed various z-index and styling issues

### December 20, 2024 - **Effective Date System Upgrade**

- Cross-device sync via `user_sessions` table
- End My Day button with lock mechanism
- Timezone-safe date formatting
- `effective_date` column for psychological day assignment

---

## 🚀 Deployment

### Frontend (Vercel)
- Auto-deploys from `main` branch
- Domain: https://progressly-app.vercel.app/

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
python run.py
```

---

## 📌 Important Notes

1. **Day Boundary Logic:** Always consider wake-up to wake-up, not midnight
2. **Single Active Challenge:** Only one challenge can be active at a time
3. **Categories:** "Sleep" category is special - triggers day detection
4. **Time Format:** API uses 24-hour format (HH:MM:SS)
5. **Patterns Tab:** Currently shows static insights (to be made dynamic)

---

> **To update this document:** After implementing new features, add them to the appropriate section above.

