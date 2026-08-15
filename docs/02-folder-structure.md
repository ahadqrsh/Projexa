# Projexa — 02. Folder Structure

> **Phase 1 · Document 2 of 7**
> Every file listed here has one reason to exist. Phase 2 onward creates them in this exact layout.

---

## 1. Repository Root (Monorepo)

A monorepo keeps the client and server in one Git history so an API change and its consumer land in the same commit. Vercel and Render each deploy from their own subdirectory via a **Root Directory** setting, so the monorepo costs nothing operationally.

```
projexa/
├── frontend/                   # React + Vite  → deployed to Vercel
├── backend/                    # Node + Express → deployed to Render
├── shared/                     # Constants & Zod schemas used by BOTH
│   ├── constants/
│   │   ├── artifactTypes.js    # single source of truth for the 20 module enums
│   │   ├── roles.js            # STUDENT | MENTOR | ADMIN
│   │   ├── domains.js          # Healthcare, Education, Finance, …
│   │   └── statuses.js         # project + generation + task statuses
│   └── schemas/
│       ├── auth.schema.js
│       └── project.schema.js   # Zod — RHF uses it client-side, validators server-side
├── docs/                       # Phase 1 documents (this folder)
│   ├── 01-architecture-and-tech-stack.md
│   ├── 02-folder-structure.md
│   ├── 03-database-schema.md
│   ├── 04-api-specification.md
│   ├── 05-user-flow-and-navigation.md
│   ├── 06-dashboard-and-design-system.md
│   └── 07-packages-and-environment.md
├── .github/
│   └── workflows/
│       ├── ci.yml              # lint + test on every PR
│       └── codeql.yml
├── .gitignore
├── .editorconfig
├── .nvmrc                      # 20
├── LICENSE
└── README.md
```

**Why `shared/` exists:** the artifact-type enum appears in the Mongoose schema, the validators, the generator registry, the Redux slice, the sidebar navigation and the report builder. Duplicating that list in six places guarantees it will drift. One file, imported by both apps, makes drift impossible.

---

## 2. Backend — `backend/`

### 2.1 Full Tree

```
backend/
├── src/
│   ├── config/
│   │   ├── env.js                    # loads + Zod-validates every env var, exits on failure
│   │   ├── database.js               # Mongoose connect, retry, event listeners
│   │   ├── cloudinary.js             # SDK configuration
│   │   ├── logger.js                 # Winston instance (JSON in prod, pretty in dev)
│   │   ├── corsOptions.js            # whitelist from env
│   │   ├── rateLimiters.js           # named limiters: auth, api, generation
│   │   └── constants.js              # HTTP codes, token TTLs, pagination defaults
│   │
│   ├── models/                       # Mongoose schemas ONLY — no business logic
│   │   ├── user.model.js
│   │   ├── project.model.js
│   │   ├── artifact.model.js
│   │   ├── diagram.model.js
│   │   ├── sprint.model.js
│   │   ├── task.model.js
│   │   ├── report.model.js
│   │   ├── comment.model.js
│   │   ├── notification.model.js
│   │   ├── aiUsageLog.model.js
│   │   ├── refreshToken.model.js
│   │   └── index.js                  # barrel export
│   │
│   ├── repositories/                 # data access — the ONLY place Mongoose is called
│   │   ├── base.repository.js        # generic CRUD + pagination, extended by all
│   │   ├── user.repository.js
│   │   ├── project.repository.js
│   │   ├── artifact.repository.js
│   │   ├── diagram.repository.js
│   │   ├── sprint.repository.js
│   │   ├── task.repository.js
│   │   ├── report.repository.js
│   │   ├── comment.repository.js
│   │   ├── notification.repository.js
│   │   └── aiUsageLog.repository.js
│   │
│   ├── services/                     # ALL business logic lives here
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── project.service.js
│   │   ├── artifact.service.js
│   │   ├── diagram.service.js
│   │   ├── sprint.service.js
│   │   ├── task.service.js
│   │   ├── comment.service.js
│   │   ├── notification.service.js
│   │   ├── analytics.service.js
│   │   │
│   │   ├── ai/                       # ── AI GENERATION SUBSYSTEM ──
│   │   │   ├── generation.service.js       # public entry point (quota, enqueue, status)
│   │   │   ├── GenerationQueue.js          # p-queue wrapper; swap for BullMQ later
│   │   │   ├── GeneratorRegistry.js        # artifactType → generator (Open/Closed)
│   │   │   ├── ResponseParser.js           # JSON extraction, repair, Zod validation
│   │   │   ├── ContextBuilder.js           # assembles dependsOn artifacts into prompt context
│   │   │   │
│   │   │   ├── providers/
│   │   │   │   ├── AIProvider.js           # abstract base — the interface
│   │   │   │   ├── GeminiProvider.js
│   │   │   │   ├── OpenAIProvider.js
│   │   │   │   └── providerFactory.js
│   │   │   │
│   │   │   ├── generators/
│   │   │   │   ├── BaseGenerator.js        # Template Method: build→call→parse→persist→log
│   │   │   │   ├── OverviewGenerator.js
│   │   │   │   ├── FeaturesGenerator.js
│   │   │   │   ├── SrsGenerator.js
│   │   │   │   ├── DatabaseDesignGenerator.js
│   │   │   │   ├── ApiDesignGenerator.js
│   │   │   │   ├── FolderStructureGenerator.js
│   │   │   │   ├── UiPlanGenerator.js
│   │   │   │   ├── SprintPlanGenerator.js
│   │   │   │   ├── DocumentationGenerator.js
│   │   │   │   ├── VivaPrepGenerator.js
│   │   │   │   ├── ErdGenerator.js
│   │   │   │   ├── UmlGenerator.js         # handles all 4 UML types via a param
│   │   │   │   ├── CostEstimationGenerator.js
│   │   │   │   ├── RiskAnalysisGenerator.js
│   │   │   │   ├── TechStackGenerator.js
│   │   │   │   ├── RoadmapGenerator.js
│   │   │   │   ├── GithubGuideGenerator.js
│   │   │   │   └── DeploymentGuideGenerator.js
│   │   │   │
│   │   │   └── prompts/
│   │   │       ├── system/basePersona.js
│   │   │       ├── system/outputContract.js   # the "return strict JSON" preamble
│   │   │       └── modules/                   # one <type>.prompt.js per generator
│   │   │           ├── overview.prompt.js
│   │   │           ├── srs.prompt.js
│   │   │           └── … (18 more)
│   │   │
│   │   ├── storage/
│   │   │   ├── StorageProvider.js          # abstract: upload / destroy
│   │   │   ├── CloudinaryProvider.js
│   │   │   └── storageFactory.js
│   │   │
│   │   ├── export/
│   │   │   ├── report.service.js           # orchestrates section assembly
│   │   │   ├── ReportExporter.js           # abstract
│   │   │   ├── PdfExporter.js              # puppeteer-core + @sparticuz/chromium
│   │   │   ├── DocxExporter.js             # docx library
│   │   │   └── templates/
│   │   │       ├── coverPage.template.js
│   │   │       └── reportBody.template.js
│   │   │
│   │   ├── diagram/
│   │   │   ├── MermaidRenderer.js          # mermaid-cli → PNG/SVG buffer
│   │   │   └── GraphvizRenderer.js
│   │   │
│   │   └── mail/
│   │       ├── mail.service.js
│   │       └── templates/                  # verifyEmail, resetPassword, mentorInvite
│   │
│   ├── controllers/                  # thin: read req → call ONE service → ApiResponse
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── project.controller.js
│   │   ├── generation.controller.js
│   │   ├── artifact.controller.js
│   │   ├── diagram.controller.js
│   │   ├── sprint.controller.js
│   │   ├── task.controller.js
│   │   ├── report.controller.js
│   │   ├── comment.controller.js
│   │   ├── notification.controller.js
│   │   ├── admin.controller.js
│   │   └── health.controller.js
│   │
│   ├── routes/
│   │   └── v1/
│   │       ├── index.js              # mounts every router under /api/v1
│   │       ├── auth.routes.js
│   │       ├── user.routes.js
│   │       ├── project.routes.js
│   │       ├── generation.routes.js  # mergeParams — nested under /projects/:projectId
│   │       ├── artifact.routes.js    # mergeParams
│   │       ├── diagram.routes.js     # mergeParams
│   │       ├── sprint.routes.js      # mergeParams
│   │       ├── task.routes.js
│   │       ├── report.routes.js      # mergeParams
│   │       ├── comment.routes.js     # mergeParams
│   │       ├── notification.routes.js
│   │       ├── admin.routes.js
│   │       └── health.routes.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js        # protect — verify access token
│   │   ├── rbac.middleware.js        # authorize(...roles)
│   │   ├── validate.middleware.js    # collects express-validator result → 422
│   │   ├── error.middleware.js       # THE centralised handler + notFound
│   │   ├── upload.middleware.js      # multer memoryStorage + mime/size filter
│   │   ├── rateLimit.middleware.js
│   │   ├── requestId.middleware.js   # UUID per request for traceable logs
│   │   ├── ownership.middleware.js   # loads a project and asserts access
│   │   └── quota.middleware.js       # AI credit gate
│   │
│   ├── validators/                   # express-validator chains, one file per resource
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── project.validator.js
│   │   ├── generation.validator.js
│   │   ├── artifact.validator.js
│   │   ├── sprint.validator.js
│   │   ├── task.validator.js
│   │   ├── report.validator.js
│   │   ├── comment.validator.js
│   │   └── common.validator.js       # isMongoId, pagination, sort
│   │
│   ├── utils/
│   │   ├── ApiError.js               # extends Error: statusCode, errors[], isOperational
│   │   ├── ApiResponse.js            # { success, statusCode, message, data, meta }
│   │   ├── asyncHandler.js           # removes try/catch from every controller
│   │   ├── jwt.util.js               # sign/verify access + refresh
│   │   ├── password.util.js          # hash/compare
│   │   ├── slug.util.js
│   │   ├── pagination.util.js
│   │   ├── hash.util.js              # SHA-256 for email tokens + project cache key
│   │   ├── sanitize.util.js
│   │   └── cost.util.js              # tokens → USD per model
│   │
│   ├── jobs/
│   │   ├── reconcileStuckArtifacts.job.js   # runs at boot: generating >5min → failed
│   │   ├── purgeDeletedProjects.job.js      # hard-delete after 30 days
│   │   └── scheduler.js                     # node-cron registrations
│   │
│   ├── app.js                        # Express instance, middleware, route mounting
│   └── server.js                     # entry: connect DB → start scheduler → listen
│
├── tests/
│   ├── setup.js                      # mongodb-memory-server lifecycle
│   ├── factories/                    # test data builders
│   ├── unit/services/
│   ├── unit/generators/
│   └── integration/routes/
│
├── .env.example
├── .env                              # gitignored
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── package.json
└── README.md
```

### 2.2 Why the Repository Layer Exists

Most MERN tutorials call `Model.find()` directly inside services. We do not, for three concrete reasons:

1. **Testability.** `project.service.test.js` mocks `projectRepository` and runs with no database at all. Milliseconds instead of seconds.
2. **Query reuse.** "Find non-deleted projects owned by user X, paginated, sorted" appears in the dashboard, the export flow and the admin panel. Defined once.
3. **Swappability.** If a collection later moves to Redis-backed caching or a read replica, only the repository changes.

`base.repository.js` provides `findById`, `findOne`, `findMany`, `create`, `updateById`, `deleteById`, `paginate`, `count`. Every concrete repository extends it and adds only its specialised queries — this is Interface Segregation applied to data access.

### 2.3 The `app.js` / `server.js` Split

They are separated deliberately. `app.js` exports a configured Express app with **no side effects** — no `listen`, no DB connection. That is what makes Supertest integration tests possible (`request(app).get(...)` with an in-memory Mongo). `server.js` owns all side effects: connect the database, run boot jobs, start the scheduler, bind the port, and register `SIGTERM` / `unhandledRejection` handlers for graceful shutdown.

---

## 3. Frontend — `frontend/`

### 3.1 Full Tree

The frontend is organised **feature-first**, not type-first. A folder like `components/` holding 60 unrelated files becomes unnavigable by week four. Grouping by feature means everything about projects lives under `features/projects/`, and deleting a feature is deleting one folder.

```
frontend/
├── public/
│   ├── favicon.svg
│   └── og-image.png
│
├── src/
│   ├── app/                           # application wiring
│   │   ├── store.js                   # configureStore + middleware
│   │   ├── rootReducer.js
│   │   ├── listenerMiddleware.js      # RTK listeners (e.g. auto-logout on 401)
│   │   └── App.jsx
│   │
│   ├── routes/
│   │   ├── index.jsx                  # createBrowserRouter tree
│   │   ├── ProtectedRoute.jsx         # requires auth
│   │   ├── RoleRoute.jsx              # requires role(s)
│   │   ├── PublicOnlyRoute.jsx        # redirects authed users away from /login
│   │   └── paths.js                   # ALL route strings as constants — no magic strings
│   │
│   ├── layouts/
│   │   ├── RootLayout.jsx             # Toaster + error boundary + scroll restoration
│   │   ├── AuthLayout.jsx             # split-screen branded auth pages
│   │   ├── MarketingLayout.jsx        # public navbar + footer
│   │   ├── DashboardLayout.jsx        # sidebar + topbar + <Outlet/>
│   │   └── ProjectWorkspaceLayout.jsx # project sub-nav rail + artifact panel
│   │
│   ├── components/                    # GENERIC + REUSABLE ONLY (feature-agnostic)
│   │   ├── ui/                        # the design-system primitives
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Textarea.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Checkbox.jsx
│   │   │   ├── RadioGroup.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Drawer.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Accordion.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   ├── Dropdown.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── ProgressRing.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Stepper.jsx
│   │   │   ├── CodeBlock.jsx          # syntax-highlighted + copy button
│   │   │   ├── MarkdownViewer.jsx
│   │   │   ├── FileTree.jsx           # renders FOLDER_STRUCTURE artifacts
│   │   │   ├── MermaidChart.jsx       # renders ERD/UML client-side
│   │   │   └── ConfirmDialog.jsx
│   │   ├── form/                      # RHF-bound wrappers over ui/
│   │   │   ├── FormProvider.jsx
│   │   │   ├── FormField.jsx
│   │   │   ├── FormInput.jsx
│   │   │   ├── FormSelect.jsx
│   │   │   ├── FormTextarea.jsx
│   │   │   ├── FormTagInput.jsx
│   │   │   ├── FormDatePicker.jsx
│   │   │   └── FormError.jsx
│   │   ├── feedback/
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ErrorFallback.jsx
│   │   │   ├── LoadingScreen.jsx
│   │   │   └── ServerWakingBanner.jsx  # Render cold-start UX
│   │   └── motion/
│   │       ├── FadeIn.jsx
│   │       ├── StaggerList.jsx
│   │       └── PageTransition.jsx
│   │
│   ├── features/                      # FEATURE SLICES — state + API + components
│   │   ├── auth/
│   │   │   ├── authSlice.js
│   │   │   ├── authApi.js
│   │   │   ├── components/LoginForm.jsx
│   │   │   ├── components/RegisterForm.jsx
│   │   │   ├── components/ForgotPasswordForm.jsx
│   │   │   ├── components/ResetPasswordForm.jsx
│   │   │   └── hooks/useAuth.js
│   │   ├── projects/
│   │   │   ├── projectSlice.js
│   │   │   ├── projectApi.js
│   │   │   ├── components/ProjectCard.jsx
│   │   │   ├── components/ProjectGrid.jsx
│   │   │   ├── components/ProjectFilters.jsx
│   │   │   ├── components/IdeaWizard/          # the 4-step Module 2 form
│   │   │   │   ├── IdeaWizard.jsx
│   │   │   │   ├── StepBasics.jsx
│   │   │   │   ├── StepContext.jsx
│   │   │   │   ├── StepPreferences.jsx
│   │   │   │   └── StepReview.jsx
│   │   │   ├── components/ProjectHeader.jsx
│   │   │   └── hooks/useProject.js
│   │   ├── generation/
│   │   │   ├── generationSlice.js
│   │   │   ├── generationApi.js
│   │   │   ├── components/GenerateAllButton.jsx
│   │   │   ├── components/ModuleSelector.jsx
│   │   │   ├── components/GenerationProgress.jsx
│   │   │   ├── components/StaleBanner.jsx
│   │   │   └── hooks/useGenerationStatus.js    # polling / SSE
│   │   ├── artifacts/
│   │   │   ├── artifactSlice.js
│   │   │   ├── artifactApi.js
│   │   │   ├── components/ArtifactPanel.jsx
│   │   │   ├── components/ArtifactToolbar.jsx  # regenerate · edit · copy · version
│   │   │   ├── components/VersionHistory.jsx
│   │   │   └── renderers/                      # ONE renderer per artifact type
│   │   │       ├── index.js                    # rendererRegistry — mirrors backend registry
│   │   │       ├── OverviewRenderer.jsx
│   │   │       ├── FeaturesRenderer.jsx
│   │   │       ├── SrsRenderer.jsx
│   │   │       ├── DatabaseDesignRenderer.jsx
│   │   │       ├── ApiDesignRenderer.jsx
│   │   │       ├── FolderStructureRenderer.jsx
│   │   │       ├── UiPlanRenderer.jsx
│   │   │       ├── CostEstimationRenderer.jsx
│   │   │       ├── RiskAnalysisRenderer.jsx
│   │   │       ├── TechStackRenderer.jsx
│   │   │       ├── RoadmapRenderer.jsx
│   │   │       ├── DocumentationRenderer.jsx
│   │   │       ├── VivaPrepRenderer.jsx
│   │   │       ├── GithubGuideRenderer.jsx
│   │   │       └── DeploymentGuideRenderer.jsx
│   │   ├── diagrams/
│   │   │   ├── diagramSlice.js
│   │   │   ├── diagramApi.js
│   │   │   ├── components/DiagramViewer.jsx
│   │   │   ├── components/DiagramSourceEditor.jsx
│   │   │   └── components/DiagramExportMenu.jsx
│   │   ├── sprints/
│   │   │   ├── sprintSlice.js
│   │   │   ├── sprintApi.js
│   │   │   ├── components/SprintTimeline.jsx
│   │   │   ├── components/SprintBoard.jsx
│   │   │   ├── components/TaskItem.jsx
│   │   │   └── components/TaskDrawer.jsx
│   │   ├── reports/
│   │   │   ├── reportSlice.js
│   │   │   ├── reportApi.js
│   │   │   ├── components/ReportBuilder.jsx    # section checklist
│   │   │   └── components/ReportHistory.jsx
│   │   ├── comments/
│   │   │   ├── commentSlice.js
│   │   │   ├── commentApi.js
│   │   │   └── components/CommentThread.jsx
│   │   ├── notifications/
│   │   │   ├── notificationSlice.js
│   │   │   ├── notificationApi.js
│   │   │   └── components/NotificationBell.jsx
│   │   └── admin/
│   │       ├── adminApi.js
│   │       ├── components/StatCard.jsx
│   │       ├── components/UsersTable.jsx
│   │       └── components/AiUsageChart.jsx
│   │
│   ├── pages/                         # route-level components — composition only
│   │   ├── marketing/LandingPage.jsx
│   │   ├── marketing/PricingPage.jsx
│   │   ├── marketing/ExplorePage.jsx
│   │   ├── auth/LoginPage.jsx
│   │   ├── auth/RegisterPage.jsx
│   │   ├── auth/ForgotPasswordPage.jsx
│   │   ├── auth/ResetPasswordPage.jsx
│   │   ├── auth/VerifyEmailPage.jsx
│   │   ├── dashboard/DashboardPage.jsx
│   │   ├── dashboard/ProjectsPage.jsx
│   │   ├── dashboard/NewProjectPage.jsx
│   │   ├── dashboard/ProfilePage.jsx
│   │   ├── dashboard/SettingsPage.jsx
│   │   ├── dashboard/NotificationsPage.jsx
│   │   ├── workspace/WorkspaceOverviewPage.jsx
│   │   ├── workspace/ArtifactPage.jsx          # /:projectId/module/:type — one page, N renderers
│   │   ├── workspace/DiagramsPage.jsx
│   │   ├── workspace/SprintsPage.jsx
│   │   ├── workspace/ReportPage.jsx
│   │   ├── workspace/VivaPage.jsx
│   │   ├── mentor/MentorDashboardPage.jsx
│   │   ├── mentor/ReviewProjectPage.jsx
│   │   ├── admin/AdminOverviewPage.jsx
│   │   ├── admin/AdminUsersPage.jsx
│   │   ├── admin/AdminProjectsPage.jsx
│   │   ├── admin/AdminAiUsagePage.jsx
│   │   └── errors/NotFoundPage.jsx
│   │
│   ├── services/
│   │   ├── axiosInstance.js           # baseURL, withCredentials, timeout
│   │   ├── interceptors.js            # attach token · refresh on 401 · normalise errors
│   │   └── endpoints.js               # every URL string, one place
│   │
│   ├── hooks/                         # generic, feature-agnostic
│   │   ├── useDebounce.js
│   │   ├── useMediaQuery.js
│   │   ├── useClickOutside.js
│   │   ├── useLocalPreference.js      # theme, sidebar collapsed
│   │   ├── useCopyToClipboard.js
│   │   ├── usePolling.js
│   │   └── useDocumentTitle.js
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── formatCurrency.js
│   │   ├── cn.js                      # clsx + tailwind-merge
│   │   ├── downloadFile.js
│   │   └── constants.js
│   │
│   ├── styles/
│   │   ├── index.css                  # Tailwind directives + CSS custom properties
│   │   └── mermaid.theme.js
│   │
│   └── main.jsx
│
├── .env.example
├── .env.local                         # gitignored
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── vercel.json                        # SPA rewrite
└── package.json
```

### 3.2 The `features/` vs `components/` vs `pages/` Rule

This is the rule that keeps the frontend from rotting. It is enforced in code review:

| Folder | Contains | Test |
|---|---|---|
| `components/ui` | Knows nothing about this app. `Button`, `Modal`, `Table`. | *Could I copy this file into an unrelated project unchanged?* If yes → `components/ui`. |
| `features/<x>` | Knows about one domain. Owns its slice, its API calls, its components. | *Does this only make sense when talking about projects/sprints/artifacts?* If yes → that feature. |
| `pages` | Knows about routing and composition. Imports from features and layouts, contains almost no JSX logic of its own. | *Is this thing mounted by a route?* If yes → `pages`. |

**A page never contains business logic.** `ArtifactPage.jsx` reads `:type` from the URL, dispatches a fetch, and hands the result to `<ArtifactPanel/>`. That is its entire job — roughly 30 lines.

### 3.3 The Renderer Registry — Open/Closed on the Frontend

`features/artifacts/renderers/index.js` mirrors the backend's `GeneratorRegistry`:

```js
export const rendererRegistry = {
  OVERVIEW: OverviewRenderer,
  SRS: SrsRenderer,
  DATABASE_DESIGN: DatabaseDesignRenderer,
  // …
};
```

`ArtifactPanel` looks up `rendererRegistry[artifact.type]` and renders it. There is **no switch statement and no if-else chain anywhere in the UI**. Adding a new module means adding one renderer file and one registry line — the panel, the routing, the toolbar and the sidebar all keep working untouched. This symmetry between backend and frontend registries is intentional and is the single most important structural idea in the client.

### 3.4 Redux Slice Boundaries

| Slice | Holds | Deliberately excluded |
|---|---|---|
| `auth` | user, accessToken, status | Never the refresh token (it lives in an httpOnly cookie) |
| `projects` | list, filters, pagination, activeProject | Artifact bodies |
| `artifacts` | `{ [projectId]: { [type]: artifact } }` normalised | Draft edit text (component-local until save) |
| `generation` | `{ [projectId]: { jobId, progress, modules } }` | — |
| `sprints` | sprints + tasks, normalised by id | — |
| `notifications` | items, unreadCount | — |
| `ui` | theme, sidebarCollapsed, active modal | Anything server-derived |

**Rule:** transient UI state (is this dropdown open, what is in this uncommitted textarea) stays in `useState`. Redux holds only state that is shared across routes or survives navigation. Putting everything in Redux is the most common way these projects become unmaintainable.

---

## 4. Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Backend files | `camelCase.layer.js` | `project.service.js`, `auth.middleware.js` |
| Backend classes | `PascalCase` | `BaseGenerator`, `ApiError` |
| React components | `PascalCase.jsx` | `ProjectCard.jsx` |
| Hooks | `useCamelCase.js` | `useGenerationStatus.js` |
| Redux slices | `<feature>Slice.js` | `projectSlice.js` |
| Mongoose models | singular PascalCase, file `x.model.js` | `Project` in `project.model.js` |
| Collections | lowercase plural (Mongoose default) | `projects`, `artifacts` |
| Constants / enums | `SCREAMING_SNAKE_CASE` | `ARTIFACT_TYPES.DATABASE_DESIGN` |
| Env vars | `SCREAMING_SNAKE_CASE`, client prefixed `VITE_` | `VITE_API_BASE_URL` |
| Routes | kebab-case plural nouns | `/api/v1/projects/:id/artifacts` |
| Branches | `type/short-description` | `feat/sprint-planner` |
| Commits | Conventional Commits | `feat(generation): add ERD generator` |

---

**Previous:** [01 — Architecture](./01-architecture-and-tech-stack.md) · **Next:** [03 — Database Schema](./03-database-schema.md)
