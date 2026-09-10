# 🚀 Study Streak Rescue

> **Turn missed deadlines and overwhelming backlogs into realistic, stress-free catch-up momentum.**

Built with the **MERN Stack** (MongoDB, Express, React, Node.js), **Tailwind CSS**, **JWT Authentication**, and featuring **Zero-Guilt Schedule Rebalancing** + **Light/Dark Themes**.

---

## 🎯 Challenge & Solution

When students fall behind, traditional to-do apps display an intimidating wall of overdue tasks with red exclamation marks. This triggers guilt, avoidance, and abandoned study streaks.

**Study Streak Rescue** solves this psychology of falling behind:
1. **Realistic Pacing**: Breaks overwhelming topics into bite-sized 20–40 minute micro-tasks.
2. **Capacity-Aware Scheduling**: Distributes tasks strictly within the student's real available daily hours (e.g. 2h on weekdays, 4h on weekends) with a built-in 15% anti-burnout breathing buffer.
3. **1-Click Rescue / Rebalance Plan**: Missed yesterday's tasks? No guilt. One click scoops up all missed tasks from past dates and redistributes them smoothly starting **Today**.
4. **Focused Execution**: Today's task checklist paired with an integrated Pomodoro focus timer that plays an audio chime and automatically logs focus hours.
5. **Streak Protection**: Encouraging streak mechanics that measure restart resilience rather than punitive all-or-nothing perfectionism.

---

## ✨ Features

- 🔐 **JWT Authentication & Account Security**: Secure user registration, bcrypt password hashing, persistent login sessions, and individual streak analytics.
- 👤 **Student Profile & Account Settings (`/profile`)**:
  - **Change Username**: Seamlessly update your display name.
  - **Change Password**: Secure password update with current password verification and confirmation checks.
  - **All Created Plans Manager**: Dedicated section displaying every study and catch-up plan ever created, with progress bars, status badges, 1-click rescue triggers, timeline access, and safe plan deletion.
- ⚡ **Demo 1-Click Login**: Test the full platform instantly without filling forms.
- 🌓 **Professional Light & Dark Themes**: Modern glassmorphic aesthetic with seamless instant toggle and `localStorage` persistence.
- 🧠 **Smart Catch-Up Planner**:
  - Target Deadline input (when you want to be caught up).
  - Daily available-time sliders (weekday vs weekend study budgets).
  - Intelligent Topic Auto-Chunker (turns any topic into 20–35 min atomic tasks).
  - Automated catch-up schedule distribution.
- 🔄 **1-Click Plan Rescue (Regenerate Missed Plan)**:
  - Detects overdue tasks without deleting completion history.
  - Gently re-spreads pending tasks starting today.
  - Optional Burnout Protection automatically extends deadlines if daily capacity is exceeded.
- 📅 **Google Calendar Integration & Reminders**:
  - **1-Click Direct Remind**: Add any micro-task or today's study session directly to Google Calendar in one click with pre-filled title, duration, and subject.
  - **Full Schedule Export (.ics)**: Download the entire catch-up schedule with pre-configured 15-minute popup alarms/reminders for Google Calendar, Apple Calendar, or Outlook.
  - **Study Start Time Customizer**: Choose your preferred daily study hour (e.g. 10:00 AM, 7:00 PM).
- 🗑️ **Plan Deletion with Confirmation**:
  - Delete any catch-up plan directly from the Dashboard card or inside the Plan Detail view with a safety confirmation modal.
- 📈 **Comprehensive Progress & Task Analytics (`/progress`)**:
  - **Overall Task Completion Rate**: High-level completion percentage across all study plans.
  - **14-Day Study Velocity Chart**: Interactive bar chart displaying daily task completions, study time logged, and velocity.
  - **Subject-by-Subject Breakdown**: Progress metrics, task completion counts, and study hours divided by course.
  - **Complete Task Audit Log**: Searchable and filterable task database with filters by status (Completed, Pending, Overdue, Today), priority (High, Medium, Low), and subject, with 1-click status toggling and Google Calendar sync.
  - **Resilience Milestones**: Achievement badges celebrating task consistency and recovery after falling behind.

---

## 📁 Project Structure

```
study-streak-rescue/
├── backend/                       # Node.js & Express API
│   ├── config/
│   │   └── db.js                  # MongoDB connection with MongoMemoryServer fallback
│   ├── middleware/
│   │   └── auth.js                # JWT token verification
│   ├── models/
│   │   ├── User.js                # Student schema, bcrypt, streak methods
│   │   └── StudyPlan.js           # Catch-up plans, micro-tasks, rescue logs
│   ├── routes/
│   │   ├── authRoutes.js          # /register, /login, /me, /theme
│   │   └── planRoutes.js          # CRUD, /rescue, /suggest-breakdown, /toggle
│   ├── utils/
│   │   └── scheduleGenerator.js   # Smart catch-up & rescue algorithms
│   ├── .env                       # Environment configuration
│   ├── package.json
│   └── server.js                  # Express entry point
│
├── frontend/                      # React (Vite) + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Header, streak flame, theme toggle
│   │   │   ├── StreakFlame.jsx    # Streak badge & protection tooltip
│   │   │   ├── PomodoroTimer.jsx  # Focus timer with Web Audio chime
│   │   │   ├── DailyTaskList.jsx  # Today's interactive checklist
│   │   │   └── RescueModal.jsx    # 1-click rebalance dialog
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Authentication & user state
│   │   │   └── ThemeContext.jsx   # Light / Dark theme provider
│   │   ├── pages/
│   │   │   ├── Login.jsx          # Login with 1-click demo button
│   │   │   ├── Register.jsx       # Registration with validation
│   │   │   ├── Dashboard.jsx      # Streak hero, today's tasks, plan cards
│   │   │   ├── NewPlan.jsx        # Catch-up wizard with topic chunker
│   │   │   └── PlanDetail.jsx     # Day-by-day timeline & task manager
│   │   ├── services/
│   │   │   └── api.js             # Fetch wrapper with JWT headers
│   │   ├── App.jsx                # Router & layout
│   │   ├── index.css              # Tailwind directives & styles
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── package.json                   # Root orchestrator scripts
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18 or higher (v24 tested)
- **MongoDB**: Optional! If local MongoDB is not running, the backend **automatically starts an in-memory MongoDB server (`mongodb-memory-server`)** for zero-configuration instant setup.

### 2. Installation

In the root directory `study-streak-rescue`:

```bash
# Install dependencies for both backend and frontend
npm run install:all
```

Or install individually:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Running the Application

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

Now open **`http://localhost:5173`** in your browser!

---

## 🧪 Testing the 1-Click Rescue Feature

1. Log in using the **"1-Click Demo Login"** button on the login screen.
2. Click **"+ New Catch-Up Plan"** in the top navigation.
3. Choose a subject (e.g. `Algorithms`) and type a topic in the topic chunker (e.g. `Graph Traversals & Dijkstra`).
4. Click **"Auto-Breakdown"** to watch the topic split into bite-sized 25–40m tasks.
5. Set your target catch-up deadline and click **"Generate Catch-Up Schedule"**.
6. In the plan timeline, check off tasks for today to watch your study streak increment with celebration confetti!
7. Whenever life gets busy and tasks slip, click **"Rescue / Rebalance Plan"** to watch the algorithm automatically rebalance remaining tasks across future days starting today without any guilt!
