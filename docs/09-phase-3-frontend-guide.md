# Phase 3 — Frontend Setup & Verification

The frontend was written directly into your project folder (no zip). It lives at:

```
C:\Users\ahad\OneDrive\Desktop\Ai Project Mentor\frontend
```

alongside `backend\`, `shared\` and `docs\`.

---

## 1. Confirm the layout

```powershell
cd "C:\Users\ahad\OneDrive\Desktop\Ai Project Mentor"
dir
```

Expected:

```
backend
docs
frontend
shared
```

And inside `frontend`:

```powershell
dir "C:\Users\ahad\OneDrive\Desktop\Ai Project Mentor\frontend\src"
```

Expected: `app`, `components`, `features`, `hooks`, `layouts`, `pages`, `routes`,
`services`, `styles`, `utils`, and `main.jsx`.

---

## 2. Install

**Pause OneDrive first** (tray icon → Pause syncing → 2 hours) — this is what fixed
every install issue earlier in this project.

```
cd "C:\Users\ahad\OneDrive\Desktop\Ai Project Mentor\frontend"
npm install
copy .env.example .env.local
```

If `npm install` errors with `Invalid Version`:

```
rmdir /s /q node_modules
del package-lock.json
npm cache verify
npm install
```

---

## 3. Run both apps

Two terminals.

Terminal 1 — backend:
```
cd "C:\Users\ahad\OneDrive\Desktop\Ai Project Mentor\backend"
npm start
```

Terminal 2 — frontend:
```
cd "C:\Users\ahad\OneDrive\Desktop\Ai Project Mentor\frontend"
npm run dev
```

Open <http://localhost:5173>. Sign in with `student@apm.dev` / `Password@123`
(run `npm run seed` in `backend` first if you haven't).

---

## 4. Verify it works

| # | Action | Expected |
|---|---|---|
| 1 | Open `/` | Landing page with a rotating 3D particle orb |
| 2 | Click **Sign in** | Split-screen auth page, particle field on the left |
| 3 | Sign in | Redirect to `/dashboard`, welcome toast |
| 4 | **Reload the page** | You stay signed in |
| 5 | Toggle the sun/moon icon | Whole app switches theme, particles recolour |
| 6 | Go to **My Projects** | Seeded projects in a card grid |
| 7 | Click **New project** | 4-step wizard |
| 8 | Open a project | Progress ring, 16 module cards, all "Not generated" |
| 9 | Collapse the sidebar | Icons only, tooltips on hover |
| 10 | Narrow the window under 1024px | Sidebar becomes a hamburger drawer |
| 11 | Visit `/nonsense` | Animated 404 page |

---

## 5. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Cannot reach the server" toast | Backend not running | Start it on port 8000 |
| CORS error in the console | Backend `CORS_ORIGINS` missing the frontend origin | Add `http://localhost:5173` to `backend/.env`, restart |
| Blank page, `Failed to resolve import` | Install incomplete | `rmdir /s /q node_modules` and reinstall |
| Port 5173 in use | Another Vite app | `npm run dev -- --port 5174` |
| `Cannot find package 'X'` when starting backend | `shared/` or `docs/` got moved during a manual folder reorg | Confirm `shared/` sits at the project root, sibling to `backend/`, not nested inside it |

---

## 6. What was verified before hand-off

- **80 source files** parsed by esbuild with JSX enabled — **0 syntax errors**
- **256 internal imports** resolved against the filesystem — **0 unresolved**
- **14 external packages** used — all declared in `package.json`
- File count confirmed identical (91/91) and checksum-matched between the
  generated source and the copy written into `frontend/`

---

**Previous:** [08 — Phase 2 Testing Guide](./08-phase-2-testing-guide.md)
