# Projexa — Frontend (Phase 3)

React 18 + Vite 5 + TailwindCSS 3 + Redux Toolkit + React Router 6. Plain JavaScript, no TypeScript.

---

## Quick start

The backend must be running first (`cd backend && npm start` on port 8000).

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev            # http://localhost:5173
```

Sign in with the seeded account: `student@apm.dev` / `Password@123`.

---

## What is in this phase

| Area | Delivered |
|---|---|
| Auth | Login, Register, Forgot password, Reset password, Verify email |
| Session | Silent refresh on reload, single-flight token refresh, route guards |
| Dashboard | Stats, "continue where you left off", recent projects |
| Projects | List with search/filter/sort/pagination, 4-step creation wizard, detail, edit, duplicate, delete with restore window |
| Profile | Avatar upload/remove, editable details, skills, credit meter |
| Settings | Theme, notifications, password change, active sessions |
| Layout | Collapsible sidebar, responsive navbar, mobile drawer |
| Theming | Light + dark via CSS variables, persisted |

**Not in this phase:** AI generation. Every module card renders in a "not generated"
state — that is Phase 4.

---

## The 3D / futuristic layer

Three techniques, **zero extra dependencies**:

**1. `components/three/ParticleField.jsx`** — a real 3D point cloud on a 2D canvas.
Points live in 3D space, are rotated on the Y and X axes each frame, then projected
with a perspective divide (`screenX = x * focal / (focal + z)`). Depth drives radius,
opacity and draw order. It reads your theme's CSS variables, so it recolours when you
toggle dark mode.

**2. `components/three/TiltCard.jsx`** — mouse-tracking perspective tilt with a moving
specular highlight. Transforms are written straight to the DOM node rather than through
React state.

**3. `components/three/AuroraBackdrop.jsx`** — blueprint grid plus drifting colour blobs,
pure CSS and GPU-composited.

All of it respects `prefers-reduced-motion`.

---

## Architecture

```
src/
├── app/            store, App shell
├── routes/         router tree, path constants, three guard types
├── layouts/        Root, Auth, Dashboard (+ Sidebar, Navbar)
├── components/
│   ├── ui/         18 design-system primitives
│   ├── form/       React Hook Form wrappers
│   ├── three/      ParticleField, TiltCard, AuroraBackdrop
│   ├── motion/     PageTransition, StaggerList
│   └── feedback/   ErrorBoundary, LoadingScreen
├── features/       auth, projects, ui — each owns its slice + API + components
├── pages/          route-level composition only
├── services/       axios instance, interceptors, endpoint map
├── hooks/          useAuth, useDebounce, useMediaQuery, useDocumentTitle
└── utils/          cn, formatters, constants
```

---

## Two decisions worth knowing

**The access token is never in `localStorage`.** It lives in module scope in
`services/axiosInstance.js`. In memory it dies on reload and is recovered silently
through the httpOnly refresh cookie — that is what `bootstrapSession` does on mount,
and why `ProtectedRoute` waits for it before redirecting.

**Token refresh is single-flight.** When an access token expires, several requests
are usually in flight. A shared refresh promise (`services/interceptors.js`) stops
each of them triggering its own refresh, which would otherwise trip the backend's
rotation reuse-detection and log the user out.

---

## Environment

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=AI Project Mentor
VITE_ENABLE_3D=true
```

---

## Deploying to Vercel

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Env | `VITE_API_BASE_URL=https://your-api.onrender.com/api/v1` |

After deploying, add the Vercel URL to the backend's `CORS_ORIGINS` and `CLIENT_URL`,
then redeploy the backend.
