# Projexa — 04. API Specification

> **Phase 1 · Document 4 of 7**
> Base URL: `https://<render-host>/api/v1` · Local: `http://localhost:8000/api/v1`
> 104 endpoints across 12 resources. This is the contract; Phase 3 implements it verbatim.

---

## 1. Conventions

### 1.1 Response Envelope

Every response — success or failure — uses one shape. The client's Axios interceptor unwraps it once, so no component ever handles two formats.

**Success**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Projects fetched successfully",
  "data": { },
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 47,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

`meta` is present only on list endpoints. Produced by `utils/ApiResponse.js`.

**Error**

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ],
  "requestId": "6f1b2c9e-8a4d-4f3a-9c21-0b7e5d3a1f88",
  "stack": "…included only when NODE_ENV=development"
}
```

Produced by `utils/ApiError.js` + `middlewares/error.middleware.js`.

### 1.2 Status Codes

| Code | Used for |
|---|---|
| `200 OK` | Successful GET / PATCH / DELETE |
| `201 Created` | Resource created — response includes the new resource |
| `202 Accepted` | Async work queued (generation, report export) — response includes `jobId` |
| `204 No Content` | Logout, some deletes |
| `400 Bad Request` | Malformed request, business-rule violation |
| `401 Unauthorized` | Missing / invalid / expired access token |
| `403 Forbidden` | Authenticated but not permitted (wrong role, not the owner) |
| `404 Not Found` | Resource does not exist or is soft-deleted |
| `409 Conflict` | Duplicate email, duplicate slug, artifact already generating |
| `413 Payload Too Large` | Upload exceeds the size limit |
| `415 Unsupported Media Type` | Bad file mime type |
| `422 Unprocessable Entity` | Validation failed — always accompanied by `errors[]` |
| `429 Too Many Requests` | Rate limit or AI credit quota exhausted |
| `500 Internal Server Error` | Unexpected — logged with `requestId`, message genericised |
| `503 Service Unavailable` | Database or AI provider unreachable |

**401 vs 403 is not interchangeable.** 401 means "we don't know who you are — refresh or log in", and it is what triggers the Axios refresh interceptor. 403 means "we know exactly who you are and the answer is no", and must **not** trigger a refresh attempt. Confusing them causes infinite refresh loops.

### 1.3 Common Query Parameters (list endpoints)

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int | 1 | |
| `limit` | int | 12 | Max 100 |
| `sort` | string | `-createdAt` | `-` prefix = descending |
| `search` | string | — | Text index |
| `fields` | string | — | Comma-separated projection |

### 1.4 Authentication

| Token | Transport | TTL |
|---|---|---|
| Access | `Authorization: Bearer <jwt>` | 15 minutes |
| Refresh | `refreshToken` httpOnly cookie | 7 days, rotated on every use |

**Auth column legend:** `—` public · `✓` any authenticated user · `Owner` project owner or listed mentor · `Mentor` role `mentor`/`admin` · `Admin` role `admin`

### 1.5 Rate Limits

| Limiter | Window | Max | Applies to |
|---|---|---|---|
| `authLimiter` | 15 min | 10 / IP | `/auth/login`, `/auth/register`, `/auth/forgot-password` |
| `apiLimiter` | 15 min | 300 / user | Everything authenticated |
| `generationLimiter` | 1 hour | 10 / user | `POST …/generate` |
| `exportLimiter` | 1 hour | 15 / user | `POST …/reports` |
| `uploadLimiter` | 1 hour | 30 / user | Any multipart route |

Every rate-limited response includes `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` and `Retry-After`.

---

## 2. Authentication — `/auth`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | — | Create account, send verification email → `201` |
| POST | `/auth/login` | — | Returns access token in body, refresh token in cookie → `200` |
| POST | `/auth/logout` | ✓ | Revokes the current refresh token, clears the cookie → `204` |
| POST | `/auth/logout-all` | ✓ | Revokes every refresh token for the user → `204` |
| POST | `/auth/refresh-token` | cookie | Rotates the refresh token, issues a new access token → `200` |
| POST | `/auth/verify-email/:token` | — | Marks the email verified → `200` |
| POST | `/auth/resend-verification` | ✓ | Re-sends the verification email → `200` |
| POST | `/auth/forgot-password` | — | Emails a reset link. **Always `200`**, even for unknown emails | 
| POST | `/auth/reset-password/:token` | — | Sets a new password, revokes all sessions → `200` |
| GET | `/auth/sessions` | ✓ | Lists active refresh tokens (device, IP, last used) → `200` |
| DELETE | `/auth/sessions/:id` | ✓ | Revokes one session → `204` |

**`POST /auth/register`**

```jsonc
// Request
{ "name": "Ahad Qureshi", "email": "ahad@example.com", "password": "Str0ng#Pass", "role": "student" }

// 201
{
  "success": true, "statusCode": 201, "message": "Account created. Check your email to verify.",
  "data": {
    "user": { "_id": "…", "name": "Ahad Qureshi", "email": "ahad@example.com",
              "role": "student", "isEmailVerified": false,
              "aiCredits": { "used": 0, "limit": 200 } },
    "accessToken": "eyJhbGciOi…"
  }
}
// Set-Cookie: refreshToken=…; HttpOnly; Secure; SameSite=None; Max-Age=604800
```

**Why `/auth/forgot-password` always returns 200.** Returning 404 for an unknown email turns the endpoint into a free account-enumeration oracle. Identical response, identical timing, regardless of whether the account exists.

---

## 3. Users — `/users`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/users/me` | ✓ | Current profile + credit balance |
| PATCH | `/users/me` | ✓ | Update profile fields |
| PATCH | `/users/me/password` | ✓ | Change password (requires current password) |
| PATCH | `/users/me/avatar` | ✓ | `multipart/form-data`, field `avatar`, ≤ 2 MB, jpg/png/webp |
| DELETE | `/users/me/avatar` | ✓ | Remove avatar, destroy the Cloudinary asset |
| PATCH | `/users/me/preferences` | ✓ | Theme, email notification toggles |
| DELETE | `/users/me` | ✓ | Delete account (requires password confirmation) |
| GET | `/users/:id/public` | — | Public profile for the Explore page |
| GET | `/users` | Admin | Paginated, filter by `role`, `isActive` |
| GET | `/users/:id` | Admin | Full record |
| PATCH | `/users/:id/role` | Admin | Promote / demote |
| PATCH | `/users/:id/status` | Admin | Activate / deactivate |
| PATCH | `/users/:id/credits` | Admin | Adjust the AI quota |

---

## 4. Projects — `/projects`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/projects` | ✓ | Create from the Idea Wizard → `201` |
| GET | `/projects` | ✓ | Own projects; filters `status`, `domain`, `difficulty`, `search`, `sort` |
| GET | `/projects/public` | — | Explore feed (`visibility: public`) |
| GET | `/projects/bookmarks` | ✓ | Bookmarked projects |
| GET | `/projects/stats` | ✓ | Dashboard counters (total, by status, completion, credits) |
| GET | `/projects/:id` | Owner | Full project + artifact status summary |
| GET | `/projects/slug/:slug` | — / Owner | Public or unlisted access by slug |
| PATCH | `/projects/:id` | Owner | Update idea → **marks artifacts `isStale`** |
| DELETE | `/projects/:id` | Owner | Soft delete → `204` |
| POST | `/projects/:id/restore` | Owner | Undo soft delete (within 30 days) |
| PATCH | `/projects/:id/cover` | Owner | `multipart`, field `coverImage`, ≤ 3 MB |
| PATCH | `/projects/:id/visibility` | Owner | `private` \| `unlisted` \| `public` |
| PATCH | `/projects/:id/status` | Owner | Lifecycle transition |
| POST | `/projects/:id/duplicate` | Owner | Clone the idea (artifacts **not** copied) → `201` |
| POST | `/projects/:id/bookmark` | ✓ | Toggle bookmark |
| POST | `/projects/:id/mentors` | Owner | Invite a mentor by email |
| DELETE | `/projects/:id/mentors/:userId` | Owner | Remove a mentor |
| GET | `/projects/assigned` | Mentor | Projects where the caller is a mentor |

**`POST /projects`**

```jsonc
// Request
{
  "title": "AI-Powered Hospital Management System",
  "description": "A MERN platform where patients book appointments, doctors manage prescriptions and medical history, and admins view analytics. AI suggests appointment slots and flags high-risk patients.",
  "domain": "healthcare",
  "difficulty": "advanced",
  "teamSize": 3,
  "preferredTech": ["React", "Node.js", "MongoDB", "Express"],
  "deadline": "2026-12-15T00:00:00.000Z",
  "aiIntegrationRequired": true,
  "projectType": "web",
  "tags": ["mern", "healthcare", "ai"]
}

// 201
{
  "success": true, "statusCode": 201, "message": "Project created successfully",
  "data": {
    "_id": "66f1a…", "slug": "ai-powered-hospital-management-system-k3n9",
    "status": "draft", "visibility": "private",
    "generatedModules": [], "completionPercentage": 0,
    "createdAt": "2026-08-06T…"
  }
}
```

**`PATCH /projects/:id`** returns an extra flag so the UI can immediately show the regenerate banner:

```jsonc
{ "success": true, "statusCode": 200, "message": "Project updated. 8 artifacts are now out of date.",
  "data": { "project": { }, "staleArtifactCount": 8, "ideaChanged": true } }
```

---

## 5. Generation — `/projects/:projectId/generate`

The engine described in Doc 01 §5. All routes carry `generationLimiter` + `quota.middleware`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/projects/:projectId/generate` | Owner | Queue one or more modules → `202` |
| POST | `/projects/:projectId/generate/all` | Owner | Queue every module in dependency order → `202` |
| POST | `/projects/:projectId/generate/:type/retry` | Owner | Retry a single failed module → `202` |
| GET | `/projects/:projectId/generations/:jobId` | Owner | Poll job progress → `200` |
| GET | `/projects/:projectId/generations/:jobId/stream` | Owner | Server-Sent Events progress stream |
| DELETE | `/projects/:projectId/generations/:jobId` | Owner | Cancel queued (not in-flight) modules → `200` |
| GET | `/projects/:projectId/generations` | Owner | Job history |

**`POST /projects/:projectId/generate`**

```jsonc
// Request
{ "modules": ["SRS", "DATABASE_DESIGN", "API_DESIGN"], "force": false }
// force: true bypasses the ideaHash cache and regenerates even if unchanged

// 202
{
  "success": true, "statusCode": 202, "message": "Generation started for 3 modules",
  "data": {
    "jobId": "gen_7f3c1a9e",
    "modules": [
      { "type": "SRS",             "status": "queued",    "position": 1 },
      { "type": "DATABASE_DESIGN", "status": "queued",    "position": 2, "dependsOn": ["SRS"] },
      { "type": "API_DESIGN",      "status": "queued",    "position": 3, "dependsOn": ["DATABASE_DESIGN"] }
    ],
    "estimatedSeconds": 42,
    "creditsReserved": 3,
    "creditsRemaining": 187
  }
}
```

**`GET /projects/:projectId/generations/:jobId`**

```jsonc
{
  "success": true, "statusCode": 200, "message": "Job status fetched",
  "data": {
    "jobId": "gen_7f3c1a9e",
    "overallStatus": "running",       // queued | running | completed | partial | failed | cancelled
    "progress": 67,
    "startedAt": "2026-08-06T10:31:02.000Z",
    "modules": [
      { "type": "SRS",             "status": "completed",  "durationMs": 8421, "version": 2 },
      { "type": "DATABASE_DESIGN", "status": "completed",  "durationMs": 11304, "version": 1 },
      { "type": "API_DESIGN",      "status": "generating", "startedAt": "2026-08-06T10:31:22.000Z" }
    ]
  }
}
```

**`overallStatus: "partial"` is a first-class outcome, not an error.** If 15 of 17 modules succeed, the user has a usable project and two retry buttons. Treating any failure as a total failure would throw away 15 successful API calls and the credits spent on them.

**SSE stream format** (`…/stream`) — the client prefers this and falls back to polling if the connection drops:

```
event: progress
data: {"type":"SRS","status":"completed","progress":33}

event: progress
data: {"type":"DATABASE_DESIGN","status":"generating","progress":33}

event: done
data: {"overallStatus":"completed","progress":100}
```

**Error — quota exhausted (`429`)**

```jsonc
{ "success": false, "statusCode": 429,
  "message": "AI credit limit reached. Your quota resets on 1 September 2026.",
  "errors": [{ "field": "aiCredits", "message": "200 of 200 credits used" }] }
```

---

## 6. Artifacts — `/projects/:projectId/artifacts`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/projects/:projectId/artifacts` | Owner | All artifacts; `?fields=type,status` for a light summary |
| GET | `/projects/:projectId/artifacts/:type` | Owner | One artifact with full content |
| PATCH | `/projects/:projectId/artifacts/:type` | Owner | Manually edit content → sets `isManuallyEdited: true` |
| DELETE | `/projects/:projectId/artifacts/:type` | Owner | Delete so it can be regenerated cleanly |
| GET | `/projects/:projectId/artifacts/:type/versions` | Owner | Version history (last 5) |
| POST | `/projects/:projectId/artifacts/:type/restore/:version` | Owner | Restore a previous version |
| GET | `/projects/:projectId/artifacts/:type/export` | Owner | Single-module export, `?format=md\|json\|txt` |

**`GET /projects/:projectId/artifacts/SRS`**

```jsonc
{
  "success": true, "statusCode": 200, "message": "Artifact fetched successfully",
  "data": {
    "_id": "66f2b…", "type": "SRS", "status": "completed",
    "version": 2, "isStale": false, "isManuallyEdited": false,
    "model": "gemini-1.5-flash", "promptVersion": "srs@1.2",
    "generatedAt": "2026-08-06T10:31:11.000Z",
    "content": {
      "functional": [
        { "id": "FR-01", "title": "User Authentication",
          "description": "The system shall allow patients, doctors and admins to register and log in using email and password with JWT-based sessions.",
          "priority": "high" },
        { "id": "FR-02", "title": "Appointment Booking",
          "description": "Patients shall be able to view doctor availability and book, reschedule or cancel appointments.",
          "priority": "high" }
      ],
      "nonFunctional": [
        { "category": "Security", "requirement": "All patient data must be encrypted in transit via TLS 1.3 and passwords hashed with bcrypt.", "metric": "0 plaintext credentials at rest" },
        { "category": "Performance", "requirement": "Appointment search must return results quickly under normal load.", "metric": "p95 < 400 ms at 100 concurrent users" }
      ]
    },
    "generationMeta": { "promptTokens": 1120, "completionTokens": 890, "latencyMs": 8421, "attempts": 1 }
  }
}
```

---

## 7. Diagrams — `/projects/:projectId/diagrams`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/projects/:projectId/diagrams/:type` | Owner | Generate ERD or a UML type → `202` |
| GET | `/projects/:projectId/diagrams` | Owner | All diagrams (source only) |
| GET | `/projects/:projectId/diagrams/:type` | Owner | One diagram |
| PATCH | `/projects/:projectId/diagrams/:type` | Owner | Edit the Mermaid/Graphviz source |
| POST | `/projects/:projectId/diagrams/:type/render` | Owner | Render server-side → upload → returns a Cloudinary URL |
| GET | `/projects/:projectId/diagrams/:type/download` | Owner | `?format=png\|svg\|mmd` |
| DELETE | `/projects/:projectId/diagrams/:type` | Owner | Delete |

`:type` ∈ `erd` \| `uml-usecase` \| `uml-class` \| `uml-sequence` \| `uml-activity` (kebab-case in URLs, mapped to the SCREAMING_SNAKE enum in the controller).

---

## 8. Sprints & Tasks — `/projects/:projectId/sprints`, `/tasks`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/projects/:projectId/sprints/generate` | Owner | Run the sprint planner and **materialise** sprints + tasks → `201` |
| GET | `/projects/:projectId/sprints` | Owner | Sprints with populated tasks |
| POST | `/projects/:projectId/sprints` | Owner | Create a sprint manually |
| PATCH | `/projects/:projectId/sprints/:sprintId` | Owner | Update title, dates, status |
| DELETE | `/projects/:projectId/sprints/:sprintId` | Owner | Delete (cascades to its tasks) |
| POST | `/projects/:projectId/sprints/reorder` | Owner | Bulk reorder |
| POST | `/projects/:projectId/sprints/:sprintId/tasks` | Owner | Add a task → `201` |
| GET | `/projects/:projectId/tasks` | Owner | Flat list; filters `status`, `category`, `assignee`, `dueBefore` |
| GET | `/tasks/:taskId` | Owner | One task |
| PATCH | `/tasks/:taskId` | Owner | Update any field |
| PATCH | `/tasks/:taskId/status` | Owner | Kanban move — recalculates project completion |
| DELETE | `/tasks/:taskId` | Owner | Delete |
| POST | `/projects/:projectId/tasks/reorder` | Owner | Bulk reorder after drag-and-drop |
| GET | `/tasks/upcoming` | ✓ | Tasks due in the next 7 days, across all projects |

**`PATCH /tasks/:taskId/status`** returns the recomputed roll-ups so the client updates the progress ring without a second request:

```jsonc
// Request
{ "status": "done" }

// 200
{ "success": true, "statusCode": 200, "message": "Task marked as done",
  "data": {
    "task": { "_id": "…", "status": "done", "completedAt": "2026-08-06T…" },
    "projectCompletionPercentage": 42,
    "sprintStatus": "in_progress"
  } }
```

**`POST /projects/:projectId/sprints/generate` is transactional.** It deletes existing AI-generated sprints and tasks and inserts the new plan inside one Mongoose session. A partial failure would otherwise leave the board holding half of the old plan and half of the new one — the one place in this system where a transaction is genuinely required.

---

## 9. Reports — `/projects/:projectId/reports`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/projects/:projectId/reports` | Owner | Build a PDF/DOCX → `202` |
| GET | `/projects/:projectId/reports` | Owner | Report history |
| GET | `/projects/:projectId/reports/:reportId` | Owner | Status + download URL |
| GET | `/projects/:projectId/reports/:reportId/download` | Owner | `302` redirect to a signed Cloudinary URL, increments the counter |
| DELETE | `/projects/:projectId/reports/:reportId` | Owner | Delete the record and the Cloudinary asset |
| GET | `/projects/:projectId/reports/preview` | Owner | Server-rendered HTML preview before committing to export |

**`POST /projects/:projectId/reports`**

```jsonc
// Request
{
  "format": "pdf",
  "sections": ["COVER","TOC","DOCUMENTATION","OVERVIEW","SRS","DATABASE_DESIGN",
               "ERD","API_DESIGN","UI_PLAN","UML_CLASS","RISK_ANALYSIS",
               "COST_ESTIMATION","ROADMAP","DEPLOYMENT_GUIDE"],
  "options": {
    "includeDiagrams": true,
    "collegeName": "XYZ Institute of Technology",
    "studentNames": ["Ahad Qureshi", "Team Member 2"],
    "guideName": "Prof. A. Sharma",
    "submissionDate": "2026-12-01"
  }
}

// 202
{ "success": true, "statusCode": 202, "message": "Report is being generated",
  "data": { "reportId": "66f3c…", "status": "queued", "estimatedSeconds": 25 } }
```

Requesting a section whose artifact does not exist yields `400` listing the missing modules, rather than silently producing a report with blank chapters.

---

## 10. Comments — `/projects/:projectId/comments`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/projects/:projectId/comments` | Owner/Mentor | Add a comment, optionally anchored to `artifactType` → `201` |
| GET | `/projects/:projectId/comments` | Owner/Mentor | Threaded; filter `?artifactType=SRS&resolved=false` |
| PATCH | `/projects/:projectId/comments/:commentId` | Author | Edit → sets `isEdited` |
| DELETE | `/projects/:projectId/comments/:commentId` | Author/Admin | Delete |
| PATCH | `/projects/:projectId/comments/:commentId/resolve` | Owner/Mentor | Toggle resolved |

---

## 11. Notifications — `/notifications`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/notifications` | ✓ | Paginated; `?unreadOnly=true` |
| GET | `/notifications/unread-count` | ✓ | Badge counter (polled) |
| PATCH | `/notifications/:id/read` | ✓ | Mark one read |
| PATCH | `/notifications/read-all` | ✓ | Mark all read |
| DELETE | `/notifications/:id` | ✓ | Delete one |
| DELETE | `/notifications` | ✓ | Clear all |

---

## 12. Admin — `/admin`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Users, projects, generations, revenue-proxy counters |
| GET | `/admin/analytics/users` | Admin | Signups over time, `?range=30d` |
| GET | `/admin/analytics/projects` | Admin | Projects by domain / difficulty / status |
| GET | `/admin/ai-usage` | Admin | Tokens + cost by day / module / model / user |
| GET | `/admin/ai-usage/failures` | Admin | Recent failed generations with error messages |
| GET | `/admin/projects` | Admin | All projects across all users |
| DELETE | `/admin/projects/:id` | Admin | Force delete |
| GET | `/admin/logs` | Admin | Recent error logs, `?level=error` |

---

## 13. System — `/health`, `/meta`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | Liveness + DB state + AI reachability (Render health check) |
| GET | `/meta/constants` | — | Enums the client needs: domains, difficulties, artifact types, categories |

**`GET /health`**

```jsonc
{ "success": true, "statusCode": 200, "message": "Service healthy",
  "data": { "uptimeSeconds": 84213, "environment": "production", "version": "1.0.0",
            "database": { "status": "connected", "latencyMs": 12 },
            "aiProvider": { "provider": "gemini", "status": "reachable" },
            "timestamp": "2026-08-06T10:35:00.000Z" } }
```

**Why `/meta/constants` exists.** The domain list, difficulty levels and artifact types must match exactly between the dropdowns and the server validators. Serving them from one endpoint means adding a new domain is a backend-only change — no frontend deploy, no drift, no `422` from a stale option the user can still see in the UI.

---

## 14. Endpoint Count by Resource

| Resource | Endpoints |
|---|---|
| Auth | 11 |
| Users | 13 |
| Projects | 18 |
| Generation | 7 |
| Artifacts | 7 |
| Diagrams | 7 |
| Sprints & Tasks | 14 |
| Reports | 6 |
| Comments | 5 |
| Notifications | 6 |
| Admin | 8 |
| System | 2 |
| **Total** | **104** |

---

## 15. Frontend Axios Interceptor Contract

The refresh flow must be specified precisely, because getting it wrong produces either infinite loops or random logouts.

```
Request interceptor
  → attach Authorization: Bearer <accessToken from Redux>
  → attach X-Request-Id

Response interceptor (on error)
  → if status !== 401                       → reject with the normalised error
  → if the failed request WAS /auth/refresh → hard logout, redirect to /login
  → if this request has already been retried → hard logout
  → otherwise:
       if a refresh is already in flight → queue this request and await it
       else                              → call POST /auth/refresh-token
       on success → update the token in Redux, replay every queued request
       on failure → hard logout, clear the store, toast "Session expired"
```

The single-flight queue matters: when an access token expires, the dashboard typically has 4–6 requests in the air at once. Without queueing, each would fire its own refresh, and rotation-with-reuse-detection would see five "reused" tokens and revoke the entire family — logging the user out for doing nothing wrong.

---

**Previous:** [03 — Database Schema](./03-database-schema.md) · **Next:** [05 — User Flow & Navigation](./05-user-flow-and-navigation.md)
