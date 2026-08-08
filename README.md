# NotesHub

A full-stack educational notes platform where students browse semester-wise **notes**, **slides**, and **PYQs**.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + React Router |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt password hashing |
| Email | Nodemailer (optional SMTP) |

## Project structure

```
notes-hub/
├── client/          # React app
├── server/          # Express API
├── .env.example     # Copy to .env
├── .gitignore
└── README.md
```

## Quick start

### 1. Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` — especially `MONGODB_URI` and `JWT_SECRET`.

### 3. MongoDB

If you don't have system MongoDB installed, a portable binary may already be under `.tools/` (gitignored). Start it with:

```bash
npm run mongo
# or: bash scripts/start-mongo.sh
```

Otherwise use a local `mongod` or a MongoDB Atlas URI in `.env`.

### 4. Backend

```bash
cd server
npm install
npm run seed    # admin user + sample semesters/subjects/resources
npm run dev
```

API: `http://localhost:5000`

Default admin (from `.env`):

- Email: `admin@noteshub.local`
- Password: `AdminPass123!`

### 5. Frontend

```bash
cd client
npm install
npm run dev
```

App: `http://localhost:5173` (or the next free port Vite prints)  
Vite proxies `/api` → `http://localhost:5000`.

## Features

- Landing page with semester cards
- Semester → subject → Notes / Slides / PYQs
- Register / login / logout / profile
- Protected resource access (JWT on backend; Drive URL not public)
- Confirmation modal before opening materials
- Admin panel (role-based) to manage content and users

## Security notes

- Passwords are hashed with bcrypt (never stored in plain text)
- JWT required for profile, resource access, and admin APIs
- Admin routes use `authorize('admin')` on the server
- Auth endpoints are rate-limited; Helmet + CORS configured
- Do **not** commit `.env` or real API keys

## Deployment tips

- Set `NODE_ENV=production`, a strong `JWT_SECRET`, and your production `CLIENT_URL` / `MONGODB_URI`
- Host the API (Render, Railway, etc.) and the client (Vercel/Netlify) separately, or serve `client/dist` from Express
- If hosting separately, set `VITE_API_URL=https://your-api.example.com/api` when building the client
- Keep Razorpay and SMTP secrets only on the server

## Learning path (how this was built)

1. React homepage + Hero + SemesterCard
2. React Router semester / subject pages
3. Resource sections (Notes / Slides / PYQs)
4. Express + MongoDB models
5. Auth (register/login/JWT/protected routes)
6. Secure Drive resource access + confirmation modal
7. Support page + Razorpay order/verify flow
8. Admin panel + security hardening
