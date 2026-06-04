# Worship Hub

A simple setlist manager for church worship teams. The worship leader sets the song list for Sunday — singers and musicians open the link and see the lyrics and chord sheets, no login required.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **Setlist for Sunday** — leader sets the date and song order
- **Lyrics & chord sheets** — each song has two tabs, one for lyrics and one for the chord chart
- **Drag-to-reorder** — rearrange songs in the setlist with drag and drop
- **Public view** — team members open the link in any browser, no account needed
- **Admin panel** — one password protects the leader's controls

## Screenshots

| Public setlist | Song view | Admin panel |
|---|---|---|
| Home page showing Sunday's songs in order | Lyrics and chord sheet tabs for a song | Drag-to-reorder list with add/edit/delete |

---

## Tech stack

- **Frontend** — React 18, Vite, Tailwind CSS, @dnd-kit (drag and drop)
- **Backend** — Node.js, Express
- **Database** — SQLite via `better-sqlite3`
- **Auth** — JWT, single admin password

---

## Running locally

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/worship-hub.git
cd worship-hub

# 2. Create your .env file
cp .env.example .env
# Edit .env and set ADMIN_PASSWORD and JWT_SECRET

# 3. Install dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 4. Start the app (runs both server and client dev server)
npm run dev
```

Open `http://localhost:5173` in your browser.

The API runs on port `3001`. The Vite dev server proxies `/api` requests to it automatically.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | Yes | Password the worship leader uses to log in |
| `JWT_SECRET` | Yes | Secret key for signing login tokens — use a long random string |
| `PORT` | No | Server port (default: `3001`) |
| `DB_PATH` | No | Path to the SQLite database file (default: `./data/worship.db`) |
| `NODE_ENV` | No | Set to `production` to serve the built frontend from Express |

---

## Deploying to Railway

### 1. Push to GitHub

Railway deploys from a Git repo. Push this project to a GitHub repository.

### 2. Create a new Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. Choose **Deploy from GitHub repo** and select your repo
3. Railway will detect the `Dockerfile` and build automatically

### 3. Set environment variables

In your Railway service, go to **Variables** and add:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | A strong password for the worship leader |
| `JWT_SECRET` | A long random string (e.g. output of `openssl rand -hex 32`) |
| `NODE_ENV` | `production` |

Railway injects `PORT` automatically — no need to set it.

### 4. Add a persistent volume for the database

Without a persistent volume the SQLite database is wiped on every deploy.

1. In your Railway service, go to **Volumes → Add Volume**
2. Set the mount path to `/data`

That's it. Railway will mount the volume at `/data` and the app writes `worship.db` there.

### 5. Deploy

Trigger a deploy (or push a commit). Your app will be live at the Railway-generated URL, which you can share with your worship team.

---

## Usage

### For the worship leader

1. Open the app URL and click **Leader login** in the top right
2. Enter the admin password
3. In the admin panel:
   - Set the **Sunday Date**
   - Click **Add Song** to add a song — paste lyrics in the Lyrics tab and the chord chart in the Chord Sheet tab
   - Drag the handle on the left of each song row to reorder the setlist
   - Use the edit or delete buttons to update songs

### For singers and musicians

Just open the app URL — no login needed. Tap a song to view its lyrics or chord sheet.

---

## Project structure

```
worship-hub/
├── server/
│   ├── index.js          # Express server, serves API + built frontend
│   ├── db.js             # SQLite setup and schema
│   ├── auth.js           # JWT middleware
│   └── routes/
│       ├── auth.js       # POST /api/auth/login
│       └── songs.js      # Song CRUD + reorder + settings
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx      # Public setlist view
│       │   ├── SongView.jsx  # Lyrics + chord sheet tabs
│       │   ├── Login.jsx     # Admin login
│       │   └── Admin.jsx     # Setlist management panel
│       └── api.js            # Fetch wrapper for the API
├── Dockerfile
└── .env.example
```

---

## License

MIT — free to use, modify, and self-host.
