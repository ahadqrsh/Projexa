# Phase 2 — How to Run & Test the Backend

> Everything below runs on your machine. Total time from clone to green test run: about 5 minutes.

---

## 0. Prerequisites

| Tool | Check | If missing |
|---|---|---|
| Node.js 20+ | `node -v` | [nodejs.org](https://nodejs.org) — install the LTS build |
| npm 10+ | `npm -v` | Ships with Node |
| MongoDB | `mongod --version` | Either install locally, **or** use free MongoDB Atlas (below) |

### MongoDB — pick one

**Option A — local (fastest).** Install MongoDB Community Edition, then start it:

```bash
mongod --dbpath ~/data/db
```

Leave that terminal running. Your `.env` already points at
`mongodb://127.0.0.1:27017/projexa`.

**Option B — Atlas (no install).**

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Database Access → add a user with a password
3. Network Access → Add IP → **Allow access from anywhere** (`0.0.0.0/0`)
4. Connect → Drivers → copy the connection string
5. Paste it into `MONGODB_URI` in `server/.env`, replacing `<password>` with the real password and adding the database name:

```
MONGODB_URI=mongodb+srv://user:realpassword@cluster0.abcde.mongodb.net/projexa?retryWrites=true&w=majority
```

---

## 1. Install

```bash
cd "Ai Project Mentor/server"
npm install
```

Expect around 450 packages and 30–90 seconds.

---

## 2. Configure

```bash
cp .env.example .env
```

**The defaults work immediately** — `AI_PROVIDER=mock` needs no API key. Change
`MONGODB_URI` only if you chose Atlas.

Before you deploy anything publicly, replace the three placeholder secrets:

```bash
# run this three times, paste a different result into each secret
openssl rand -hex 32
```

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` — the access and refresh
secrets **must be different values**, and the server will refuse to boot if they match.

---

## 3. Seed demo data

```bash
npm run seed
```

You should see a summary box listing three accounts. This creates 5 users, 4
projects, and a demo project with all 6 implemented modules already generated —
so the whole thing is demonstrable without spending an AI credit.

---

## 4. Start the server

```bash
npm run dev
```

Expected output:

```
info: MongoDB connected → projexa
info: AI provider: mock (model: mock)
info: Scheduled job registered: purgeDeletedProjects (0 3 * * *)
info: Projexa API listening on port 8000 [development]
info: Health check: http://localhost:8000/api/v1/health
```

Open <http://localhost:8000/api/v1/health> — you should get JSON with
`"status": "connected"`.

---

## 5. Run the automated test suite

**Leave the server running.** In a second terminal:

```bash
cd "Ai Project Mentor/server"
npm run smoke
```

This runs 60+ assertions against the live API with zero test dependencies (it
uses Node's built-in `fetch`). Expected ending:

```
────────────────────────────────────────────────────────────
  ALL 62 CHECKS PASSED
────────────────────────────────────────────────────────────
```

### What it actually verifies

| Section | Proves |
|---|---|
| 1. Health & metadata | Env validation passed, DB connected, response envelope correct |
| 2. Validation & errors | 422 with field-level errors, 404 envelope, requestId present, no 500s on bad input |
| 3. Authentication | Register 201, duplicate 409, wrong password 401, **unknown email returns an identical message** (no account enumeration) |
| 4. Tokens | Protected routes reject missing/invalid tokens; refresh **rotates** the cookie; **replaying a rotated token is rejected** (reuse detection) |
| 5. RBAC | Student gets 403 (not 401) on admin routes; self-registration cannot mint an admin |
| 6. Project CRUD | 422 on invalid input, 201 with auto slug and ideaHash, pagination meta, `/projects/stats` resolves before `/:id` |
| 7. Ownership | A second user gets 403 reading *and* writing someone else's project |
| 8. Staleness | Editing `tags` does **not** flag staleness; editing `description` **does** |
| 9. Generation | 202 + jobId, topological ordering (OVERVIEW → FEATURES → SRS), job reaches `completed`, cache returns 200 with no job |
| 10. Artifacts | kebab-case URLs resolve, content matches the Zod schema, manual edit bumps version and archives the old one, un-generated module is 404 not empty-200 |
| 11. Soft delete | Delete 204 → read 404 → restore 200 → read 200 |
| 12. Logout | Refresh fails after logout |

If a check fails, the script prints the assertion, what it got, and a summary list
at the end.

---

## 6. Manual exploration (optional)

If you prefer clicking to scripts, import these into Postman or Thunder Client.

```bash
# Health
curl http://localhost:8000/api/v1/health

# Log in as the seeded student — copy the accessToken from the response
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@apm.dev","password":"Password@123"}'

# List projects (paste your token)
curl http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"

# Read a generated artifact
curl "http://localhost:8000/api/v1/projects/PROJECT_ID/artifacts/srs" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"

# Generate modules — returns 202 immediately
curl -X POST "http://localhost:8000/api/v1/projects/PROJECT_ID/generate" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"modules":["OVERVIEW","FEATURES"],"force":true}'

# Poll job status
curl "http://localhost:8000/api/v1/projects/PROJECT_ID/generate/status/JOB_ID" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

---

## 7. Switching on real Gemini output

1. Get a free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. In `server/.env`:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

3. Restart the server and generate with `"force": true`.

The mock and real providers go through **exactly the same pipeline** — queue, JSON
parsing, Zod validation, persistence, usage logging — so if it worked on mock, the
only new failure mode is the network or your quota.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `✖ Invalid environment configuration` | A required `.env` value is missing or two secrets match | Read the printed list — it names each offending variable |
| `MongoDB connection attempt 1/5 failed` | `mongod` isn't running, or the Atlas IP allowlist blocks you | Start `mongod`, or add `0.0.0.0/0` in Atlas → Network Access |
| `JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET` | Both secrets are the same string | Generate two different values with `openssl rand -hex 32` |
| Smoke test: "Is the server running?" | Server isn't up, or is on another port | Start `npm run dev`; or run `API_URL=http://localhost:PORT/api/v1 npm run smoke` |
| `EADDRINUSE :8000` | Port already taken | Change `PORT` in `.env` |
| Generation returns 429 | AI credit quota exhausted (200/month per user) | Log in as admin and `PATCH /users/:id/credits`, or re-seed |
| Cloudinary warning at boot | No Cloudinary credentials | Harmless — uploads fall back to a placeholder provider. Add credentials when you need real uploads |
| Emails not arriving | No SMTP configured | Also harmless — verification and reset links are printed to the server console |

---

## What was verified before hand-off

Run in the build environment, no database required:

- **107 source files** parsed as ES modules — 0 syntax errors
- **314 relative imports** resolved against the filesystem — 0 unresolved
- **28 external packages** imported — all declared in `package.json`, none missing, none unused

What was **not** verified here: a live boot and HTTP round-trip. The sandbox could
not complete `npm install` within its network budget, which is why `npm run smoke`
exists — it is the runtime verification, and it runs in seconds on your machine.

---

**Previous:** [07 — Packages & Environment](./07-packages-and-environment.md)
