# 🚀 Acumen Teams

Acumen Teams is a modern team collaboration and productivity platform built for organizations to manage communication, tasks, and workflows efficiently — similar to Slack + Teams, but tailored for internal business operations.

---

## 🧠 Vision

To build a unified workspace where teams can:

* Communicate seamlessly 💬
* Manage tasks efficiently 📋
* Track attendance & performance 📊
* Collaborate in real-time 🚀

---

## ✨ Features

### 🔐 Authentication System

* Secure login & signup
* Token-based authentication (JWT)
* Role-based access (Admin / Team Member)

### 🏠 Dashboard

* Centralized workspace
* Quick navigation to all modules

### 💬 Team Chat

* Real-time communication
* Channel-based discussions

### 📢 Announcements

* Broadcast important updates
* Admin-controlled notifications

### 📅 Attendance Tracking

* Check-in / Check-out system
* Daily activity monitoring

### 📋 Task Management

* Assign tasks to team members
* Track progress and status

### ⚙️ Settings

* User profile management
* App configurations

---

## 🏗️ Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS

### Backend

* Django / Django REST Framework

### Other Tools

* Git & GitHub
* REST APIs
* JWT Authentication

---

## 📁 Project Structure

```
acumen-teams/
│
├── app/                # Next.js frontend
├── acumen_backend/     # Django backend
├── components/         # Reusable UI components
├── public/             # Static assets
├── lib/                # Utilities & helpers
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
python manage.py runserver
```

Backend runs on:

```
http://127.0.0.1:8000
```

---

## 🔗 API Integration

Frontend communicates with backend via REST APIs:

Example:

```js
fetch("http://127.0.0.1:8000/api/accounts/login/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    login: email,
    password: password
  })
})
```

---

## 🚀 Future Roadmap

* 🔄 Real-time chat using WebSockets
* 📁 File sharing system
* 🔔 Notifications system
* 📊 Advanced analytics dashboard
* 🤖 AI-powered productivity assistant

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a new branch
3. Make your changes
4. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Areesh Jabbar**
Building Acumen — a next-gen tech ecosystem 🚀

---
