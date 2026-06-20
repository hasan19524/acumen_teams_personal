# 🚀 Acumen Teams

Acumen Teams is a modern full-stack business collaboration and workspace management platform — inspired by Slack, Discord, Microsoft Teams, and Notion — but built from scratch with a clean futuristic UI, modular architecture, and real-time WebSocket communication.

---

## 🧠 Vision

To build a unified workspace where teams can:

- Communicate in real-time across shared channels 💬
- Manage tasks and workflows efficiently 📋
- Track attendance and performance 📊
- Collaborate like a true SaaS product — from anywhere 🚀

---

## ✨ Features

### 🔐 Authentication System

- Secure signup and login
- JWT access + refresh token system
- Persistent authenticated dashboard routing
- Role-based access — Admin and Employee
- No unauthorized access — all API routes protected
- Workspace-based onboarding flow

### 🏠 Dashboard

- Team member count and online indicators
- Team count and role display
- Revenue widget with growth indicator
- Productivity score widget
- Recent activity feed
- Quick actions — Create Task, Schedule Meet, New Report
- System live status indicator

### 💬 Real-Time Chat System

- WebSocket-powered live messaging — Django Channels + Daphne
- Shared workspace channels visible to all members
- Multi-browser tested — messages sync instantly across sessions
- Message persistence — history loads correctly after page refresh
- Own messages appear on the right in blue, others on the left
- Channel creation with modal UI
- Search bar for conversations
- Video and audio call UI placeholders
- DM request structure prepared
- Workspace isolation — users only see their workspace channels

### 📢 Announcements

- Admin-controlled broadcast system
- Workspace-scoped announcements
- All members receive updates instantly

### 📅 Attendance Tracking

- Check-in / Check-out system
- Daily activity monitoring
- Attendance history

### 📋 Task Management

- Create and assign tasks to team members
- Track progress and status
- Task listing and management UI

### 👥 Team Management

- View all team members
- Role display per member
- Workspace member structure

### ⚙️ Settings

- Profile settings — username, email, company name
- Email and push notification toggles
- Two Factor Authentication toggle
- Change Password
- View Login Devices
- Dark mode support
- Theme options
- Language — English

---

## 🏗️ Tech Stack

### Frontend

- Next.js 16.2.4 — React framework with App Router
- React 19.2.4
- TypeScript 5.x — full type safety
- Tailwind CSS 4.x — utility-first styling
- Lucide React 1.11.0 — icons
- shadcn/ui 4.3.1 — UI components
- Radix UI 1.4.3 — accessible component primitives

### Backend

- Django 5.x — core web framework
- Django REST Framework 3.17.1 — API layer
- Django Channels 4.3.2 — WebSocket support
- Daphne 4.2.1 — ASGI server
- djangorestframework-simplejwt 5.5.1 — JWT authentication
- django-cors-headers 4.9.0 — CORS handling
- Pillow — media and image handling
- python-dotenv — environment variable management

### Database

- SQLite — development
- PostgreSQL — production ready via psycopg2-binary

### Real-Time

- Django Channels with InMemoryChannelLayer — development
- Redis channel layer — production ready

### Other Tools

- Git & GitHub
- REST APIs
- Django Admin — backend management panel
- Gunicorn + Uvicorn — production servers

---

## 🗄️ Database Models

| App           | Models                                                    |
| ------------- | --------------------------------------------------------- |
| accounts      | User, UserProfile                                         |
| workspaces    | Workspace, Team                                           |
| chat          | Channel, ChannelMember, Message, DMRequest, Block, Report |
| announcements | Announcement                                              |
| attendance    | AttendanceRecord                                          |
| tasks         | Task                                                      |

---

## 📁 Project Structure

```
Acumen-Teams/
│
├── app/                              # Next.js frontend (App Router)
│   ├── dashboard/
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── chat/page.tsx             # Real-time chat
│   │   ├── tasks/page.tsx            # Task management
│   │   ├── attendance/page.tsx       # Attendance tracking
│   │   ├── announcements/page.tsx    # Announcements
│   │   ├── team/page.tsx             # Team members
│   │   └── settings/page.tsx         # Settings
│   ├── login/page.tsx                # Login page
│   ├── signup/page.tsx               # Signup page
│   ├── features/page.tsx             # Features page
│   ├── pricing/page.tsx              # Pricing page
│   ├── support/page.tsx              # Support page
│   ├── download/page.tsx             # Download page
│   └── page.tsx                      # Landing page
│
├── components/
│   ├── DashboardSidebar.tsx          # Shared sidebar navigation
│   ├── DashboardLayout.tsx           # Dashboard layout wrapper
│   └── ui/                           # Reusable UI components
│       ├── Navbar.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── accordion.tsx
│       └── separator.tsx
│
├── hooks/
│   ├── useAuth.ts                    # Auth state management hook
│   └── usePublicRoute.ts             # Public route guard hook
│
├── lib/
│   ├── api.ts                        # API fetch wrapper with JWT
│   ├── auth.ts                       # Auth utilities
│   └── utils.ts                      # General utilities
│
├── acumen_backend/                   # Django backend
│   ├── accounts/                     # User auth, registration, profiles
│   ├── workspaces/                   # Workspace and team management
│   ├── chat/                         # Channels, messages, WebSocket
│   │   ├── consumers.py              # WebSocket consumer
│   │   ├── middleware.py             # JWT WebSocket middleware
│   │   ├── routing.py                # WebSocket URL routing
│   │   ├── models.py                 # Channel, Message, DMRequest
│   │   ├── views.py                  # REST API views
│   │   └── serializers.py            # API serializers
│   ├── announcements/                # Announcement system
│   ├── attendance/                   # Attendance tracking
│   ├── tasks/                        # Task management
│   └── config/                       # Django configuration
│       ├── settings.py               # Main settings
│       ├── asgi.py                   # ASGI config for WebSocket
│       ├── wsgi.py                   # WSGI config
│       └── urls.py                   # Root URL configuration
│
├── public/                           # Static assets
├── .env.local                        # Frontend environment variables
├── acumen_backend/.env               # Backend environment variables
├── requirements.txt                  # Python dependencies
├── package.json                      # Node dependencies
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/acumentravels-web/Acumen-Teams.git
cd Acumen-Teams
```

---

### 2️⃣ Frontend Setup

```bash
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

### 3️⃣ Backend Setup

```bash
cd acumen_backend
pip install -r requirements.txt
```

Create a `.env` file inside `acumen_backend/`:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=acumen_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
CORS_ORIGINS=http://localhost:3000
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend runs on:

```
http://127.0.0.1:8000
```

Django Admin:

```
http://127.0.0.1:8000/admin
```

---

### 4️⃣ Environment Variables

Frontend — `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
```

---

## 🔗 API Overview

### Authentication

```
POST /api/accounts/login/               — Login, returns JWT tokens
POST /api/accounts/register/            — Register new user
POST /api/accounts/token/refresh/       — Refresh access token
```

### Workspace

```
GET  /api/workspaces/                   — List workspaces
GET  /api/workspaces/members/           — Get workspace members
```

### Chat

```
GET  /api/chat/channels/                — List all channels
POST /api/chat/channels/                — Create a new channel
GET  /api/chat/messages/{channel_id}/   — Get messages for a channel
```

### WebSocket

```
ws://127.0.0.1:8000/ws/chat/{channel_id}/?token={jwt_token}
```

---

## 🔗 API Integration Example

Frontend communicates with backend via REST APIs:

```js
fetch("http://127.0.0.1:8000/api/accounts/login/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    login: email,
    password: password,
  }),
});
```

---

## ⚡ Real-Time Architecture

```
Browser A                         Django Channels
─────────                         ──────────────
WS connect ─────────────────→    ChatConsumer.connect()
Send message ───────────────→    ChatConsumer.receive()
                                         │
                                 group_send to workspace group
                                         │
Browser B ←──────────────────── ChatConsumer.chat_message()
(receives instantly, no reload)
```

All users in the same workspace share a channel group. Messages broadcast to all connected members in real time.

---

## ✅ Verified Test Results

The following was tested and confirmed working across Edge and Chrome browsers simultaneously:

- ✅ Multi-browser JWT authentication
- ✅ Both users visible in the same workspace
- ✅ Shared channel visibility
- ✅ Real-time message sync via WebSocket — no page reload needed
- ✅ Correct message alignment — own messages right, others left
- ✅ Message persistence after hard refresh
- ✅ Role-based display — Admin and Employee
- ✅ No unauthorized API access
- ✅ WebSocket connection stable across sessions
- ✅ Channel creation propagates to all connected users

---

## 🚀 Roadmap

### Next Phase

- 🔔 Notifications system
- 👥 Workspace invite system
- 📁 File and image uploads
- 🔴 Redis channel layer for production WebSocket scaling

### Future

- 🎙️ Voice and video calls — WebRTC
- 📊 Advanced analytics dashboard
- 🤖 AI-powered productivity assistant
- 📱 Mobile app — React Native
- 🌐 Production deployment — Railway / Render / AWS
- 📧 Email notification system
- 🌍 Multi-language support

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch — `git checkout -b feature/your-feature`
3. Make your changes
4. Commit — `git commit -m 'Add your feature'`
5. Push — `git push origin feature/your-feature`
6. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Areesh Jabbar**
Building Acumen — a next-gen tech ecosystem 🚀

---

colour system choosen
/_ Background _/

--background: #081325;
--background-secondary: #101D35;

/_ Surfaces _/

--surface: #172440;
--surface-hover: #20304E;

/_ Sidebar _/

--sidebar: #0D1B3D;
--sidebar-hover: #16284F;
--sidebar-active: #2A3D73;

/_ Brand _/

--primary: #E31E24;
--primary-hover: #F23138;

--secondary: #4B1587;
--secondary-hover: #5B1FA1;

/_ States _/

--success: #1FA463;
--warning: #F5B041;
--info: #5DADE2;
--error: #E31E24;

/_ Text _/

--text: #FFFFFF;
--text-secondary: #E8ECF6;
--text-muted: #B7C0D8;

/_ Borders _/

--border: #2A3A5C;
--divider: #24334F;
