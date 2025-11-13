# BeanStream Lounge ☕

BeanStream Lounge is a coffee shop–themed MERN chat experience that fulfils the Week 5 Socket.io assignment. It delivers real-time messaging, presence, notifications, and a set of advanced chat features that create a lively, barista-style workspace.

---

## ✨ Feature Highlights

- **Authentication & Profiles** – Users register/login with JWT, pick a favourite drink, and get a signature avatar tint.
- **Persistent Conversations** – MongoDB stores users, rooms (group & private), messages, reactions, and read receipts.
- **Multiple Rooms & DMs** – Create tasting rooms or spin up private booths with peers.
- **Real-Time Messaging** – Socket.io powers bidirectional updates, delivery tracking, read receipts, and typing indicators.
- **File & Image Sharing** – Upload images, PDFs, zips, and more with secure server-side storage.
- **Notifications Suite** – Toasts, browser notifications, audio cues, and unread badges keep conversations flowing.
- **Message Enhancements** – Emoji reactions, pagination for history, and fuzzy search across your rooms.
- **Resilience** – Reconnection logic, message acknowledgements, and presence updates maintain a smooth UX.
- **Responsive UI** – Tailwind-styled React interface adapts nicely from mobile to desktop break bars.

---

## 🧱 Project Structure

```
real-time-communication-with-socket-io-emmumbua/
├── client/                       # React + Vite front-end (BeanStream Lounge)
│   ├── public/                   # Static assets (favicon, etc.)
│   ├── src/
│   │   ├── components/           # Chat UI, layout, and shared components
│   │   ├── context/              # Auth, Socket, and Chat providers
│   │   ├── hooks/                # File upload helper
│   │   ├── pages/                # Login & chat screens
│   │   ├── services/             # Axios API client
│   │   ├── utils/                # Audio helpers & utilities
│   │   ├── App.jsx               # Routing & guards
│   │   └── main.jsx              # React entry point
│   ├── index.html
│   ├── package.json
│   └── tailwind.config.js
├── server/                       # Express + Socket.io backend (BeanStream API)
│   ├── config/                   # Database connection
│   ├── controllers/              # Auth, room, message, upload, user logic
│   ├── middleware/               # Auth guards, error handler, uploads
│   ├── models/                   # Mongoose schemas (User, Room, Message)
│   ├── routes/                   # REST endpoints
│   ├── socket/                   # Socket.io initialisation & event handlers
│   ├── utils/                    # JWT helpers
│   ├── package.json
│   └── server.js                 # App bootstrap
├── Week5-Assignment.md
└── README.md                     # You are here
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB running locally (or provide a connection string)

### 1. Environment Setup

Create a `.env` file inside `server/` with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/beanstream
JWT_SECRET=supersecretbean
CLIENT_URL=http://localhost:5173
FILE_UPLOAD_PATH=uploads
```

> If you deploy, expose `SERVER_URL` so upload responses build correct URLs.

### 2. Install Dependencies

```bash
# In the server folder
cd server
npm install

# In the client folder
cd ../client
npm install
```

### 3. Run the App

```bash
# Start API + Socket.io server
cd server
npm run dev

# Start the React client (new terminal)
cd ../client
npm run dev
```

Navigate to <http://localhost:5173> and create your account to enter the lounge.

---

## ☕ Core & Advanced Features Checklist

- **Task 1 – Setup**: Express + Socket.io backend, Vite React frontend, handshake-authenticated socket channel, live connection verified.
- **Task 2 – Core Chat**:
  - JWT-based auth
  - Global room + per-room messaging with sender & timestamps
  - Typing indicators and live presence (online/offline & last seen)
- **Task 3 – Advanced Chat** (≥3 met):
  - Private conversations (`POST /api/rooms/direct`)
  - Multiple rooms with creation UI
  - File & image sharing via Multer uploads
  - Emoji reactions + read receipts
- **Task 4 – Notifications**:
  - Toast notifications + audio ping per incoming message
  - Browser notifications (with permission request)
  - Unread message counts per room
  - Join/leave presence events
- **Task 5 – Performance & UX**:
  - Message pagination + on-demand fetch of older history
  - Reconnection handling in the socket provider
  - Delivery acknowledgements (`chat:delivered`) and read tracking
  - Message search endpoint + UI
  - Responsive Tailwind layout (mobile ↔ desktop)

---

## 🔌 Socket Event Overview

| Event                | Direction      | Purpose |
|----------------------|----------------|---------|
| `chat:message`       | client → server (ack) | Send message (text/file/image) with delivery receipt |
| `chat:new_message`   | server → clients | Broadcast new message to room participants |
| `typing:start/stop`  | client ↔ server | Per-room typing state updates |
| `typing:update`      | server → clients | Aggregated typing users per room |
| `chat:reaction`      | client ↔ server (ack) | Add/update emoji reaction |
| `chat:read`          | client → server | Mark messages read, emit receipts |
| `chat:read_receipt`  | server → clients | Broadcast read status to room |
| `chat:delivered`     | client → server | Delivery confirmation for metrics |
| `notifications:new`  | server → client | Notify recipients (toast + browser API) |
| `presence:update`    | server → all    | Online/offline state + last seen |


---

## 🧪 Testing Notes

- **Manual QA**: encourage two-browser sessions to validate presence, notifications, reactions, and read receipts.
- **Media Uploads**: confirm the `/uploads` directory is created automatically and assets serve correctly via Express static middleware.
- **Search & Pagination**: scroll to top of message pane to fetch older history and try search bar for fuzzy match.
- **Reconnection**: stop/start the server while client remains open; reconnection toasts & rejoin events verify resilience.

---

## 📸 Suggested Screenshots

Add screenshots/GIFs showing:
- Login / registration screen
- Main lounge UI with rooms sidebar + active conversation
- Typing indicators & read receipts in action
- File/image preview in chat

Place them in a `docs/` or within the README once captured.

---

## 📦 Deployment Tips (Optional)

- **Server**: Render / Railway / Fly.io with environment variables and persistent storage (e.g. S3 for file uploads if needed).
- **Client**: Vercel / Netlify pointed at `client/` build output (`npm run build`).
- Remember to update `CLIENT_URL` (server) and `VITE_SERVER_URL` (client) accordingly.

---

