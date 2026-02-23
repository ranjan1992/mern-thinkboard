# 🧠 ThinkBoard

A full-stack MERN notes application with a dark, minimal UI. Create, edit, and delete notes — protected by a Redis-backed rate limiter to prevent API abuse.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                       │
│                                                             │
│   React 19 + React Router + Tailwind CSS + DaisyUI          │
│                                                             │
│   ┌──────────┐   ┌─────────────┐   ┌──────────────────┐     │
│   │ HomePage │   │ CreatePage  │   │ NoteDetailPage   │     │
│   └──────────┘   └─────────────┘   └──────────────────┘     │
│         │               │                    │              │
│         └───────────────┴────────────────────┘              │
│                         │  Axios (HTTP)                     │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼  HTTP Requests to /api/notes
┌─────────────────────────────────────────────────────────────┐
│                     EXPRESS SERVER                          │
│                    (Node.js / port 5001)                    │
│                                                             │
│   Every request                                             │
│       │                                                     │
│       ▼                                                     │
│   ┌──────────────────────────────────┐                      │
│   │  Rate Limiter Middleware         │                      │
│   │  100 requests / 60s              │◄──── Upstash Redis   │
│   │  sliding window                  │────► 429 if exceeded │
│   └──────────────────────────────────┘                      │
│       │                                                     │
│       ▼                                                     │
│   ┌──────────────────────────────────┐                      │
│   │  Notes Router  /api/notes        │                      │
│   │  GET /           getAllNotes     │                      │
│   │  GET /:id        getNoteById     │                      │
│   │  POST /          createNote      │                      │
│   │  PUT /:id        updateNote      │                      │
│   │  DELETE /:id     deleteNote      │                      │
│   └──────────────────────────────────┘                      │
│       │                                                     │
│       ▼                                                     │
│   Notes Controller  ─────────────────────► MongoDB Atlas    │
│   (CRUD operations)                        (Mongoose ODM)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
mern-thinkboard/
│
├── package.json                      ← Root: build & start scripts
│
├── backend/
│   └── src/
│       ├── server.js                 ← Express app, middleware, static serving
│       ├── config/
│       │   ├── db.js                 ← MongoDB connection via Mongoose
│       │   └── upstash.js            ← Upstash Redis + rate limit config
│       ├── middleware/
│       │   └── rateLimiter.js        ← Applies sliding window rate limit
│       ├── models/
│       │   └── Note.js               ← Mongoose schema: title, content, timestamps
│       ├── routes/
│       │   └── notesRoutes.js        ← Maps HTTP verbs → controller functions
│       └── controllers/
│           └── notesController.js    ← getAllNotes, getNoteById, createNote,
│                                       updateNote, deleteNote
│
└── frontend/
    └── src/
        ├── main.jsx                    ← React entry, BrowserRouter
        ├── App.jsx                     ← Route definitions
        ├── lib/
        │   ├── axios.js                ← Axios instance (dev vs prod base URL)
        │   └── utils.js                ← Date formatter helper
        ├── pages/
        │   ├── HomePage.jsx            ← Fetches & displays all notes grid
        │   ├── CreatePage.jsx          ← Form to create a new note
        │   └── NoteDetailPage.jsx      ← View, edit, and delete a note
        └── components/
            ├── Navbar.jsx              ← Top nav with "New Note" button
            ├── NoteCard.jsx            ← Card with title, preview, delete
            ├── NotesNotFound.jsx       ← Empty state UI
            └── RateLimitedUI.jsx       ← Banner shown on HTTP 429
```

---

## 🔄 Data Flow

```
  User Action (click / form submit)
          │
          ▼
  React Component  (useState / useEffect)
          │
          │  axios.get / post / put / delete
          ▼
  Axios Instance ──────────────────────────────────────────────►
          │      dev:  http://localhost:5001/api                │
          │      prod: /api                                     │
          ▼                                                     │
  Express Rate Limiter ──► Upstash Redis                        │
          │                                                     │
     ✅ under limit             ❌ over limit                    │
          │                          │                          │
          ▼                          ▼                          │
  notesController            HTTP 429 response                  │
          │                    RateLimitedUI                    │
          ▼                   shown in browser                  │
  Mongoose (MongoDB Atlas) ◄───────────────────────────────────┘
          │
          ▼
  JSON Response ──► React state update ──► UI re-render
```

---

## 🛣️ API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/notes` | Fetch all notes (newest first) | `200` |
| `GET` | `/api/notes/:id` | Fetch a single note by ID | `200` |
| `POST` | `/api/notes` | Create a new note | `201` |
| `PUT` | `/api/notes/:id` | Update title / content | `200` |
| `DELETE` | `/api/notes/:id` | Delete a note | `200` |

**Request body** for `POST` and `PUT`:
```json
{
  "title": "My Note Title",
  "content": "Note body text..."
}
```

---

## 🖥️ Frontend Routes

```
/              →  HomePage         (notes grid, empty state)
/create        →  CreatePage       (new note form)
/note/:id      →  NoteDetailPage   (edit / delete a note)
```

---

## 🗃️ Data Model

```
Note (MongoDB Collection)
├── _id        ObjectId   ← auto-generated by MongoDB
├── title      String     ← required
├── content    String     ← required
├── createdAt  Date       ← auto-managed (timestamps: true)
└── updatedAt  Date       ← auto-managed (timestamps: true)
```

---

## 🛡️ Rate Limiting Flow

```
  Incoming Request
        │
        ▼
  Upstash Redis (cloud)
  Sliding window: 100 requests / 60 seconds
        │
   ┌────┴────────────┐
   │                 │
 under limit      over limit
   │                 │
  next()         HTTP 429 JSON
   │              {message: "Too many requests"}
   ▼                 │
Route Handler        ▼
                 RateLimitedUI
                 banner in React
```

The limiter is applied **globally** before any route is reached. All endpoints share the same 100 req/min budget, keeping Upstash free-tier usage minimal and protecting against abuse.


## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- An [Upstash Redis](https://upstash.com/) database (free tier works)

### Environment Variables

Create a `.env` file inside `backend/`:

```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/thinkboard
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
NODE_ENV=development
```

### Development

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev        # http://localhost:5001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Production Build

```bash
# From the project root:
npm run build      # installs deps + builds React into frontend/dist
npm start          # Express serves everything on PORT 5001
```

In production, Express serves the compiled React app as static files and returns `index.html` for all unmatched routes (SPA fallback).

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
