# Smart Campus Commute Optimizer — Setup Guide

## What Was Built

### Issues Found & Fixed
| # | Issue | Fix |
|---|-------|-----|
| 1 | Frontend didn't exist (empty package.json) | Built complete React 18 + Vite + Tailwind SPA |
| 2 | Backend was a 42-line skeleton with no DB, auth, or logic | Full Express + MongoDB + JWT + Passport backend |
| 3 | DSA matcher returned empty array with TODO comments | Implemented Haversine-based graph matching with weighted scoring |
| 4 | No authentication system | Google OAuth (restricted to @srmist.edu.in) + Email OTP |
| 5 | No input validation or error handling | express-validator + global error handler + rate limiting |
| 6 | No security headers | helmet, CORS, rate limiting, JWT |
| 7 | Hardcoded port, no env config | Full .env system with .env.example |
| 8 | express@5 (unstable) used | Downgraded to express@4 (LTS) |

### New Features Added
- Role-based access (student / admin)
- Real-time notifications via Socket.io
- Profile management with completion tracker
- Admin panel (user management, broadcast notifications)
- Ride creation (offer/request), join flow, accept/reject passengers
- DSA-based ride matching (Haversine + time + destination scoring)
- Responsive SPA with modern UI (Inter font, Tailwind, gradients)
- Google OAuth restricted to @srmist.edu.in domain
- Email OTP with HTML template
- JWT auth with 7-day expiry
- MongoDB models: User, Ride, Notification, OTP (with TTL)

---

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)
- Google Cloud Console account
- Gmail account with App Password

---

## Step 1 — MongoDB Atlas

1. Go to https://cloud.mongodb.com → Create free cluster
2. Create a database user (username + password)
3. Whitelist IP: `0.0.0.0/0` (or your server IP)
4. Click **Connect** → **Drivers** → copy the connection string
5. Replace `<password>` in the URI with your DB password

---

## Step 2 — Google OAuth Setup

1. Go to https://console.cloud.google.com
2. Create a new project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (dev)
   - `https://yourdomain.com/api/auth/google/callback` (prod)
6. Copy **Client ID** and **Client Secret**

---

## Step 3 — Gmail App Password

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → **App Passwords**
3. Generate a password for "Mail" → "Other"
4. Copy the 16-character password

---

## Step 4 — Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/smart-campus?retryWrites=true&w=majority

JWT_SECRET=generate_a_64_char_random_string_here
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM="Smart Campus <youremail@gmail.com>"

OTP_EXPIRES_MINUTES=10
ALLOWED_EMAIL_DOMAINS=srmist.edu.in,srmap.edu.in
```

> **Generate JWT_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## Step 5 — Install & Run

### Backend
```bash
cd backend
npm install
npm run dev
# → Server running on http://localhost:5000
```

### Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# → App running on http://localhost:5173
```

---

## Step 6 — Create First Admin

After signing in with your @srmist.edu.in email, run this in MongoDB Atlas **Data Explorer** or MongoDB Compass:

```javascript
// In the 'users' collection, find your user and set role to admin
db.users.updateOne(
  { email: "your_email@srmist.edu.in" },
  { $set: { role: "admin" } }
)
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/send-otp` | — | Send OTP to SRM email |
| POST | `/api/auth/verify-otp` | — | Verify OTP, get JWT |
| GET | `/api/auth/google` | — | Google OAuth redirect |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/users/dashboard` | JWT | Dashboard data |
| PUT | `/api/users/profile` | JWT | Update profile |
| GET | `/api/rides` | JWT | List rides |
| POST | `/api/rides` | JWT | Create ride |
| GET | `/api/rides/:id/matches` | JWT | DSA match results |
| POST | `/api/rides/:id/join` | JWT | Request to join |
| PUT | `/api/rides/:id/passengers/:uid` | JWT | Accept/reject |
| GET | `/api/notifications` | JWT | Get notifications |
| GET | `/api/admin/stats` | Admin | Platform stats |
| GET | `/api/admin/users` | Admin | All users |
| POST | `/api/admin/broadcast` | Admin | Send broadcast |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | 64-char random secret for JWT signing |
| `GOOGLE_CLIENT_ID` | ✅ | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | From Google Cloud Console |
| `EMAIL_USER` | ✅ | Gmail address for OTP sending |
| `EMAIL_PASS` | ✅ | Gmail App Password (16 chars) |
| `FRONTEND_URL` | ✅ | Frontend origin (for CORS + OAuth redirect) |
| `ALLOWED_EMAIL_DOMAINS` | Optional | Comma-separated, default: `srmist.edu.in,srmap.edu.in` |
| `OTP_EXPIRES_MINUTES` | Optional | Default: 10 |
| `PORT` | Optional | Default: 5000 |

---

## Production Deployment

### Backend (Render / Railway / EC2)
```bash
# Set NODE_ENV=production
# Set all env variables in the platform dashboard
npm start
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy the dist/ folder
# Set VITE_API_URL env var if backend is on different domain
```

Update `vite.config.js` proxy → point to your production backend URL.
Update Google OAuth → add production callback URL in Google Cloud Console.

---

## Project Structure

```
smart-campus-commute-optimizer/
├── backend/
│   ├── config/          # DB + Passport setup
│   ├── controllers/     # Route handlers
│   ├── middleware/       # JWT auth + role check
│   ├── models/          # Mongoose schemas (User, Ride, Notification, OTP)
│   ├── routes/          # Express routers
│   ├── utils/           # Matcher (DSA), email service
│   ├── .env             # Environment (gitignored)
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── components/  # Navbar, common UI
        ├── context/     # AuthContext (JWT + Socket.io)
        ├── pages/       # Login, Dashboard, Rides, Profile, Admin
        └── utils/       # Axios instance with JWT interceptor
```
