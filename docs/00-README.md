# Projexa — Phase 1: Project Foundation

**Final Year Computer Science Project** · MERN + Gemini AI
Author: Ahad · Phase 1 completed: 6 August 2026

---

## What This Phase Delivers

Phase 1 is the complete design specification. No application code is written yet — every architectural decision is made, documented and justified here so that Phases 2–14 are pure implementation with no open questions.

| # | Document | Covers |
|---|---|---|
| **01** | [Architecture & Technology Stack](./01-architecture-and-tech-stack.md) | Product definition, module→artifact mapping, full tech stack with justification, system architecture, layered backend design, the AI generation subsystem, end-to-end data flow, SOLID mapping, cross-cutting concerns, deployment topology |
| **02** | [Folder Structure](./02-folder-structure.md) | Monorepo layout, complete backend tree (~150 files), complete frontend tree (~180 files), the repository-layer rationale, feature-first frontend organisation, the renderer registry, Redux slice boundaries, naming conventions |
| **03** | [Database Schema](./03-database-schema.md) | ERD, all 11 collections with full field tables, indexes, relationships, artifact `content` contracts for all 17 modules, design-decision log, seed plan |
| **04** | [API Specification](./04-api-specification.md) | Response envelope, status-code policy, 104 endpoints across 12 resources, request/response examples, the generation job protocol, SSE format, rate limits, the Axios refresh-interceptor contract |
| **05** | [User Flow & Navigation](./05-user-flow-and-navigation.md) | Role capability matrix, primary student journey, 38-route map, guard logic, sidebar and workspace navigation, secondary flows (stale artifacts, mentor review, export, session expiry), loading/empty/error state matrix, accessibility baseline |
| **06** | [Dashboard & Design System](./06-dashboard-and-design-system.md) | Design tokens (colour, type, spacing, motion), student / mentor / admin dashboard layouts, widget inventory, all 15 artifact renderer designs, component build order, motion spec, responsive behaviour |
| **07** | [Packages & Environment](./07-packages-and-environment.md) | Exact dependency lists with install commands and per-package rationale, `package.json` scripts, complete `.env` templates, Vite/Tailwind/Vercel config, Render + Vercel deployment steps, local setup, Git workflow, 14-phase roadmap |

---

## The Three Decisions That Shape Everything

**1. Twenty modules are one pipeline, not twenty features.**
Every module from Project Analysis to Deployment Guide is `Project → Generator → Artifact`. We build one generation engine plus 17 thin strategy classes. Adding a 21st module means one new file and one registry line — no changes to the engine, controller, service, queue, router or UI. This is the Open/Closed Principle doing real work, and it is mirrored on the frontend by a matching renderer registry, so there is not a single `switch` statement on module type anywhere in the codebase.

**2. Generation is asynchronous, per-module, and never blocks.**
A full 17-module run takes 60–180 seconds, which exceeds Render's request timeout. `POST /generate` returns `202` with a `jobId`; work runs through a concurrency-limited queue; each artifact is its own state machine. One module failing never fails the batch, `partial` is a first-class outcome, and the user can navigate away and come back.

**3. `ideaHash` makes edits safe.**
A SHA-256 of the normalised idea fields. When the user edits their project, the hash changes, and every artifact is flagged `isStale` instead of being deleted. The student keeps their existing SRS while deciding whether to regenerate — and the same hash doubles as the cache key that avoids burning API quota on unchanged regenerations.

---

## System at a Glance

```
Frontend (Vercel)          Backend (Render)              External
─────────────────          ────────────────              ────────
React 18 + Vite       →    Express 4 + Node 20      →    MongoDB Atlas
TailwindCSS                Route → Middleware →           Cloudinary
Redux Toolkit              Controller → Service →         Gemini API
React Router 6             Repository → Model             SMTP
Axios + interceptors       + Generation Engine
Framer Motion                (Queue · Registry ·
React Hook Form               Providers · Prompts)
React Hot Toast
```

**11 collections** · **104 endpoints** · **38 routes** · **20 modules** · **3 roles**

---

## Verification Status

All seven documents were cross-checked for internal consistency:

- Artifact type enums identical across Docs 01, 02, 03, 04, 05, 06
- Collection names identical between Doc 03 and the model/repository lists in Doc 02
- API paths in Doc 04 match the route files in Doc 02 and the client routes in Doc 05
- Environment variable names in Doc 07 match every reference in Docs 01 and 04
- Design tokens in Doc 06 match the Tailwind config structure in Doc 07
- All 11 Mermaid diagrams parsed successfully against the Mermaid 11 parser

---

## Next Phase

**Phase 2 — Backend Core.** Scaffold `server/`, wire config and Zod-validated env loading, connect MongoDB with retry, build all 11 Mongoose models, the base repository, `ApiError` / `ApiResponse` / `asyncHandler`, the centralised error middleware, the Winston logger, the health route, and the seed script.

Nothing in Phase 2 requires a decision that is not already made in these seven documents.
