# Projexa — Backend (Phase 2)

Express + MongoDB + Gemini REST API. Node 20+.

---

## Quick start

```bash
cd backend
npm install
cp .env.example .env        # already runnable as-is with AI_PROVIDER=mock
npm run seed                # demo users + a fully generated demo project
npm run dev                 # http://localhost:8000
```

Then, in a second terminal:

```bash
npm run smoke               # 60+ end-to-end assertions against the running server
```

Seeded logins (all password `Password@123`):

| Role | Email |
|---|---|
| Admin | `admin@apm.dev` |
| Mentor | `mentor@apm.dev` |
| Student | `student@apm.dev` |

**You need a MongoDB.** Either run `mongod` locally, or paste a free MongoDB Atlas
connection string into `MONGODB_URI` in `.env`.

**You do not need a Gemini key to start.** `.env.example` ships with
`AI_PROVIDER=mock`, which returns deterministic fixtures through the exact same
pipeline — queue, JSON parsing, Zod validation, persistence, usage logging. Set
`AI_PROVIDER=gemini` and `GEMINI_API_KEY=...` when you want real output.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start with nodemon |
| `npm start` | Start for production |
| `npm run seed` | Populate demo data |
| `npm run seed:destroy` | Wipe all collections |
| `npm run smoke` | End-to-end API test (zero dependencies, uses native fetch) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |

---

## Architecture

```
Route → Middleware → Controller → Service → Repository → Model → MongoDB
                                     ↓
                          Generation Engine → AI Provider
```

**Imports may only point rightward.** A service never touches `req`/`res`; a
repository never imports a service; a controller never calls a model. That single
rule is what makes the services unit-testable without a server and the
repositories testable without HTTP.

| Layer | Owns | Never does |
|---|---|---|
| Route | URL → middleware chain → controller | Logic, `try/catch`, DB access |
| Middleware | Auth, RBAC, validation, uploads, rate limits, quotas | Business rules |
| Controller | Read request, call ONE service, shape the response | DB queries, branching rules, `try/catch` |
| Service | All business logic, orchestration, ownership rules | Anything HTTP-aware |
| Repository | Mongoose queries, pagination, projections | Business decisions |
| Model | Schema, indexes, hooks, document methods | Cross-collection orchestration |

### Where the SOLID principles actually live

| Principle | File |
|---|---|
| **S** | `artifact.controller.js` (HTTP only) / `artifact.service.js` (rules only) / `artifact.repository.js` (queries only) |
| **O** | `services/ai/GeneratorRegistry.js` — a new module is one file plus one line; the engine, queue, controllers and routes are untouched |
| **L** | `GeminiProvider` / `OpenAIProvider` / `MockProvider` all satisfy `AIProvider`; swapping is one env var |
| **I** | Per-aggregate repositories rather than one god `dbService` |
| **D** | `BaseGenerator` depends on the `AIProvider` abstraction, never on `@google/generative-ai` |

Also in use: Template Method (`BaseGenerator.run()`), Factory (`providerFactory`,
`storageFactory`), Repository, Adapter (`CloudinaryProvider`), Facade
(`project.service.js`), Chain of Responsibility (Express middleware).

---

## The generation pipeline

```
POST /projects/:id/generate  →  202 { jobId }        (returns immediately)
      ↓
GenerationService     quota check → cache check → topological sort → enqueue
      ↓
GenerationQueue       p-queue, concurrency 3, sequential within a job
      ↓
GeneratorRegistry     artifactType → generator instance
      ↓
BaseGenerator.run()   context → prompt → provider → parse → Zod → persist → log
      ↓
GET .../status/:jobId    or    GET .../status/:jobId/stream   (SSE)
```

Three decisions worth knowing:

1. **Asynchronous.** A full run exceeds Render's 100-second request timeout, so
   generation is a `202` plus a background job. The user can navigate away.
2. **Per-module state machines.** One module failing marks only itself `failed`.
   `partial` is a first-class outcome — 15 successes are never thrown away
   because the 16th failed.
3. **Context chaining.** `API_DESIGN` receives the completed `DATABASE_DESIGN`
   in its prompt, so the endpoints match the collections. Declared via each
   generator's `dependsOn` and topologically sorted by `sortByDependencies()`.

### Adding a module (Phase 6)

1. Add the enum to `shared/constants/artifactTypes.js`
2. Add `services/ai/prompts/modules/<name>.prompt.js` (exports `version`, `outputSchema`, `buildPrompt`)
3. Add `services/ai/generators/<Name>Generator.js` (about 10 lines)
4. Add one line to `GeneratorRegistry.js`

Nothing else changes. There is no `switch` on artifact type anywhere in the codebase.

---

## Security posture

| Control | Implementation |
|---|---|
| Password storage | bcrypt cost 12, hashed in a `pre('save')` hook so it cannot be bypassed |
| Access token | JWT, 15 min, `Authorization: Bearer` |
| Refresh token | JWT, 7 days, httpOnly + secure + sameSite cookie, **rotated on every use** |
| Reuse detection | Replaying a rotated token revokes the entire token family |
| Token/secret separation | Access and refresh use different secrets; `env.js` refuses to boot if they match |
| Password change | Invalidates every JWT issued earlier via `passwordChangedAt` |
| Account enumeration | Login and forgot-password return identical responses for unknown accounts |
| One-time tokens | Only SHA-256 hashes stored; raw token exists only in the email |
| NoSQL injection | `express-mongo-sanitize` strips `$` and `.` before any route sees the body |
| Role escalation | Self-registration cannot mint an admin; update whitelists block `role` injection via profile edits |
| Headers / HPP | helmet, hpp, explicit CORS whitelist with credentials |
| Rate limiting | Five named limiters keyed by user id (not IP — a campus shares one NAT address) |
| Quotas | AI credits enforced separately from rate limits, with a rolling reset |

---

## Environment

Every variable is validated by Zod at boot in `config/env.js`. A missing or
contradictory value prints a readable list and exits code 1 — the process does not
start and then fail on the first request three hours later.

Cross-field rules enforced:

- `JWT_ACCESS_SECRET` must differ from `JWT_REFRESH_SECRET`
- `GEMINI_API_KEY` required when `AI_PROVIDER=gemini`
- `AI_PROVIDER=mock` is refused in production
- `CORS_ORIGINS` must be set in production

---

## Known limitations (carried into later phases)

- **In-process queue.** A restart loses in-flight generations. Mitigated by
  `reconcileStuckArtifacts.job.js`, which runs at boot and every 10 minutes to
  flip abandoned rows to `failed`. Swap `GenerationQueue.js` for BullMQ + Redis
  to remove this entirely — nothing else changes.
- **6 of 16 modules implemented.** `OVERVIEW`, `FEATURES`, `TECH_STACK`, `SRS`,
  `DATABASE_DESIGN`, `API_DESIGN`. The remaining ten are Phase 6 and are one file
  each.
- **Sprints, tasks, diagrams, reports, comments and notifications** have models
  and (where relevant) repositories, but no routes yet — Phases 8 to 11.
- **No unit test suite yet.** `npm run smoke` covers the API end to end; Jest
  unit tests land in Phase 13.

---

## Deployment note

`shared/` sits at the repository root and is imported by both apps, so on Render
set **Root Directory** to the repository root (not `server`):

Build Command:  npm ci --prefix backend
Start Command:  node backend/src/server.js
- Health Check Path: `/api/v1/health`
