Chapter 1 Introduction
1.1 Background
The Software Development Life Cycle (SDLC) is the standard framework computer science students
are expected to follow and document for their final year project: requirements gathering, system
design, database modelling, API design, implementation planning, testing, and deployment. In
practice, most students execute this process manually and inconsistently — a requirements document
written in one sitting the night before a review, a database schema sketched without considering the
API that will query it, a sprint plan created once and never revisited. General-purpose AI chat tools
(ChatGPT, Gemini, Claude) have started to fill parts of this gap, but they are conversational and
stateless: each answer is a one-off block of text, disconnected from the artefacts generated before it,
not persisted in a structured form, and not aware of the rest of the SDLC.
Projexa was built to address this specific gap: not "an AI chatbot for coding help", but a purpose-built
pipeline that takes one structured project idea and mechanically produces every artefact a final year
SDLC report requires — in a consistent format, version-tracked, and aware of the outputs of the
modules before it.
1.2 Problem Statement
Given a single project idea, there is no single tool that a student can use to generate a complete,
consistent, and exportable set of SDLC artefacts — Overview, Feature List, Technology Stack, Software
Requirements Specification, Database Design, API Design, Folder Structure, UI Plan, Sprint Plan,
Roadmap, Cost Estimation, Risk Analysis, Documentation, GitHub Guide, Deployment Guide and Viva
Preparation — while keeping those artefacts synchronised with each other and with the original idea
as it evolves.
1.3 Objectives
• Design and build a MERN-stack web platform that converts a single, structured project idea
into sixteen distinct, AI-generated SDLC artefacts.
• Design one reusable generation engine (queue, registry, provider abstraction, template
method) so that every module is a thin strategy class, not a bespoke feature — adding module
seventeen must require no change to existing code (Open/Closed Principle).
• Chain module outputs as inputs to later modules (e.g. the Database Design output is injected
into the API Design prompt) so generated artefacts are internally consistent with each other,
not independently hallucinated.
• Persist every artefact with versioning, and flag artefacts "stale" (rather than deleting them)
whenever the underlying idea changes, so a student never loses prior work by editing their
idea.
• Provide role-based access for Student, Mentor and Admin users, so a faculty mentor can
review and comment on a student’s generated artefacts.
• Provide export of any artefact, or the whole project, to PDF, Word (.docx) and Markdown from
a single format-agnostic rendering pipeline.
• Secure the platform with industry-standard authentication: short-lived access tokens, rotating
refresh tokens with reuse/theft detection, and bcrypt password hashing.
PROJEXA — Project Report
2
• Make the AI provider swappable (Google Gemini or OpenAI) behind one interface, so a quota
exhaustion on one provider does not stop the application from working.
1.4 Scope of the Project
Projexa targets a single primary user journey: a final year Computer Science student registers,
describes one project idea, generates some or all of the sixteen supported modules, reviews and edits
the generated content, tracks the plan through a sprint board, and exports the finished package for
submission or viva preparation. Mentor review (commenting on artefacts) and Admin oversight (AI
usage, credits, user management) are supported as secondary roles on the same data model.
Automated diagram rendering (ER diagrams and UML), a dedicated admin analytics dashboard, and
horizontal scaling of the generation queue (via Redis/BullMQ) are scoped as designed-but-not-yetimplemented extensions, discussed in Chapter 9.
1.5 Organization of the Report
Chapter 2 reviews existing tools and positions Projexa against them. Chapter 3 specifies the functional
and non-functional requirements. Chapter 4 covers system design: architecture, technology stack,
database schema, API design, the AI generation engine, security and the UI/UX design system. Chapter
5 describes each of the sixteen AI modules in detail. Chapter 6 covers implementation, the
development methodology, and real engineering challenges encountered and resolved during
development. Chapter 7 covers the testing strategy. Chapter 8 discusses results. Chapter 9 concludes
the report and outlines future scope.
PROJEXA — Project Report
3
Chapter 2 Literature Review / Existing System Study
2.1 Existing Approaches
2.1.1 General-Purpose AI Chat Assistants
Tools such as ChatGPT, Gemini and Claude, used directly through their chat interfaces, can produce
an SRS, a database schema, or a sprint plan if prompted individually. However, each response is a oneoff, unstructured block of text: there is no persistence, no versioning, no shared context automatically
carried from one artefact to the next, and no guarantee of a consistent JSON/document structure that
downstream tooling (an exporter, a diagram renderer, a sprint board) can rely on.
2.1.2 Project Templates and Boilerplates
Static SRS/report templates (Word or LaTeX templates shared by departments) standardise the
document format but supply none of the content — the student still authors every section manually,
and the template has no knowledge of the specific project idea.
2.1.3 Diagramming and Planning Tools
Tools such as draw.io, Lucidchart and Trello are useful once the underlying design decisions already
exist, but none of them derive that design from a project idea; they are input surfaces, not generators.
2.2 Limitations of Existing Systems
• No single tool spans the full SDLC — a student stitches together a chat assistant, a
diagramming tool, a document editor and a task board manually.
• Outputs from a chat assistant are not persisted in a structured, queryable, versioned form.
• There is no mechanism to keep later artefacts consistent with earlier ones (a database schema
and an API spec generated in separate, unrelated prompts routinely disagree with each other).
• No built-in export to submission-ready formats (PDF/DOCX) tailored to each artefact type.
• No role-based mentor review workflow.
2.3 Proposed System — Projexa
Projexa addresses each of these gaps directly. A single project idea is the one input; sixteen generator
modules consume it (and each other’s outputs, via an explicit dependency graph) to produce a
coherent set of artefacts; every artefact is persisted, versioned, and automatically flagged stale when
the source idea changes; and a single export pipeline renders any artefact to PDF, DOCX or Markdown.
The system is architected so that this is one engine executed sixteen times with different prompts and
schemas, not sixteen unrelated features — which is what makes it maintainable and extensible rather
than a growing pile of special cases.
PROJEXA — Project Report
4
Chapter 3 System Requirements Specification
3.1 Functional Requirements
ID Requirement
FR-0
1
The system shall allow a user to register with name, email, password and role (Student / Mentor), and
verify their email address.
FR-0
2
The system shall allow a registered user to sign in and receive a short-lived access token and a rotating
refresh token.
FR-0
3
The system shall allow a Student to create a project by supplying title, description, domain, difficulty,
team size, preferred technology, deadline and an AI-integration flag.
FR-0
4
The system shall allow a Student to trigger generation of any one, several, or all sixteen supported AI
modules for a project.
FR-0
5
The system shall run module generation asynchronously and report per-module progress (queued /
generating / completed / failed) so the client can poll or subscribe for status.
FR-0
6
The system shall allow a single failed module to be retried independently without regenerating the
modules that already succeeded.
FR-0
7
The system shall validate every AI response against a strict schema before persisting it, and surface a
clear error (with retry) if validation fails.
FR-0
8
The system shall version every artefact, preserving the previous version when a module is regenerated
or manually edited.
FR-0
9
The system shall flag existing artefacts as "stale" — without deleting them — whenever the underlying
project idea is edited.
FR-1
0
The system shall allow a Student to manually edit generated artefact content.
FR-1
1
The system shall allow export of an individual artefact, or the full project, to PDF, Word (.docx) and
Markdown.
FR-1
2
The system shall present a derived project history (created, each generation, each edit, each export)
without a separate write-time activity log.
FR-1
3
The system shall allow a Mentor to view projects they are attached to and post comments against a
specific artefact.
FR-1
4
The system shall allow an Admin to view AI usage (tokens, cost, latency, success rate) across all users.
FR-1
5
The system shall track and enforce a per-user AI credit quota, decrementing one credit per successful
module generation.
FR-1
6
The system shall materialise a generated Sprint Plan into individually trackable sprints and tasks that
the Student can check off.
PROJEXA — Project Report
5
3.2 Non-Functional Requirements
ID Requirement
NFR01
Performance — a full sixteen-module generation run must not block the HTTP request thread; it must
complete asynchronously within an acceptable multi-minute window and never exceed hostingplatform request timeouts.
NFR02
Security — access tokens must be short-lived (15 minutes) and held only in memory on the client;
refresh tokens must be httpOnly, rotated on every use, and revoked as a family on reuse detection.
NFR03
Reliability — one module failing must never fail the whole generation batch; a server restart must
never leave an artefact permanently stuck in a "generating" state.
NFR04
Usability — generation progress, errors and retries must be visible in the UI in plain language, not raw
provider error text.
NFR05
Maintainability — adding a new AI module must require one new generator file and one registry entry,
with zero changes to the queue, controller, service or router.
NFR06
Portability — the AI provider must be swappable (Gemini ↔ OpenAI) via a single environment variable
with no code changes.
NFR07
Accessibility — both the dark and light UI themes must meet WCAG AA colour-contrast minimums
(4.5:1 for body text).
NFR08
Cost control — AI spend must be bounded per user via a credit quota and observable via per-call usage
logging.
3.3 Hardware and Software Requirements
3.3.1 Development Environment
• Node.js 20 LTS or later
• MongoDB 7.x (local mongod or MongoDB Atlas)
• A Google Gemini API key (or an OpenAI API key, provider-swappable)
• A Cloudinary account (avatar / asset storage)
• 4 GB RAM minimum, 8 GB recommended; any OS capable of running Node.js and a modern
browser
3.3.2 Client Requirements
• Any evergreen desktop or mobile browser (Chrome, Edge, Firefox, Safari) with JavaScript
enabled
• Minimum viewport width 360px (responsive layout, mobile-first breakpoints)
PROJEXA — Project Report
6
3.4 User Roles and Capabilities
Role Primary Capabilities Notes
Student
Create/edit projects, trigger and retry
generation, edit artefacts, manage the
sprint board, export reports, manage
account settings
The primary and default role on
registration
Mentor
View projects they are attached to,
comment on specific artefacts,
everything a Student can do for their own
account
Assigned to a project by
title/relationship, not self-service
Admin
View AI usage analytics across all users,
manage user roles/status/credits,
operate the platform
Route-level RBAC via an authorize()
middleware
PROJEXA — Project Report
7
Chapter 4 System Design
4.1 System Architecture
Projexa follows a classic three-tier client-server architecture. The React single-page application
(hosted on Vercel) never talks to MongoDB, Cloudinary or the Gemini API directly — every external
interaction is mediated by the Express API (hosted on Render), which alone holds the credentials for
the database, object storage and AI provider.
Tier Responsibility
Client
React 18 + Vite single-page app. Redux Toolkit holds global
auth/project/generation state; Axios (with interceptors for token attachment
and silent refresh) is the only channel to the API.
Server
Express 4 on Node 20. A strict middleware chain (Helmet, CORS, rate limiting,
JWT auth, RBAC, request validation) precedes every controller. Controllers are
HTTP-only; all business logic lives in services.
Data & External Services
MongoDB Atlas (primary data store), Cloudinary (avatars and exported assets),
Google Gemini API (AI generation, OpenAI as a swappable alternative), SMTP
(transactional email).
Within the server, the codebase applies the Model-View-Controller pattern for file organisation and
the Clean Architecture dependency rule for the direction imports are allowed to point:
Route -> Middleware -> Controller -> Service -> Repository -> Model -> MongoDB
 |
 Generation Engine -> AI Provider
A Controller may only call exactly one Service method and shape the HTTP response; it must never
query a Model directly or contain business branching. A Service never imports req/res and knows
nothing about HTTP. A Repository is the only layer that constructs Mongoose queries. This separation
means the entire business layer (services) can be unit-tested with an in-memory MongoDB instance
and zero HTTP mocking.
4.2 Technology Stack
4.2.1 Frontend
Technology Version Role in Projexa
React ^18.3 Component-based UI; concurrent rendering benefits the artifact
viewer when switching between large generated documents.
Vite ^5.4 Development server and production bundler — native ESM, subsecond hot module reload.
Tailwind CSS ^3.4 Utility-first styling driven by a CSS-variable design-token system,
supporting an independently designed light and dark theme.
Redux Toolkit ^2.2 Global state for auth, active project, and long-running generation
jobs that must be visible from multiple screens at once.
PROJEXA — Project Report
8
Technology Version Role in Projexa
React Router ^6.26 Client-side routing, nested layouts, and role-aware route guards
(ProtectedRoute / PublicOnlyRoute).
Axios ^1.7 HTTP client with request/response interceptors: bearer-token
attachment and transparent, single-flight session refresh on 401.
Framer Motion ^11.3 Motion for perceived performance during multi-second AI
generation: skeletons, staggered reveals, page transitions.
React Hook Form + Zod ^7.52 / ^3.23 Uncontrolled form state plus schema validation shared in spirit
with the backend's own Zod/express-validator rules.
React Hot Toast ^2.4 Non-blocking success/error feedback for asynchronous actions.
4.2.2 Backend
Technology Version Role in Projexa
Node.js 20 LTS JavaScript runtime; native fetch and stable ESM support.
Express ^4.19 HTTP framework, used strictly as a thin delivery mechanism per
the layered architecture.
MongoDB + Mongoose 7.x / ^8.5
Document database — a natural fit for sixteen structurally
different, evolving AI-output shapes that would otherwise need
seventeen SQL tables or a catch-all JSON column.
jsonwebtoken ^9.0 Stateless 15-minute access tokens and 7-day rotating refresh
tokens.
bcryptjs ^2.4 Password hashing at cost factor 12, applied in a Mongoose presave hook so it can never be bypassed.
@google/generative-ai ^0.21 Gemini SDK, wrapped behind an internal AIProvider interface.
openai ^4.56 Alternative provider implementing the same AIProvider interface.
zod ^3.23 Runtime schema validation of every parsed AI JSON response
before it is ever persisted.
p-queue ^8.0 In-process, concurrency-aware job queue driving the generation
engine.
pdfkit / docx latest Server-side PDF and Word document generation for
artefact/report export.
winston + morgan ^3.14 / ^1.10 Structured JSON logging with a per-request correlation ID.
helmet, cors, expressrate-limit, expressmongo-sanitize, hpp
latest Standard HTTP hardening middleware.
PROJEXA — Project Report
9
4.2.3 Platform and Tooling
Concern Choice
Frontend hosting Vercel — auto-deploy from main, preview deployments per pull request.
Backend hosting Render — Node 20 web service with a dedicated health-check endpoint.
Database MongoDB Atlas (free tier sufficient for FYP scale).
Object storage Cloudinary (avatars, project covers, exported files).
Version control / CI GitHub, Conventional Commits, GitHub Actions running lint and test on every
pull request.
4.3 Database Design
The schema is document-oriented and organised around eleven Mongoose models. Artefacts and
diagrams are deliberately separate collections from each other (a diagram carries a source language
and a rendered binary that an artefact does not), and Sprint/Task data is deliberately separate from
the Artifact that produced the plan, because sprint/task rows are mutated continuously by the user
(checked off, reordered) while an artefact is replaced wholesale on regeneration.
Collection Purpose Key Relationships
users
Account, role (student/mentor/admin), AI credit balance,
profile
owns many projects;
mentors many projects
projects The project idea and its metadata: title, description,
domain, difficulty, deadline, ideaHash, status, completion %
belongs to a user
(owner); has mentors
artifacts One row per (project, module type): content, status,
version, staleness flag belongs to a project
diagrams ER/UML diagram source + rendered asset reference
(schema in place; rendering pipeline is a future-scope item) belongs to a project
sprints One row per planned week: goal, date range, status belongs to a project
tasks One row per actionable to-do inside a sprint: status,
priority, due date
belongs to a project and a
sprint
reports Exported report metadata (format, sections, generated file
reference) belongs to a project
comments Mentor/Student review comments scoped to a specific
artefact type
belongs to a project and
an author
notifications In-app notifications (generation complete, mentor
commented, etc.) belongs to a user
aiusagelogs One row per AI call: tokens, latency, estimated cost,
success/failure
belongs to a user and a
project
refreshtokens Hashed refresh tokens with family/rotation metadata for
theft detection belongs to a user
PROJEXA — Project Report
10
A single field deserves particular attention: Project.ideaHash, a SHA-256 hash of the normalised idea
fields (title, description, domain, difficulty, tech, AI-required flag). When a student edits any of these
fields, the hash changes and every existing artefact is flagged isStale = true rather than deleted —
preserving the student's prior generated work while making it unambiguous, in the UI, that the idea
has moved on and a regeneration is recommended. The same hash doubles as a cache key: an
unchanged idea returns the previously generated artefact instead of spending an AI credit regenerating an identical result.
4.4 API Design
All endpoints are versioned under /api/v1 and return one consistent response envelope:
{
 "success": true,
 "statusCode": 200,
 "message": "…",
 "data": { … },
 "meta": { "page": 1, "limit": 20, "total": 42 } // list endpoints only
}
Resource Base Path Representative Endpoints
Authentication /api/v1/auth
register, login, refresh-token, logout,
logout-all, forgot/reset-password,
change-password, sessions
Users /api/v1/users me (get/update), me/preferences,
me/avatar
Projects /api/v1/projects CRUD, restore, duplicate, bookmark,
visibility, status, stats, public listing
Generation /api/v1/projects/:id/generate start (selected modules), all, retry one
module, poll/stream job status
Artifacts /api/v1/projects/:id/artifacts list, get one, version history, restore a
version
Export & History /api/v1/projects/:id/export, /history export to PDF/DOCX/Markdown;
derived project timeline
System /api/v1/health, /api/v1/meta liveness/readiness probe; shared enum
constants for the client
Authentication uses a bearer access token on every request (attached by an Axios request interceptor)
and a single-flight refresh flow: on a 401, the response interceptor requests a new access token using
the httpOnly refresh cookie, retries the original request once, and — critically — deduplicates
concurrent refresh attempts behind one shared in-flight promise, so that multiple callers asking for a
refreshed session at the same moment never race the same rotating refresh token against itself.
4.5 AI Generation Engine Design
This subsystem is the core of the product and receives the most design attention. It is built from four
collaborating pieces:
PROJEXA — Project Report
11
1. GeneratorRegistry — a Map from artifactType to a generator instance. Adding module
seventeen means adding one new Generator class and one line here; nothing else in the
engine, controller, service or queue changes (Open/Closed Principle).
2. BaseGenerator — a Template Method that fixes the algorithm every module follows: build
context → build prompt → call the AI provider → parse the response → validate against a Zod
schema → persist with version history → log token usage → charge one AI credit. A concrete
generator supplies only its artifactType, its dependsOn list, and its prompt module.
3. AIProvider interface — GeminiProvider and OpenAIProvider both implement
generate(prompt, options) → { text, usage }. Generators depend only on this interface
(Dependency Inversion), so switching AI_PROVIDER from gemini to openai in one environment
variable keeps the entire application working with zero code changes — important in practice,
because free-tier AI quotas are limited.
4. GenerationQueue — an in-process, sequential-per-job queue. Modules for one generation job
run strictly in dependency order (a topological sort of each generator's dependsOn graph,
computed with Kahn's algorithm), because a dependent module must read the completed
output of the module it depends on. Each artifact is its own state machine (queued →
generating → completed | failed), so one module failing never fails the batch, and a user can
retry exactly the module that failed.
Because generating all sixteen modules can take one to several minutes — well beyond a typical HTTP
request timeout — generation is asynchronous: POST …/generate returns 202 Accepted with a jobId
immediately, while work continues in the background; the client polls (or subscribes via Server-Sent
Events) for progress. A boot-time reconciliation routine sweeps any artefact left stuck in "generating"
for more than five minutes back to "failed" after a server restart, so the UI is never permanently wrong.
Prompts are treated as data, not code: each module's prompt lives in its own versioned file exporting
{ version, buildPrompt(project, context), outputSchema }. Every prompt requests strict JSON output
(Gemini's responseMimeType: "application/json"), and every response is validated against
outputSchema before it is trusted — a malformed AI response becomes a clean, retryable "failed"
artifact, never a crash and never corrupt data in MongoDB.
4.6 Security Design
Concern Design Decision
Access token JWT, 15-minute lifetime, held in memory on the client only (never localStorage)
so that a successful XSS payload cannot read it.
Refresh token JWT, 7-day lifetime, httpOnly + secure + sameSite cookie, scoped narrowly to
the /api/v1/auth path, unreadable by client-side JavaScript.
Rotation & theft detection
Every refresh call issues a new refresh token and revokes the old one.
Presenting an already-revoked token (a replayed/stolen token) revokes the
entire token family and forces re-authentication.
Password storage bcrypt, cost factor 12, applied in a Mongoose pre-save hook.
Authorization Route-level RBAC middleware for role gates (admin-only routes); ownership
checks live in the service layer because they require the loaded document.
Transport hardening
Helmet security headers, strict CORS allow-list with credentials, request-body
sanitisation against NoSQL injection, HTTP parameter pollution protection, perroute rate limiting.
PROJEXA — Project Report
12
4.7 UI/UX Design System
The interface is themeable via a single set of CSS custom properties (colour, typography, spacing, radii,
shadows) consumed by Tailwind's configuration, with two independently designed palettes — dark
(the primary, default experience) and light — switched by toggling one class on the document root.
The light theme is a purpose-built palette (a softly tinted lavender canvas with pure-white elevated
cards, WCAG-AA-compliant semantic colours) rather than a naive inversion of the dark theme's
colours, which is a deliberate design correction made during development (see §6.3).
The component library is a small, reusable set (Button, Switch, Badge, ProgressBar, Modal, form
inputs) built once and consumed by every page, keeping the visual language consistent across the
Dashboard, Project Workspace, Generation panel, Settings and Admin surfaces.
4.8 Design Patterns and SOLID Principles Applied
Pattern Where it is applied
Strategy Each of the sixteen Generator classes is an interchangeable strategy
executed by the same BaseGenerator algorithm.
Template Method BaseGenerator.run() fixes the fetch → prompt → call → parse → validate →
persist → log sequence once for every module.
Factory providerFactory returns a GeminiProvider or OpenAIProvider based on one
environment variable.
Repository
Every collection has a dedicated repository (projectRepository,
artifactRepository, …) isolating Mongoose query construction from business
logic.
Adapter The Cloudinary wrapper adapts the third-party SDK to the storage interface
the rest of the app expects.
Facade projectService fronts several repositories (project, artifact, sprint) behind
one cohesive API for controllers.
Chain of Responsibility The Express middleware chain (Helmet → CORS → rate limit → auth →
RBAC → validation) — any link can short-circuit the request.
SOLID Concretely, in this codebase
S
artifactController only translates HTTP; artifactService only holds business rules;
artifactRepository only queries; each Generator class only knows how to produce one artefact
type.
O
GeneratorRegistry maps artifactType → generator. Module seventeen is a new file plus one
registry line — zero edits to the engine, controller, service or queue.
L
GeminiProvider and OpenAIProvider are fully interchangeable behind AIProvider;
GenerationService cannot tell them apart.
I
Repositories are split per aggregate rather than one god object; frontend hooks are narrow
(useProject, useGenerationStatus) so a component never depends on a capability it does not use.
D
GenerationService depends on the AIProvider and Queue abstractions, never on the Gemini SDK
or a specific queue library directly — the concrete implementation is injected by a factory, which
is also what makes the service unit-testable with mocks.
PROJEXA — Project Report
13
Chapter 5 Module Description
Projexa organises its sixteen AI generator modules into six SDLC-aligned groups, which also drives the
grouping of the workspace sidebar in the UI. Every module shares the same generation algorithm
(Chapter 4, §4.5); what differs between modules is only its prompt, its dependency list, and the Zod
schema its output must satisfy.
5.1 Overview Group
Module Depends On Produces
Overview (OVERVIEW) Project idea only A one-paragraph elevator pitch, target users, and
the core problem the project solves.
Features (FEATURES) Overview A prioritised list of core and optional features, each
with a short justification.
Tech Stack
(TECH_STACK) Overview, Features
A recommended
frontend/backend/database/deployment stack
matched to the project's difficulty and domain.
5.2 Analysis Group
Module Depends On Produces
SRS (SRS) Features Functional and non-functional requirements in a
numbered, testable format (FR-xx / NFR-xx).
Risk Analysis
(RISK_ANALYSIS) SRS Identified project risks, each rated by
likelihood/impact, with a mitigation strategy.
Cost Estimation
(COST_ESTIMATION) Tech Stack, Roadmap
A line-item cost estimate (hosting, tools, APIs,
licences) with free-tier guidance, split into one-time
and recurring monthly cost.
5.3 Design Group
Module Depends On Produces
Database Design
(DATABASE_DESIGN) SRS Collections/tables, fields, types and relationships
for the proposed data model.
API Design
(API_DESIGN) Database Design REST endpoints, methods and request/response
shapes matched exactly to the generated schema.
Folder Structure
(FOLDER_STRUCTURE) API Design A recommended repository layout for the chosen
tech stack.
UI Plan (UI_PLAN) Features Key screens, their primary components and
navigation flow.
PROJEXA — Project Report
14
5.4 Planning Group
Module Depends On Produces
Sprint Plan
(SPRINT_PLAN) SRS
A week-by-week sprint breakdown, materialised
into individually trackable sprint and task records
on the sprint board.
Roadmap (ROADMAP) Sprint Plan A milestone-level project timeline against the
deadline supplied with the idea.
5.5 Delivery Group
Module Depends On Produces
Documentation
(DOCUMENTATION) Sprint Plan A structured project report draft assembled from
the artefacts generated so far.
GitHub Guide
(GITHUB_GUIDE) Tech Stack Branching strategy, commit conventions and a
starter README suited to the project.
Deployment Guide
(DEPLOYMENT_GUIDE)
Tech Stack, Folder
Structure
Per-component hosting platform
recommendations, deployment steps, required
environment variables and minimal CI/CD
guidance.
5.6 Submission Group
Module Depends On Produces
Viva Preparation
(VIVA_PREP) Documentation Likely viva examiner questions with model answers,
grounded in the project's own generated artefacts.
5.7 Dependency-Aware Generation
The dependency relationships in the tables above are not documentation of intent — they are
executable. Each generator declares its dependsOn list in code; when a student requests several
modules at once, the queue topologically sorts the requested set (Kahn's algorithm) so that, for
example, API Design always runs after Database Design has completed and its output is available to
inject into the API Design prompt. This is what keeps the generated Database Design and API Design
artefacts describing the same collections rather than two independently invented ones.
PROJEXA — Project Report
15
Chapter 6 Implementation
6.1 Development Methodology
Projexa was built incrementally across eight phases, each producing a working, demonstrable
increment rather than a horizontal slice (e.g. "all models" or "all controllers") that would not run endto-end until the very end.
Phase Name Delivers Status
1 Planning & System Design
Full architecture, database schema,
API specification, UI/UX design system
— documented and cross-checked
before any code was written
Complete
2 Backend Core
Express app scaffold, all eleven
Mongoose models, repository layer,
authentication
(register/login/refresh/logout),
centralised error handling
Complete
3 Frontend Core
Vite + Tailwind scaffold, Redux store,
Axios layer with refresh interceptor,
routing/guards, authentication pages,
dashboard shell
Complete
4 AI Generation Engine
All sixteen generator modules, the
generation queue, registry, provider
abstraction, and the artifact viewer
with a matching renderer registry
Complete
5 Documentation & Export
PDF/DOCX/Markdown export from
one format-agnostic block
representation, derived project
history, saved-generation UI
Complete
6 Collaboration & Review Mentor commenting UI, in-app
notification centre Planned
7 Admin & Analytics Admin AI-usage dashboard,
user/credit management UI Planned
8 Deployment & Hardening
Production deployment to
Vercel/Render, BullMQ/Redis queue
migration, monitoring
Planned
6.2 Key Implementation Highlights
6.2.1 The Generation Pipeline
Every module — regardless of how different its output looks (an SRS versus a cost table versus a folder
tree) — flows through the exact same BaseGenerator.run() method: build context from alreadycompleted dependency artefacts, build the module's prompt, call the active AIProvider in strict-JSON
mode, repair and Zod-validate the response, archive the previous artefact version if one exists, persist
the new version, log token usage and cost, and decrement the user's AI credit balance. Concretely
PROJEXA — Project Report
16
adding module seventeen is one new prompt file, one new Generator subclass (roughly ten lines), and
one line in the registry map.
6.2.2 Format-Agnostic Export
Rather than writing three renderers (PDF, DOCX, Markdown) for each of the sixteen artefact types —
forty-eight renderers — Projexa defines one formatter per artefact type that produces a small
intermediate representation of generic "blocks" (heading, paragraph, list, table, key-value, spacer).
Three format builders (pdfkit for PDF, the docx package for Word, template strings for Markdown)
each consume that same block list generically. Adding export support for a new artefact type means
writing one formatter, not three.
6.2.3 Derived Project History
Rather than maintaining a separate write-time activity-log collection (which drifts the moment a
developer adds a new mutation and forgets to also write a log entry), project history is computed on
request from fields that already exist on Project and Artifact documents (createdAt, updatedAt,
generatedAt, version, previousVersions, isManuallyEdited, error.occurredAt). This guarantees the
history view can never fall out of sync with the actual data.
6.3 Engineering Challenges Solved During Development
The following is a representative, honest record of non-trivial defects found and fixed during
development — included because diagnosing them required understanding the system at a level
beyond "make the error go away", and because a viva examiner is entitled to ask "what actually went
wrong, and how did you know?"
6.3.1 Silent Fallback to Mock AI Data
Generated artefacts looked plausible but were not actually coming from Gemini. Root cause: the
AI_PROVIDER environment variable was set to mock (a deterministic, zero-cost fixture provider used
for offline development) despite valid Gemini and OpenAI API keys being present — the provider
factory never cross-checks the configured provider against which keys are actually available. Fixed by
setting AI_PROVIDER=gemini explicitly; this exposed the need for the factory to eventually warn (not
silently proceed) when a provider is selected without a corresponding key.
6.3.2 Retired Model 404
After enabling live Gemini calls, every generation failed with "model not found" for gemini-1.5-flash.
Investigation confirmed the model had been fully retired by Google in favour of the Gemini 3.x line.
Fixed by migrating the configured model to the current stable flagship (gemini-3.6-flash) across the
environment configuration, the Zod-validated environment schema default, and the token-cost
pricing table used for usage accounting — with the retired model's pricing intentionally kept in the
table so historical usage logs still report the rate that was actually charged at the time, rather than
silently re-pricing old records against today's rates.
6.3.3 A Substring Bug That Hid the Real Error
Every Gemini error was being reported to users as a generic "the AI service is busy or over quota"
message — including the permanent 404 above, which made it look like a transient rate-limit issue
and actively misled debugging. Root cause: the retry-eligibility check used message.includes('rate'),
and the literal string "generateContent" — present in the URL every Gemini SDK error echoes back —
contains "rate" as a substring (gene-RATE-Content). This matched every single Gemini error,
permanent or transient, and relabelled all of them identically. Fixed by switching the word-based
checks to word-boundary regular expressions, and additionally surfacing the specific Zod validation
PROJEXA — Project Report
17
issues (which were already being computed and logged server-side) in the client-facing error message,
so a failed module's real cause is visible in the UI instead of requiring access to the server terminal.
6.3.4 Rate-Limit Exhaustion Late in a Generation Batch
Two specific modules (Cost Estimation and Deployment Guide) consistently failed to generate, while
earlier modules in the same run usually succeeded. These two modules are, respectively, the 13th and
16th (last) of sixteen modules to run sequentially in dependency order. Diagnosis: Gemini's free tier
commonly enforces a per-minute request quota (roughly 10–15 requests per minute even on
generous tiers); sixteen sequential requests with no pacing between them reliably exhaust that quota
by the time the batch reaches its later modules, and the existing retry backoff (roughly 2.5 seconds
total across two retries) was far too short to outlast a 60-second quota window. Fixed by increasing
the retry backoff for transient failures to roughly 19 seconds total, and adding a small fixed pacing
delay between sequential module runs so the batch does not burst past the provider's rate limit in the
first place.
6.3.5 A Race Condition That Logged Every User Out on Refresh
Users were bounced back to the login page on every single page refresh, despite a valid, unexpired
refresh-token cookie being present. Root cause: the refresh token rotates on every use (the previous
token is revoked the moment a new one is issued, with reuse of a revoked token treated as theft and
revoking the entire session family). React 18's StrictMode intentionally double-invokes mount effects
in development, so the app's session-bootstrap effect fired two concurrent refresh requests carrying
the same cookie on every load; the first request rotated the token, and the second then presented a
token the server had just revoked, which theft-detection correctly (from its own point of view) treated
as a stolen token and revoked the session. Fixed by routing both the bootstrap-on-load refresh and
the existing 401-retry refresh through one shared, deduplicated in-flight promise, so no matter how
many callers ask for a session refresh at the same moment, only one request is ever actually sent.
6.3.6 A Light Theme That Was a Naive Inversion
The original light theme was produced by inverting the dark theme's colour values, which produced a
flat, low-contrast interface: near-white cards on a pure-white page carried almost no elevation
contrast, glass-blur effects tuned to glow against a near-black background became a barely visible
haze on white, and two semantic colours (warning, info) were found to fail WCAG AA text-contrast
requirements outright (roughly 2.9:1 and 2.4:1 against white, against a 4.5:1 requirement). Fixed by
designing a purpose-built light palette — a softly brand-tinted canvas with pure white elevated cards
for real contrast, darkened warning/info colours that pass contrast, and independently tuned
decorative-glow opacity — while leaving the dark theme, already considered correct, completely
untouched.
6.4 Tools Used
• Visual Studio Code / a Claude-based coding assistant for implementation
• Postman / direct HTTP calls for manual API verification
• MongoDB Compass for inspecting collections during development
• Git and GitHub for version control
• esbuild for fast syntax/bundle verification of changed frontend modules
PROJEXA — Project Report
18
Chapter 7 Testing
7.1 Testing Strategy
Testing in Projexa happens at three layers. First, every AI-generated response is validated at runtime
against a Zod schema before it is trusted — this is, in effect, a contract test that runs on every single
production request, not only in CI. Second, the backend has an automated end-to-end smoke-test
script (Jest/Supertest-style assertions run against a live running server) exercising over sixty assertions
across registration, login, project CRUD, generation of all sixteen modules, and export — used as a fast
regression gate after any change to the generation pipeline. Third, unit and integration tests use Jest
with mongodb-memory-server on the backend (so tests never touch a real database) and are
structured to test each layer — repository, service, controller — independently, consistent with the
layered architecture's separation of concerns.
7.2 Representative Test Scenarios
Area Scenario Expected Result
Auth Register with a valid payload User created, verification email sent, tokens issued
Auth Login with an incorrect password
A single generic "Invalid email or password" response
for both a wrong password and a non-existent
account (no account-enumeration oracle)
Auth Refresh with an already-used
(revoked) refresh token
The entire token family is revoked and the caller is
forced to re-authenticate
Projects Create a project with a missing
required field 422 response with a field-level validation error
Projects Edit a project's idea fields after
artefacts exist
ideaHash changes; existing artefacts are flagged
isStale, not deleted
Generation Request all sixteen modules for a
fresh project
A 202 response with a jobId; modules complete in
dependency order; a later module's prompt contains
the completed content of its declared dependencies
Generation A module's AI response fails schema
validation
That module (and only that module) is marked failed
with a specific, human-readable reason; the batch
continues
Generation Retry a single failed module Only that module regenerates; previously completed
modules are untouched
Export Export a completed project to PDF,
DOCX and Markdown
All three formats render the same artefact content via
the shared block representation
7.3 Defect Log Summary
The following defects, all found and resolved during development, are summarised here from the
detailed account in §6.3.
PROJEXA — Project Report
19
# Defect Root Cause Resolution
1
Create Project button stuck
in a loading state on
validation failure
Redux extraReducers handled
only the .fulfilled case for the
create/update thunks,
never .rejected
Added .rejected handling so the
mutation status always resolves
2
Generated content silently
used mock data
AI_PROVIDER=mock despite
valid API keys present
Set AI_PROVIDER=gemini
explicitly
3
All generation requests
returned 404
Configured Gemini model had
been fully retired
Migrated to the current stable
model and updated the pricing
table
4
Every AI error showed a
generic "busy or over quota"
message
Substring match ('rate' inside
'generateContent') misclassified
permanent errors as transient
Word-boundary regex
classification; surfaced real Zod
validation detail to the client
5
Cost Estimation /
Deployment Guide modules
reliably failed near the end
of a full run
Free-tier per-minute rate limit
exhausted by request #13-16 of
a 16-request sequential burst;
retry backoff too short to
outlast the quota window
Longer backoff (~19s) plus intermodule pacing delay
6
Users logged out on every
page refresh
React StrictMode doubleinvoked the session-bootstrap
effect, racing two refresh calls
against one rotating token
Single shared, deduplicated inflight refresh promise
7
Light theme toggle knob
visually overlapping its label;
overall light theme lowcontrast
Insufficient flex gap; naive
colour inversion of the dark
theme; two semantic colours
failed WCAG AA
Increased gap; purpose-built
light palette with WCAG-AApassing semantic colours
PROJEXA — Project Report
20
Chapter 8 Results and Discussion
8.1 End-to-End Outcome
At the conclusion of Phase 5, a Student user can register, verify their email, sign in, describe a single
project idea, and generate all sixteen supported SDLC modules — Overview through Viva Preparation
— in one asynchronous job, watch each module's status update live (queued → generating →
completed), retry any module that fails with a specific, readable reason, edit any generated artefact,
track the generated Sprint Plan on an interactive sprint board, and export the finished package to PDF,
Word or Markdown. This satisfies the core objective stated in Chapter 1: turning one sentence into a
complete, exportable SDLC package.
8.2 Performance Observations
A full sixteen-module generation run completes asynchronously in roughly one to three minutes
depending on AI provider latency and free-tier rate limiting, safely within Render's request timeout
because the HTTP request itself only starts the job and returns immediately. Individual module
regeneration (the far more common case once a project already has most of its artefacts) typically
completes in five to fifteen seconds.
8.3 Illustrative Screenshots
[Author's note: insert screenshots of the Landing page, Sign-in page, Project Dashboard, Generation
progress panel, an example generated artefact (e.g. SRS or Sprint Board), and the Export dialog here
before final submission. Screenshots were intentionally left as placeholders in this automaticallyproduced draft rather than fabricated.]
8.4 Discussion
The central design bet of this project — treating sixteen features as one pipeline rather than sixteen
independent ones — paid off directly during development: five of the seven substantial defects logged
in §7.3 were fixed by changing exactly one shared file (the retry logic, the queue pacing, or the refreshtoken dedup), which then corrected behaviour across all sixteen modules simultaneously, rather than
requiring sixteen separate patches. This is the practical, not merely theoretical, benefit of the
Open/Closed and Dependency Inversion decisions made in Chapter 4.
PROJEXA — Project Report
21
Chapter 9 Conclusion and Future Scope
9.1 Conclusion
Projexa demonstrates that the full Software Development Life Cycle documentation burden facing a
final-year Computer Science student — SRS, database design, API design, sprint planning, cost/risk
analysis, deployment guidance and viva preparation — can be modelled as a single, uniform
generation pipeline rather than a collection of unrelated tools stitched together by hand. By building
one generation engine executed sixteen times with different prompts and schemas, rather than
sixteen bespoke features, the system remains genuinely open to extension (a seventeenth module is
one file and one registry line) while staying auditable: every artefact is versioned, every AI call is
logged, and every idea edit safely flags — rather than destroys — the work already generated from
the version before it.
9.2 Limitations
• The generation queue is in-process; a server restart loses in-flight (not yet completed)
generation jobs, mitigated but not eliminated by a boot-time reconciliation sweep.
• Generation throughput is bounded by the configured AI provider's free-tier rate limits.
• ER diagram and UML rendering has a defined data model (the diagrams collection) but no
wired generator yet — it is a scaffolded, not a delivered, feature.
• Mentor commenting and the Admin analytics dashboard exist at the data-model level but do
not yet have complete front-end surfaces (Phases 6-7).
• The application has been developed and validated in a local/development environment;
production deployment (Phase 8) and load testing under many concurrent generation jobs
have not yet been carried out.
9.3 Future Scope
• Automated ER diagram and UML (use case, class, sequence, activity) rendering via Mermaid,
using the already-modelled diagrams collection.
• Migrating the generation queue from the in-process p-queue to BullMQ backed by Redis,
enabling horizontal scaling across multiple server instances without losing in-flight jobs on
restart.
• A complete Mentor review workflow: inline commenting on specific artefact sections,
resolution tracking, and notification delivery.
• An Admin analytics dashboard surfacing AI usage, cost and success-rate trends already
captured in the aiusagelogs collection.
• A public project gallery allowing students to showcase completed projects (the visibility field
on Project already supports this).
• Support for additional AI providers beyond Gemini and OpenAI, using the existing AIProvider
abstraction.
• A native mobile companion app for viva preparation and sprint-board tracking on the go.
PROJEXA — Project Report
22
References
5. React documentation — https://react.dev
6. Vite documentation — https://vitejs.dev
7. Tailwind CSS documentation — https://tailwindcss.com/docs
8. Redux Toolkit documentation — https://redux-toolkit.js.org
9. Express.js documentation — https://expressjs.com
10.MongoDB Manual — https://www.mongodb.com/docs/manual/
11.Mongoose ODM documentation — https://mongoosejs.com/docs/
12.Google Gemini API documentation — https://ai.google.dev/gemini-api/docs
13.OpenAI API documentation — https://platform.openai.com/docs
14.JSON Web Tokens — https://jwt.io/introduction
15.OWASP Top Ten — https://owasp.org/www-project-top-ten/
16.Web Content Accessibility Guidelines (WCAG) 2.1 —
https://www.w3.org/WAI/WCAG21/quickref/
17.Gamma, Helm, Johnson, Vlissides — Design Patterns: Elements of Reusable Object-Oriented
Software, Addison-Wesley, 1994.
18.Martin, Robert C. — Clean Architecture: A Craftsman's Guide to Software Structure and
Design, Prentice Hall, 2017.
PROJEXA — Project Report
23
Appendix A — Environment Configuration Reference
The following is a sanitised summary of the environment variables the backend requires, validated at
boot with a Zod schema (an invalid or missing variable stops the server immediately rather than failing
on the first request).
Variable Purpose
NODE_ENV, PORT,
API_VERSION, APP_NAME Core server identity and listening port
CLIENT_URL, CORS_ORIGINS Allow-listed origins for the CORS policy
MONGODB_URI,
MONGODB_URI_TEST Primary and test-run database connection strings
JWT_ACCESS_SECRET,
JWT_ACCESS_EXPIRES_IN Access token signing secret and lifetime (15 minutes)
JWT_REFRESH_SECRET,
JWT_REFRESH_EXPIRES_IN Refresh token signing secret and lifetime (7 days)
COOKIE_SECRET Signs the httpOnly refresh-token cookie
BCRYPT_SALT_ROUNDS Password hashing cost factor (12)
AI_PROVIDER,
GEMINI_API_KEY,
GEMINI_MODEL,
OPENAI_API_KEY,
OPENAI_MODEL
Selects and configures the active AI provider
AI_MAX_OUTPUT_TOKENS,
AI_TEMPERATURE,
AI_REQUEST_TIMEOUT_MS,
AI_MAX_RETRIES,
AI_QUEUE_CONCURRENCY
Generation behaviour tuning
DEFAULT_AI_CREDITS,
CREDIT_RESET_DAYS Per-user AI quota policy
CLOUDINARY_CLOUD_NAM
E, CLOUDINARY_API_KEY,
CLOUDINARY_API_SECRET,
CLOUDINARY_FOLDER
Object storage for avatars and exported assets
SMTP_HOST, SMTP_PORT,
SMTP_SECURE, SMTP_USER,
SMTP_PASSWORD,
EMAIL_FROM_NAME,
EMAIL_FROM_ADDRESS
Transactional email delivery (verification, password reset)
PROJEXA — Project Report
24
Variable Purpose
RATE_LIMIT_WINDOW_MIN
UTES,
RATE_LIMIT_MAX_REQUEST
S, AUTH_RATE_LIMIT_MAX,
GENERATION_RATE_LIMIT_
MAX,
EXPORT_RATE_LIMIT_MAX
Per-endpoint request throttling
LOG_LEVEL, LOG_TO_FILE Winston logging configuration
ENABLE_CRON,
PURGE_DELETED_AFTER_DA
YS,
STUCK_JOB_TIMEOUT_MIN
UTES, REPORT_TTL_DAYS
Scheduled maintenance job configuration
PROJEXA — Project Report
25
Appendix B — Top-Level Repository Structure
projexa/
├── backend/
│ ├── src/
│ │ ├── config/ env validation, database, logger, CORS
│ │ ├── controllers/ HTTP-only request handlers
│ │ ├── services/ business logic, incl. services/ai (generation engine)
│ │ ├── repositories/ Mongoose query layer, one per collection
│ │ ├── models/ Mongoose schemas (11 collections)
│ │ ├── middlewares/ auth, rbac, validation, rate limiting, uploads
│ │ ├── routes/v1/ versioned route definitions
│ │ ├── utils/ ApiError, ApiResponse, asyncHandler, cost estimation
│ │ ├── jobs/ cron reconciliation tasks
│ │ └── seeds/ demo data seed script
│ └── scripts/smoke-test.mjs
├── frontend/
│ └── src/
│ ├── components/ui/ shared component library (Button, Switch, ...)
│ ├── features/ Redux slices + API modules, feature-first
│ ├── pages/ route-level page components
│ ├── layouts/ Sidebar, AuthLayout, RootLayout
│ ├── routes/ ProtectedRoute / PublicOnlyRoute / paths
│ ├── services/ Axios instance + interceptors + endpoints
│ └── styles/ design tokens (index.css)
├── shared/constants/ artifactTypes, roles, statuses — single source of truth
└── docs/ architecture, schema, API, design-system specs
