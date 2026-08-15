# Projexa — 07. Packages & Environment

> **Phase 1 · Document 7 of 7**
> Exact dependencies, install commands, environment variables and deployment configuration.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20.x LTS | `node -v` |
| npm | 10.x | `npm -v` |
| Git | 2.4x | `git --version` |
| MongoDB | 7.x local, or Atlas | `mongod --version` |

Accounts required: **MongoDB Atlas**, **Cloudinary**, **Google AI Studio** (Gemini API key), **GitHub**, **Vercel**, **Render**. All have free tiers sufficient for this project.

---

## 2. Backend Dependencies

### 2.1 Production

```bash
cd backend

npm install express@^4.19.2 mongoose@^8.5.1 dotenv@^16.4.5 cors@^2.8.5 \
  helmet@^7.1.0 compression@^1.7.4 cookie-parser@^1.4.6 morgan@^1.10.0 \
  winston@^3.14.2 express-rate-limit@^7.4.0 express-mongo-sanitize@^2.2.0 \
  hpp@^0.2.3 express-validator@^7.1.0 jsonwebtoken@^9.0.2 bcryptjs@^2.4.3 \
  multer@^1.4.5-lts.1 cloudinary@^2.4.0 @google/generative-ai@^0.21.0 \
  openai@^4.56.0 zod@^3.23.8 p-queue@^8.0.1 nanoid@^5.0.7 slugify@^1.6.6 \
  nodemailer@^6.9.14 node-cron@^3.0.3 uuid@^10.0.0 dayjs@^1.11.13 \
  docx@^8.5.0 puppeteer-core@^23.1.0 @sparticuz/chromium@^127.0.0 \
  @mermaid-js/mermaid-cli@^11.0.0
```

| Package | Role |
|---|---|
| `express` | HTTP framework |
| `mongoose` | ODM, schemas, indexes |
| `dotenv` | Load `.env` |
| `cors` | Whitelisted origins, `credentials: true` for the refresh cookie |
| `helmet` | Security headers (CSP, HSTS, noSniff) |
| `compression` | gzip — artifact JSON payloads compress 6–8× |
| `cookie-parser` | Reads the httpOnly refresh cookie |
| `morgan` | HTTP access logs, piped into Winston |
| `winston` | Structured application logging |
| `express-rate-limit` | The five named limiters from Doc 04 §1.5 |
| `express-mongo-sanitize` | Strips `$` / `.` from input — prevents NoSQL operator injection |
| `hpp` | HTTP parameter pollution guard |
| `express-validator` | Boundary validation |
| `jsonwebtoken` | Access + refresh tokens |
| `bcryptjs` | Password hashing (pure JS — no native build on Render) |
| `multer` | Multipart parsing, `memoryStorage` |
| `cloudinary` | Asset upload/destroy |
| `@google/generative-ai` | Gemini SDK |
| `openai` | Fallback provider |
| `zod` | Env validation + AI output-shape validation |
| `p-queue` | Concurrency-limited generation queue |
| `nanoid` | Slug suffixes, job IDs |
| `slugify` | URL-safe project slugs |
| `nodemailer` | Verification & reset emails |
| `node-cron` | Purge and reconciliation jobs |
| `uuid` | Per-request trace IDs |
| `dayjs` | Date maths for sprint scheduling |
| `docx` | DOCX report export |
| `puppeteer-core` + `@sparticuz/chromium` | HTML→PDF inside Render's memory limits |
| `@mermaid-js/mermaid-cli` | Server-side diagram rendering for exports |

**Why `puppeteer-core` + `@sparticuz/chromium` rather than full `puppeteer`.** Full Puppeteer downloads a ~170 MB Chromium at install time, which blows past Render's free-tier build limits. `@sparticuz/chromium` ships a compressed, serverless-optimised binary that fits.

### 2.2 Development

```bash
npm install -D nodemon@^3.1.4 jest@^29.7.0 supertest@^7.0.0 \
  mongodb-memory-server@^10.0.0 cross-env@^7.0.3 eslint@^8.57.0 \
  eslint-config-airbnb-base@^15.0.0 eslint-plugin-import@^2.29.1 \
  prettier@^3.3.3 eslint-config-prettier@^9.1.0 husky@^9.1.4 \
  lint-staged@^15.2.9 @faker-js/faker@^8.4.1
```

### 2.3 `backend/package.json` scripts

```json
{
  "name": "projexa-backend",
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "lint": "eslint src --ext .js",
    "lint:fix": "eslint src --ext .js --fix",
    "format": "prettier --write \"src/**/*.js\"",
    "test": "cross-env NODE_ENV=test jest --runInBand",
    "test:watch": "cross-env NODE_ENV=test jest --watch --runInBand",
    "test:coverage": "cross-env NODE_ENV=test jest --coverage --runInBand",
    "seed": "node src/seeds/index.js",
    "seed:destroy": "node src/seeds/index.js --destroy",
    "prepare": "cd .. && husky install"
  }
}
```

`"type": "module"` — the whole backend uses ESM `import`/`export`, matching the frontend. Mixing CommonJS and ESM across a monorepo is a recurring source of confusing build errors.

---

## 3. Frontend Dependencies

### 3.1 Scaffold & Production

```bash
npm create vite@latest frontend -- --template react
cd frontend

npm install react-router-dom@^6.26.1 @reduxjs/toolkit@^2.2.7 react-redux@^9.1.2 \
  axios@^1.7.5 react-hook-form@^7.52.2 @hookform/resolvers@^3.9.0 zod@^3.23.8 \
  framer-motion@^11.3.30 react-hot-toast@^2.4.1 lucide-react@^0.436.0 \
  recharts@^2.12.7 mermaid@^11.0.2 react-markdown@^9.0.1 remark-gfm@^4.0.0 \
  react-syntax-highlighter@^15.5.0 @dnd-kit/core@^6.1.0 @dnd-kit/sortable@^8.0.0 \
  clsx@^2.1.1 tailwind-merge@^2.5.2 dayjs@^1.11.13 \
  @fontsource-variable/inter@^5.0.20 @fontsource/jetbrains-mono@^5.0.21
```

| Package | Role |
|---|---|
| `react-router-dom` | Nested layouts + data routers |
| `@reduxjs/toolkit` + `react-redux` | Global state, thunks, Immer |
| `axios` | HTTP client + refresh interceptor |
| `react-hook-form` + `@hookform/resolvers` + `zod` | Forms validated by the schema shared with the backend |
| `framer-motion` | All motion from Doc 06 §8 |
| `react-hot-toast` | Notifications |
| `lucide-react` | Icon set — tree-shakeable, consistent 24px grid |
| `recharts` | Admin analytics |
| `mermaid` | Client-side ERD/UML rendering |
| `react-markdown` + `remark-gfm` | Renders `DOCUMENTATION` and `GITHUB_GUIDE` markdown |
| `react-syntax-highlighter` | `CodeBlock` |
| `@dnd-kit/*` | Kanban drag-and-drop — accessible, keyboard-operable, unlike most alternatives |
| `clsx` + `tailwind-merge` | The `cn()` helper; `tailwind-merge` resolves conflicting utility classes so caller `className` overrides actually win |
| `dayjs` | Date formatting |
| `@fontsource*` | Self-hosted fonts |

### 3.2 Development

```bash
npm install -D tailwindcss@^3.4.10 postcss@^8.4.41 autoprefixer@^10.4.20 \
  @tailwindcss/typography@^0.5.15 @tailwindcss/forms@^0.5.7 \
  vitest@^2.0.5 @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.5.0 \
  @testing-library/user-event@^14.5.2 jsdom@^25.0.0 \
  eslint@^8.57.0 eslint-plugin-react@^7.35.0 eslint-plugin-react-hooks@^4.6.2 \
  eslint-plugin-jsx-a11y@^6.9.0 prettier@^3.3.3 \
  prettier-plugin-tailwindcss@^0.6.6 vite-plugin-svgr@^4.2.0

npx tailwindcss init -p
```

`@tailwindcss/typography` supplies the `prose` classes for markdown artifacts; `eslint-plugin-jsx-a11y` enforces the accessibility baseline from Doc 05 §8 at lint time rather than at review time.

### 3.3 `frontend/package.json` scripts

```json
{
  "name": "projexa-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .js,.jsx",
    "lint:fix": "eslint src --ext .js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,css}\"",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 4. Environment Variables — Backend

`server/.env.example` (commit this; never commit `.env`)

```bash
# ─── Core ──────────────────────────────────────────────────────────────
NODE_ENV=development                  # development | test | production
PORT=8000
API_VERSION=v1
APP_NAME="Projexa"

# ─── URLs ──────────────────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173      # used in emails + CORS
SERVER_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173,http://localhost:4173   # comma-separated

# ─── Database ──────────────────────────────────────────────────────────
MONGODB_URI=mongodb://127.0.0.1:27017/projexa
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/projexa-test
# Atlas: mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/projexa?retryWrites=true&w=majority

# ─── JWT ───────────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=<64-char random hex>        # openssl rand -hex 32
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<different 64-char hex>    # MUST differ from access
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=<64-char random hex>

# ─── Password & Tokens ─────────────────────────────────────────────────
BCRYPT_SALT_ROUNDS=12
EMAIL_VERIFICATION_EXPIRES_HOURS=24
PASSWORD_RESET_EXPIRES_MINUTES=30

# ─── AI Provider ───────────────────────────────────────────────────────
AI_PROVIDER=gemini                    # gemini | openai
GEMINI_API_KEY=<key from aistudio.google.com>
GEMINI_MODEL=gemini-3.6-flash
GEMINI_MODEL_FALLBACK=gemini-3.5-flash-lite
OPENAI_API_KEY=<optional fallback>
OPENAI_MODEL=gpt-4o-mini
AI_MAX_OUTPUT_TOKENS=8192
AI_TEMPERATURE=0.7
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
AI_QUEUE_CONCURRENCY=3

# ─── Quotas ────────────────────────────────────────────────────────────
DEFAULT_AI_CREDITS=200
CREDIT_RESET_DAYS=30

# ─── Cloudinary ────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
CLOUDINARY_FOLDER=projexa

# ─── Uploads ───────────────────────────────────────────────────────────
MAX_AVATAR_SIZE_MB=2
MAX_COVER_SIZE_MB=3
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# ─── Email ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<address>
SMTP_PASSWORD=<app password, NOT your account password>
EMAIL_FROM_NAME="Projexa"
EMAIL_FROM_ADDRESS=noreply@projexa.com

# ─── Rate Limiting ─────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=300
AUTH_RATE_LIMIT_MAX=10
GENERATION_RATE_LIMIT_MAX=10
EXPORT_RATE_LIMIT_MAX=15

# ─── Logging ───────────────────────────────────────────────────────────
LOG_LEVEL=debug                       # error | warn | info | http | debug
LOG_TO_FILE=false

# ─── Jobs ──────────────────────────────────────────────────────────────
ENABLE_CRON=true
PURGE_DELETED_AFTER_DAYS=30
STUCK_JOB_TIMEOUT_MINUTES=5
REPORT_TTL_DAYS=30
```

**Every one of these is validated at boot** by `config/env.js` using a Zod schema — required strings, coerced numbers, enum-constrained values, minimum secret lengths. If `JWT_ACCESS_SECRET` is missing, the process prints a readable list of problems and exits with code 1. It does **not** start and then fail on the first login three hours later, which is the failure mode that costs an evening of debugging.

**`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be different values.** If they are the same, an access token is a structurally valid refresh token — a stolen 15-minute token silently becomes a 7-day one.

---

## 5. Environment Variables — Frontend

`client/.env.example`

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME="Projexa"
VITE_APP_VERSION=1.0.0
VITE_ENABLE_SSE=true                  # false → fall back to polling
VITE_GENERATION_POLL_INTERVAL_MS=2000
VITE_NOTIFICATION_POLL_INTERVAL_MS=60000
VITE_MAX_UPLOAD_MB=3
VITE_ENABLE_ANALYTICS=false
```

**Vite inlines `VITE_`-prefixed variables into the bundle at build time — they are public.** No secret ever goes in a frontend `.env`. Cloudinary and Gemini credentials live only on the server; the client never talks to either directly.

---

## 6. Configuration Files

### 6.1 `client/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true, secure: false },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'chart-vendor': ['recharts'],
          'mermaid-vendor': ['mermaid'],
        },
      },
    },
  },
});
```

The `@` alias removes `../../../` import chains. `manualChunks` matters here: `mermaid` alone is ~600 KB, and splitting it means the landing page doesn't download a diagram renderer nobody on that page will use.

### 6.2 `client/tailwind.config.js` (structure)

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // every token from Doc 06 §2.1, wired to CSS variables:
        primary: { 50: 'rgb(var(--primary-50) / <alpha-value>)', /* … */ },
        // …
      },
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '20px' },
      boxShadow: { glow: '0 0 24px -4px rgb(99 102 241 / 0.45)' },
      keyframes: { shimmer: { /* … */ }, pulseSoft: { /* … */ } },
      animation: { shimmer: 'shimmer 1.5s infinite', pulseSoft: 'pulseSoft 2s infinite' },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
```

Colours reference CSS variables with `<alpha-value>` support, so `bg-primary-600/20` works and dark mode is one class on `<html>` rather than a duplicated palette.

### 6.3 `client/vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

The rewrite is required: without it, refreshing on `/projects/abc` returns a Vercel 404 because no such file exists — the classic SPA deployment bug.

### 6.4 `.gitignore` (root)

```gitignore
node_modules/
.env
.env.local
.env.*.local
!.env.example
dist/
build/
coverage/
logs/
*.log
npm-debug.log*
.DS_Store
Thumbs.db
.vscode/*
!.vscode/extensions.json
.idea/
.vercel/
*.pem
tmp/
uploads/
```

---

## 7. Deployment

### 7.1 Render (backend)

| Setting | Value |
|---|---|
| Environment | Node |
| Root Directory | *(leave blank — repository root)* |
| Build Command | `npm ci --prefix backend` |
| Start Command | `node backend/src/server.js` |
| Node Version | 20 (via `.nvmrc` or `NODE_VERSION`) |
| Health Check Path | `/api/v1/health` |
| Auto-Deploy | On push to `main` |

**Root Directory is deliberately the repo root, not `backend/`.** `shared/` sits
above `backend/` and the backend imports it via relative paths (e.g.
`../../../shared/constants/domains.js`). Scoping Root Directory to `backend/`
would exclude `shared/` from what the service can see at runtime.

Add every backend variable from §4 to Render's Environment tab, with production values:

```
NODE_ENV=production
CLIENT_URL=https://projexa.vercel.app
CORS_ORIGINS=https://projexa.vercel.app
MONGODB_URI=<Atlas production SRV>
LOG_LEVEL=info
```

MongoDB Atlas → Network Access must allow Render's egress. Atlas free tier does not offer static outbound IPs from Render, so `0.0.0.0/0` plus a strong database user password is the practical configuration; note this explicitly in your report as a known limitation with the mitigation (scoped DB user, rotated credentials, no admin role).

### 7.2 Vercel (frontend)

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |

Environment variable: `VITE_API_BASE_URL=https://<render-service>.onrender.com/api/v1`

### 7.3 Deployment Order

1. Provision the Atlas cluster, create a scoped DB user, whitelist access.
2. Create the Cloudinary account, note the three credentials.
3. Get the Gemini API key from Google AI Studio.
4. Deploy the backend to Render with all env vars; confirm `/api/v1/health` returns `200`.
5. Deploy the frontend to Vercel with `VITE_API_BASE_URL` pointing at Render.
6. Add the Vercel URL to Render's `CORS_ORIGINS` and `CLIENT_URL`, then redeploy the backend.
7. Register a real account end-to-end and generate one module to verify the full path.

Step 6 is the one people forget: CORS is configured on the server, but the server is deployed before the client URL exists. The backend must be redeployed once the Vercel domain is known.

### 7.4 `.github/workflows/ci.yml` (scope)

Runs on every PR: install both workspaces with `npm ci`, lint both, run backend Jest against `mongodb-memory-server`, run frontend Vitest, and build the client to catch type/import errors before they reach Vercel.

---

## 8. Local Setup — First Run

```bash
git clone https://github.com/<you>/projexa.git
cd projexa

# Backend
cd backend
npm install
cp .env.example .env          # then fill in real values
npm run seed                  # demo users + a fully generated demo project
npm run dev                   # → http://localhost:8000

# Frontend (new terminal)
cd ../client
npm install
cp .env.example .env.local
npm run dev                   # → http://localhost:5173
```

Seeded logins: `admin@apm.dev` / `mentor@apm.dev` / `student@apm.dev`, all with password `Password@123`. The seeded demo project ships with all 17 artifacts and 4 diagrams already generated, so the entire UI is demonstrable without spending an AI credit.

---

## 9. Git Workflow

| Branch | Purpose |
|---|---|
| `main` | Production — protected, PR-only |
| `develop` | Integration |
| `feat/*` · `fix/*` · `refactor/*` · `docs/*` · `chore/*` | Working branches |

Commits follow Conventional Commits (`feat(generation): add ERD generator`), enforced by a Husky `commit-msg` hook. `lint-staged` runs ESLint and Prettier on staged files at pre-commit, so unformatted code cannot enter history.

---

## 10. Phase Roadmap

| Phase | Deliverable |
|---|---|
| **1** | ✅ Foundation — architecture, schema, API contract, folder structure, flows, dashboards, environment *(this document set)* |
| **2** | Backend core — scaffold, config, env validation, DB connection, models, base repository, `ApiError`/`ApiResponse`/`asyncHandler`, error middleware, logger, health route, seeds |
| **3** | Authentication — register, login, refresh rotation, email verification, password reset, RBAC, sessions, user & profile CRUD, Cloudinary avatars |
| **4** | Frontend foundation — Vite + Tailwind + tokens, Redux store, Axios interceptors, routing + guards, layouts, Tier 1–3 component library, auth pages |
| **5** | Projects module — Idea Wizard, project CRUD, dashboard, project grid, filters, bookmarks, settings, cover upload |
| **6** | AI engine — provider abstraction, `BaseGenerator`, registry, queue, prompts, context chaining, generation endpoints, SSE, credits, all 17 generators |
| **7** | Artifact UI — `ArtifactPanel`, 15 renderers, versioning, manual edit, stale handling, regeneration |
| **8** | Diagrams — ERD + 4 UML generators, Mermaid rendering, source editing, PNG/SVG export |
| **9** | Sprints & tasks — planner materialisation, timeline, Kanban with drag-and-drop, progress roll-up |
| **10** | Reports — section builder, PDF + DOCX exporters, cover page, Cloudinary delivery, history |
| **11** | Collaboration — mentor invites, review dashboard, comments, notifications |
| **12** | Admin & analytics — stats, user management, AI usage & cost dashboards, logs |
| **13** | Hardening — tests, accessibility audit, performance, security review, error states |
| **14** | Deployment & documentation — Render, Vercel, CI, README, and the project report itself |

---

**Previous:** [06 — Dashboard & Design System](./06-dashboard-and-design-system.md) · **Back to:** [00 — Index](./00-README.md)
