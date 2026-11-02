# AQUANET X

Urban water intelligence and emergency safety platform.

## Project Structure

```
datanyx/
├── aquanet-x-v2.html          # Original landing page (preserved as backup)
├── aquanet-x-v2.BACKUP.html   # Backup copy
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/             # All application pages
│   │   ├── contexts/          # Auth + Connectivity context
│   │   ├── components/        # Shared components
│   │   ├── firebase.ts        # Firebase configuration
│   │   └── db.ts              # IndexedDB (Dexie)
│   ├── public/
│   │   ├── sw.js              # Service Worker (PWA)
│   │   └── manifest.json      # PWA manifest
│   └── .env                   # Fill with Firebase credentials
└── backend/                   # Node.js + Express
    ├── server.js              # Main server
    ├── firebaseAdmin.js       # Optional Firebase Admin
    └── .env                   # Fill with Gemini + MongoDB credentials
```

## Quick Start

### 1. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in Firebase credentials in .env
npm install
npm run dev
```

Open http://localhost:5173

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in Gemini API key and MongoDB URI
npm start
```

### 3. Demo Mode (No credentials needed)

Start only the frontend. Click **Demo Login** on the login page to explore all features with demo data.

---

## Required Credentials

### Firebase (Frontend — Authentication)
1. Go to https://console.firebase.google.com
2. Create a project → Enable Authentication → Enable Email/Password (and Google if desired)
3. Go to Project Settings → Your apps → Add web app
4. Copy the config values to `frontend/.env`

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Gemini API (Backend — AQUA AI)
1. Go to https://aistudio.google.com/app/apikey
2. Create an API key
3. Add to `backend/.env`:

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### MongoDB Atlas (Backend — Database)
1. Go to https://cloud.mongodb.com
2. Create a free cluster → Create a database user → Get connection string
3. Add to `backend/.env`:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/aquanetx
```

---

## Application Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (ocean animation preserved) |
| `/login` | Login with Firebase or Demo |
| `/register` | Create account |
| `/dashboard` | Overview with metrics |
| `/dashboard/floodsense` | Flood risk map (Leaflet) |
| `/dashboard/water-stress` | Water supply/demand |
| `/dashboard/smart-recovery` | Recovery recommendations |
| `/dashboard/citizen-reports` | Submit & view reports (offline-capable) |
| `/dashboard/alerts` | All active alerts |
| `/dashboard/weather` | Weather with animations |
| `/dashboard/aqua-ai` | AQUA AI chat (Gemini) |
| `/dashboard/emergency` | Emergency SOS + contacts |
| `/dashboard/profile` | User profile |
| `/dashboard/settings` | App settings |

---

## Offline / PWA

- Service worker caches app shell and API responses
- Citizen reports saved to IndexedDB when offline
- Emergency messages queued offline, synced on reconnect
- Run `npm run build` then deploy `dist/` folder for installable PWA

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend → Render / Railway
```bash
# Set environment variables in your hosting provider
# Deploy backend/ directory
# Update VITE_API_BASE_URL in frontend .env to point to deployed backend
```
