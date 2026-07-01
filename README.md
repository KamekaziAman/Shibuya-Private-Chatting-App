# 💬 Shibuya

A modern real-time one-to-one chat application built with **React**, **Django**, **Django REST Framework**, **Django Channels**, **WebSockets**, and **PostgreSQL**.

Shibuya provides a clean messaging experience with secure authentication, instant messaging, media sharing, typing indicators, and a modern UI inspired by applications like Discord and Telegram.

---

## ✨ Features

* 🔐 JWT Authentication
* 👤 User Registration & Login
* 🔍 Search users by username
* 💬 One-to-One Conversations
* ⚡ Real-time Messaging using WebSockets
* 🟢 Online / Offline Status
* ⌨️ Typing Indicator
* 😊 Emoji Support
* 🎞️ GIF Support
* 📷 Image Uploads
* 🎥 Video Uploads
* 📁 File Attachments
* 📥 Download Attachments
* 🗑️ Clear Conversation
* 📱 Responsive Design
* 🌙 Modern Dark Theme
* 🚀 Fast React + Vite Frontend

---
<img width="979" height="857" alt="image" src="https://github.com/user-attachments/assets/24144f7f-9769-4512-9de4-bb5ce8a271eb" />
<img width="984" height="862" alt="image" src="https://github.com/user-attachments/assets/2d67643f-8d39-4e72-8b3e-3cb9dde58bb9" />


## 🛠 Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router
* Axios
* Framer Motion
* Lucide React

### Backend

* Django
* Django REST Framework
* Django Channels
* Daphne
* Redis
* PostgreSQL
* Simple JWT

---

## 📂 Project Structure

```text
Shibuya/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── accounts/
│   ├── chat/
│   ├── config/
│   ├── media/
│   ├── manage.py
│   └── requirements.txt
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Shibuya.git

cd Shibuya
```

---

### 2. Backend Setup

Create a virtual environment.

```bash
python -m venv .venv
```

Activate it.

**Windows**

```bash
.venv\Scripts\activate
```

**Linux / macOS**

```bash
source .venv/bin/activate
```

Install dependencies.

```bash
pip install -r requirements.txt
```

Create a `.env` file.

```env
SECRET_KEY=your-secret-key

DEBUG=True

DATABASE_URL=your-postgres-url

REDIS_URL=redis://localhost:6379

ALLOWED_HOSTS=localhost,127.0.0.1

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Run migrations.

```bash
python manage.py migrate
```

Create a superuser.

```bash
python manage.py createsuperuser
```

Start the backend.

```bash
python manage.py runserver
```

---

### 3. Frontend Setup

Navigate to the frontend.

```bash
cd frontend
```

Install packages.

```bash
npm install
```

Create a `.env` file.

```env
VITE_API_BASE_URL=http://localhost:8000

VITE_WS_BASE_URL=ws://localhost:8000

VITE_GIPHY_API_KEY=your-giphy-api-key
```

Run the development server.

```bash
npm run dev
```

---

## 📡 API Overview

### Authentication

```
POST /api/register/
POST /api/login/
POST /api/token/refresh/
GET  /api/me/
```

### Users

```
GET /api/users/search/?q=username
```

### Conversations

```
GET  /api/conversations/
POST /api/conversations/
DELETE /api/conversations/{id}/clear/
```

### Messages

```
GET  /api/messages/{conversation_id}/
POST /api/messages/
```

### WebSocket

```
ws://localhost:8000/ws/chat/{conversation_id}/
```

---

## 📷 Screenshots

Add screenshots here.

```
assets/

├── login.png

├── chat.png

├── search.png

├── attachments.png
```

---

## 🚀 Deployment

### Frontend

* Render
* Vercel
* Netlify

### Backend

* Render

### Database

* PostgreSQL
* Supabase

### Redis

* Upstash Redis

---

## 🔮 Future Improvements

* Voice Messages
* Video Calling
* Audio Calling
* Group Chats
* Message Reactions
* Reply to Messages
* Pinned Messages
* Read Receipts
* Push Notifications
* End-to-End Encryption
* Message Search
* User Profiles
* Custom Themes

---

## 🤝 Contributing

Contributions are always welcome.

1. Fork the repository.
2. Create a new branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Aman Rai**

If you enjoyed this project, consider giving it a ⭐ on GitHub!
