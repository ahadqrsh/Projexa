/**
 * Deterministic fixtures for MockProvider.
 *
 * Each fixture must satisfy the SAME Zod outputSchema as the real provider's
 * response — that is the point. If a fixture drifts from its schema, the mock
 * pipeline fails exactly like a bad Gemini response would, which is precisely
 * the failure path we want covered in tests.
 */

const titleOf = (project) => project?.title ?? 'Your Project';
const domainOf = (project) => project?.domain ?? 'other';

const fixtures = {
  OVERVIEW: (p) => ({
    objective: `Build ${titleOf(p)}, a ${domainOf(p)} platform that solves a clearly scoped real-world problem for its target users.`,
    scope: 'A full-stack web application covering authentication, role-based dashboards, core CRUD workflows, reporting and deployment. Native mobile applications are out of scope for this release.',
    targetUsers: ['Administrators', 'Staff users', 'End customers'],
    realWorldProblem: `Organisations in the ${domainOf(p)} sector still rely on manual, paper-based or spreadsheet workflows, which are slow, error-prone and impossible to audit.`,
    expectedOutcome: 'A deployed, documented application that reduces manual effort, provides an auditable record of every action, and can be demonstrated end to end.',
    keyBenefits: [
      'Removes manual data entry and the errors that come with it',
      'Gives every role a dashboard scoped to what they actually need',
      'Produces auditable records for compliance and reporting',
    ],
  }),

  FEATURES: () => ({
    roles: [
      {
        role: 'Admin',
        features: [
          { name: 'User management', description: 'Create, deactivate and assign roles to every account in the system.', priority: 'high' },
          { name: 'Analytics dashboard', description: 'Aggregate usage, throughput and status metrics across the platform.', priority: 'medium' },
          { name: 'Audit log', description: 'Immutable record of privileged actions with actor, timestamp and target.', priority: 'medium' },
        ],
      },
      {
        role: 'Staff',
        features: [
          { name: 'Record management', description: 'Create, search, update and archive the core domain records.', priority: 'high' },
          { name: 'Scheduling', description: 'View availability and book, reschedule or cancel slots.', priority: 'high' },
          { name: 'Notes and attachments', description: 'Attach files and structured notes to any record.', priority: 'low' },
        ],
      },
      {
        role: 'Customer',
        features: [
          { name: 'Self-service booking', description: 'Browse availability and book without contacting staff.', priority: 'high' },
          { name: 'History', description: 'View a complete personal history of past interactions.', priority: 'medium' },
          { name: 'Payments', description: 'Pay online and download receipts.', priority: 'medium' },
        ],
      },
    ],
  }),

  TECH_STACK: (p) => ({
    frontend: ['React 18', 'Vite', 'TailwindCSS', 'Redux Toolkit', 'React Router'],
    backend: ['Node.js 20', 'Express 4', 'JWT authentication'],
    database: ['MongoDB Atlas', 'Mongoose ODM'],
    aiModels: p?.aiIntegrationRequired ? ['Gemini 1.5 Flash'] : [],
    deployment: ['Vercel (client)', 'Render (API)', 'MongoDB Atlas', 'Cloudinary'],
    authentication: ['JWT access tokens', 'Rotating refresh tokens', 'bcrypt password hashing'],
    rationale: 'The MERN stack keeps one language across the whole system, which materially reduces context switching for a small team. MongoDB suits the semi-structured, evolving records this domain produces, and both hosting platforms have free tiers adequate for an academic deployment.',
    alternativesConsidered: [
      'PostgreSQL — stronger relational guarantees, but the schema here evolves too often during development to be worth the migration overhead.',
      'Next.js — excellent SSR, but adds a rendering model the team does not need for an authenticated dashboard product.',
    ],
  }),

  SRS: () => ({
    functional: [
      { id: 'FR-01', title: 'User authentication', description: 'The system shall allow users to register and sign in with an email and password, issuing a short-lived access token and a rotating refresh token.', priority: 'high' },
      { id: 'FR-02', title: 'Role-based access control', description: 'The system shall restrict every route and action according to the authenticated user role.', priority: 'high' },
      { id: 'FR-03', title: 'Record CRUD', description: 'Authorised users shall be able to create, read, update and archive core domain records.', priority: 'high' },
      { id: 'FR-04', title: 'Search and filtering', description: 'The system shall support paginated search across records with filters for status and date range.', priority: 'medium' },
      { id: 'FR-05', title: 'Reporting', description: 'The system shall generate downloadable summary reports for a selected period.', priority: 'medium' },
      { id: 'FR-06', title: 'Notifications', description: 'The system shall notify users in-app when an action requires their attention.', priority: 'low' },
    ],
    nonFunctional: [
      { category: 'Security', requirement: 'All traffic must use TLS; passwords must be hashed with bcrypt at cost factor 12 or higher; no credential may be stored in plaintext.', metric: 'Zero plaintext credentials at rest' },
      { category: 'Performance', requirement: 'Primary list endpoints must respond quickly under expected concurrent load.', metric: 'p95 latency under 400 ms at 100 concurrent users' },
      { category: 'Scalability', requirement: 'The API must be stateless so instances can be added horizontally behind a load balancer.', metric: 'No in-process session state' },
      { category: 'Reliability', requirement: 'The service must recover automatically from transient database disconnections.', metric: '99.5% monthly uptime target' },
      { category: 'Usability', requirement: 'All interactive elements must be keyboard reachable and meet WCAG AA contrast.', metric: 'WCAG 2.1 AA' },
    ],
  }),

  DATABASE_DESIGN: () => ({
    collections: [
      {
        name: 'users',
        purpose: 'Every human account, discriminated by role.',
        fields: [
          { name: '_id', type: 'ObjectId', required: true, description: 'Primary key' },
          { name: 'name', type: 'String', required: true, description: 'Display name' },
          { name: 'email', type: 'String', required: true, description: 'Unique login identity' },
          { name: 'password', type: 'String', required: true, description: 'bcrypt hash, never selected by default' },
          { name: 'role', type: 'String', required: true, description: 'admin | staff | customer' },
          { name: 'createdAt', type: 'Date', required: true, description: 'Timestamp' },
        ],
      },
      {
        name: 'records',
        purpose: 'The core domain entity managed by staff.',
        fields: [
          { name: '_id', type: 'ObjectId', required: true, description: 'Primary key' },
          { name: 'owner', type: 'ObjectId', required: true, description: 'Reference to users' },
          { name: 'title', type: 'String', required: true, description: 'Human-readable label' },
          { name: 'status', type: 'String', required: true, description: 'Lifecycle state' },
          { name: 'createdAt', type: 'Date', required: true, description: 'Timestamp' },
        ],
      },
      {
        name: 'appointments',
        purpose: 'Scheduled slots linking a customer to a staff member.',
        fields: [
          { name: '_id', type: 'ObjectId', required: true, description: 'Primary key' },
          { name: 'customer', type: 'ObjectId', required: true, description: 'Reference to users' },
          { name: 'staff', type: 'ObjectId', required: true, description: 'Reference to users' },
          { name: 'scheduledFor', type: 'Date', required: true, description: 'Slot start time' },
          { name: 'status', type: 'String', required: true, description: 'booked | completed | cancelled' },
        ],
      },
    ],
    relationships: [
      { from: 'records', to: 'users', type: 'many-to-one', description: 'Each record is owned by exactly one user; a user may own many records.' },
      { from: 'appointments', to: 'users', type: 'many-to-one', description: 'Each appointment references one customer and one staff member.' },
    ],
  }),

  API_DESIGN: () => ({
    groups: [
      {
        resource: 'auth',
        endpoints: [
          {
            method: 'POST',
            path: '/api/v1/auth/register',
            auth: 'public',
            description: 'Create an account and issue tokens.',
            requestExample: '{ "name": "Asha R", "email": "asha@example.com", "password": "Str0ng#Pass" }',
            responseExample: '{ "success": true, "data": { "user": { "_id": "..." }, "accessToken": "..." } }',
            statusCodes: [201, 409, 422],
          },
          {
            method: 'POST',
            path: '/api/v1/auth/login',
            auth: 'public',
            description: 'Authenticate and issue tokens.',
            requestExample: '{ "email": "asha@example.com", "password": "Str0ng#Pass" }',
            responseExample: '{ "success": true, "data": { "accessToken": "..." } }',
            statusCodes: [200, 401, 422],
          },
        ],
      },
      {
        resource: 'records',
        endpoints: [
          {
            method: 'GET',
            path: '/api/v1/records',
            auth: 'required',
            description: 'Paginated list of records with filters.',
            requestExample: '?page=1&limit=12&status=open',
            responseExample: '{ "success": true, "data": { "records": [] }, "meta": { "total": 0 } }',
            statusCodes: [200, 401],
          },
          {
            method: 'POST',
            path: '/api/v1/records',
            auth: 'required',
            description: 'Create a record.',
            requestExample: '{ "title": "New record", "status": "open" }',
            responseExample: '{ "success": true, "data": { "record": { "_id": "..." } } }',
            statusCodes: [201, 401, 422],
          },
          {
            method: 'DELETE',
            path: '/api/v1/records/:id',
            auth: 'required',
            description: 'Archive a record.',
            requestExample: '—',
            responseExample: '204 No Content',
            statusCodes: [204, 401, 403, 404],
          },
        ],
      },
    ],
  }),

  FOLDER_STRUCTURE: () => ({
    frontend: {
      root: 'frontend',
      entries: [
        { path: 'src', type: 'folder', purpose: 'All application source code.' },
        { path: 'src/app', type: 'folder', purpose: 'Redux store configuration and the root App component.' },
        { path: 'src/features', type: 'folder', purpose: 'One folder per domain: slice, API calls and feature-specific components.' },
        { path: 'src/components/ui', type: 'folder', purpose: 'Reusable, app-agnostic design-system primitives.' },
        { path: 'src/pages', type: 'folder', purpose: 'Route-level components that compose features — no business logic.' },
        { path: 'src/services/axiosInstance.js', type: 'file', purpose: 'Configured Axios client with interceptors.' },
        { path: 'src/main.jsx', type: 'file', purpose: 'Application entry point.' },
      ],
    },
    backend: {
      root: 'backend',
      entries: [
        { path: 'src', type: 'folder', purpose: 'All server source code.' },
        { path: 'src/models', type: 'folder', purpose: 'Mongoose schemas only — no business logic.' },
        { path: 'src/repositories', type: 'folder', purpose: 'The only place Mongoose queries are written.' },
        { path: 'src/services', type: 'folder', purpose: 'All business logic, zero HTTP awareness.' },
        { path: 'src/controllers', type: 'folder', purpose: 'Thin HTTP layer: parse request, call one service, shape response.' },
        { path: 'src/routes', type: 'folder', purpose: 'Express routers, one file per resource.' },
        { path: 'src/middlewares', type: 'folder', purpose: 'Auth, validation, rate limiting, error handling.' },
        { path: 'src/server.js', type: 'file', purpose: 'Process entry point — owns every side effect.' },
      ],
    },
    conventions: [
      'A file has one reason to change — controllers never query the database directly.',
      'Feature folders on the frontend own their slice, API calls and components together.',
      'Shared, app-agnostic UI lives in components/ui; anything domain-specific lives in features/.',
      'Business rules live in backend services only, never in controllers or route handlers.',
    ],
  }),

  ROADMAP: (p) => ({
    totalWeeks: 12,
    weeks: [
      {
        weekNumber: 1,
        title: 'Project setup & environment',
        goal: 'Repositories, tooling and a deployed skeleton exist for both apps.',
        deliverables: ['Git repo initialised', 'Backend and frontend boot locally', 'CI lint check passing'],
        tasks: [
          { title: 'Scaffold backend project structure', category: 'setup', estimatedHours: 4 },
          { title: 'Scaffold frontend project structure', category: 'setup', estimatedHours: 4 },
          { title: 'Configure environment variables', category: 'setup', estimatedHours: 2 },
        ],
      },
      {
        weekNumber: 2,
        title: 'Authentication',
        goal: 'Users can register, log in and stay logged in across a refresh.',
        deliverables: ['Register/login endpoints', 'JWT issuance and refresh', 'Login/register pages'],
        tasks: [
          { title: 'Build user model and auth service', category: 'backend', estimatedHours: 8 },
          { title: 'Build login and register pages', category: 'frontend', estimatedHours: 6 },
        ],
      },
      {
        weekNumber: 6,
        title: `Core ${p?.domain ?? 'domain'} features`,
        goal: 'The primary workflow described in the project idea works end to end.',
        deliverables: ['CRUD for the core entity', 'Role-based dashboards'],
        tasks: [
          { title: 'Implement core CRUD API', category: 'backend', estimatedHours: 10 },
          { title: 'Build core workflow UI', category: 'frontend', estimatedHours: 10 },
        ],
      },
      {
        weekNumber: 12,
        title: 'Testing, polish & submission',
        goal: 'The application is stable, documented and ready to demo.',
        deliverables: ['Test suite passing', 'README complete', 'Deployed to production'],
        tasks: [
          { title: 'Fix bugs found during testing', category: 'testing', estimatedHours: 8 },
          { title: 'Deploy both apps', category: 'deployment', estimatedHours: 4 },
          { title: 'Write final documentation', category: 'documentation', estimatedHours: 4 },
        ],
      },
    ],
    milestones: [
      { weekNumber: 2, title: 'Authentication working end-to-end' },
      { weekNumber: 6, title: 'Core workflow demonstrable' },
      { weekNumber: 12, title: 'Final submission ready' },
    ],
  }),

  VIVA_PREP: (p) => ({
    categories: [
      {
        category: 'technical',
        questions: [
          {
            question: 'Why did you choose JWT with refresh token rotation instead of session-based authentication?',
            modelAnswer:
              'JWTs are stateless, so the API can scale horizontally without a shared session store. Refresh token rotation mitigates the main weakness of stateless tokens — that they cannot normally be revoked — by detecting reuse and revoking the entire token family if a rotated token is replayed.',
            difficulty: 'medium',
          },
          {
            question: 'How does your application handle a failed AI generation request?',
            modelAnswer:
              'Each module is generated independently. If one fails, only that artifact is marked failed with an error message; the rest of the batch continues. The user can retry the single failed module without losing or re-paying for the ones that succeeded.',
            difficulty: 'medium',
          },
          {
            question: 'Why is business logic kept in a service layer instead of directly in the controllers?',
            modelAnswer:
              'Controllers stay HTTP-only — parse the request, call one service, shape the response. Services contain no knowledge of req/res, which makes them testable without spinning up a server and reusable if a second interface (e.g. a CLI or scheduled job) needs the same logic.',
            difficulty: 'easy',
          },
        ],
      },
      {
        category: 'conceptual',
        questions: [
          {
            question: 'What is the difference between authentication and authorization, and where does each happen in your system?',
            modelAnswer:
              'Authentication confirms who the user is — handled by verifying the JWT in the auth middleware. Authorization confirms what they are allowed to do — handled separately by role checks and ownership checks, since a valid token alone does not imply permission for a specific action.',
            difficulty: 'easy',
          },
          {
            question: 'Why use a NoSQL document database here instead of a relational one?',
            modelAnswer:
              'The data is semi-structured and evolves quickly during development — adding a field does not require a migration. MongoDB documents map naturally onto the JSON the AI provider already returns, so no transformation layer is needed between generation and storage.',
            difficulty: 'medium',
          },
          {
            question: 'What is database indexing and where would it matter most in this system?',
            modelAnswer:
              'An index lets the database locate matching documents without scanning the whole collection. It matters most on fields used in frequent lookups or sorts — for example a foreign-key-style reference field, or a field used to paginate a large list — where a full collection scan would otherwise get slower as data grows.',
            difficulty: 'medium',
          },
        ],
      },
      {
        category: 'project_specific',
        questions: [
          {
            question: `Why does the ${p?.title ?? 'project'} database use separate collections rather than embedding related data?`,
            modelAnswer:
              'The related entities are queried and updated independently and can grow without bound, which makes embedding impractical in MongoDB — embedded arrays have a 16MB document limit and every update to one embedded item rewrites the whole parent document.',
            difficulty: 'hard',
          },
          {
            question: `Walk me through what happens end to end when a user submits the core action in ${p?.title ?? 'this project'}.`,
            modelAnswer:
              'The request hits a validated route, passes through auth and ownership middleware, reaches a thin controller that calls exactly one service method, and that service applies the business rules and persists through the repository layer before a shaped response goes back to the client.',
            difficulty: 'medium',
          },
          {
            question: 'What was the single hardest design decision in this project, and what alternative did you reject?',
            modelAnswer:
              'A strong answer names one real trade-off actually made in the project — for example choosing an in-process queue over a dedicated job broker for a lower-scale academic deployment — and explains concretely what was gained and given up, rather than describing an idealised alternative never seriously considered.',
            difficulty: 'hard',
          },
        ],
      },
      {
        category: 'viva_etiquette',
        questions: [
          {
            question: 'An examiner asks about a design decision you cannot fully remember the reasoning for. How do you respond?',
            modelAnswer:
              'State what you do remember confidently, acknowledge the specific gap honestly rather than guessing, and reason through it live from first principles — examiners generally credit sound reasoning under pressure over a rehearsed answer.',
            difficulty: 'medium',
          },
          {
            question: 'How should you respond if an examiner points out a genuine flaw in your design?',
            modelAnswer:
              'Acknowledge it directly rather than being defensive, then explain the constraint that led to the decision and what you would do differently with more time or a different scope — examiners are usually testing self-awareness, not looking for a perfect system.',
            difficulty: 'easy',
          },
          {
            question: 'What is the most effective way to open your project explanation in the first two minutes of a viva?',
            modelAnswer:
              'Lead with the real-world problem being solved and who it is for, before touching any technology — examiners form an impression of whether you understand your own project from how you frame it, not from how quickly you mention the tech stack.',
            difficulty: 'easy',
          },
        ],
      },
    ],
  }),

  UI_PLAN: () => ({
    screens: [
      { name: 'Login', purpose: 'Authenticate an existing user.', keyComponents: ['email field', 'password field', 'submit button'], userRoles: ['Admin', 'Staff', 'Customer'] },
      { name: 'Register', purpose: 'Create a new account.', keyComponents: ['registration form', 'validation messages'], userRoles: ['Customer'] },
      { name: 'Admin dashboard', purpose: 'Overview of platform-wide metrics.', keyComponents: ['stat cards', 'activity chart', 'quick links'], userRoles: ['Admin'] },
      { name: 'Record list', purpose: 'Browse, search and filter core domain records.', keyComponents: ['data table with filters', 'pagination', 'create button'], userRoles: ['Staff', 'Admin'] },
      { name: 'Record detail', purpose: 'View and edit a single record.', keyComponents: ['detail card', 'edit form', 'activity timeline'], userRoles: ['Staff', 'Admin'] },
      { name: 'Booking flow', purpose: 'Let a customer self-serve a booking.', keyComponents: ['availability calendar', 'confirmation modal'], userRoles: ['Customer'] },
    ],
    designSystem: {
      colorPalette: ['primary — brand actions and links', 'accent — highlights and badges', 'neutral — text and surfaces', 'danger — destructive actions'],
      typography: 'A single sans-serif type family (e.g. Inter) with a clear three-tier scale — headings, body and caption — to keep dashboards scannable at a glance.',
      componentLibrary: 'shadcn/ui',
    },
    userFlows: [
      {
        name: 'Customer books a slot',
        steps: ['Log in', 'Open the booking screen', 'Pick an available slot', 'Confirm details', 'Receive confirmation'],
      },
      {
        name: 'Staff resolves a record',
        steps: ['Open the record list', 'Filter to open records', 'Open a record', 'Update its status', 'Save'],
      },
    ],
  }),

  SPRINT_PLAN: () => ({
    sprintLengthWeeks: 2,
    sprints: [
      {
        sprintNumber: 1,
        goal: 'Project scaffolding and authentication working end to end.',
        backlog: [
          { title: 'Scaffold backend and frontend projects', storyPoints: 3, relatedFeature: 'infrastructure' },
          { title: 'Implement register/login/refresh', storyPoints: 8, relatedFeature: 'User management' },
        ],
      },
      {
        sprintNumber: 2,
        goal: 'Core record CRUD workflow is usable end to end.',
        backlog: [
          { title: 'Build record CRUD API', storyPoints: 8, relatedFeature: 'Record management' },
          { title: 'Build record list and detail pages', storyPoints: 8, relatedFeature: 'Record management' },
        ],
      },
      {
        sprintNumber: 3,
        goal: 'Self-service booking flow is complete.',
        backlog: [
          { title: 'Build availability and booking API', storyPoints: 5, relatedFeature: 'Self-service booking' },
          { title: 'Build booking flow UI', storyPoints: 5, relatedFeature: 'Self-service booking' },
        ],
      },
      {
        sprintNumber: 6,
        goal: 'Testing, polish and submission prep.',
        backlog: [
          { title: 'Fix bugs found during QA', storyPoints: 5, relatedFeature: 'technical debt' },
          { title: 'Write final documentation', storyPoints: 3, relatedFeature: 'technical debt' },
        ],
      },
    ],
  }),

  DOCUMENTATION: (p) => ({
    readme: {
      title: titleOf(p),
      description: `${titleOf(p)} is a full-stack ${domainOf(p)} platform covering authentication, role-based dashboards, core record workflows and reporting, built to be demoed and deployed end to end.`,
      installationSteps: [
        'git clone <repo-url> && cd project',
        'cd backend && npm install && cp .env.example .env',
        'cd ../frontend && npm install && cp .env.example .env',
        'npm run dev in both backend and frontend',
      ],
      usageInstructions: [
        'Register an account or log in with the seeded demo credentials.',
        'Use the dashboard to create and manage records.',
        'Use the AI generation panel on a project to produce SDLC documentation.',
      ],
    },
    sections: [
      { heading: 'Architecture Overview', content: 'A MERN stack with a clear layering on the backend — routes call controllers, controllers call services, services call repositories — and a feature-first structure on the frontend where each domain owns its Redux slice, API calls and components.' },
      { heading: 'Environment Variables', content: 'Both apps read configuration from a validated .env file at boot; missing required variables fail fast with a clear error rather than surfacing as a confusing runtime bug later.' },
      { heading: 'Folder Structure', content: 'The backend separates models, repositories, services, controllers and routes so that a single responsibility change (e.g. swapping the database) never touches HTTP-layer code.' },
      { heading: 'API Overview', content: 'All endpoints are versioned under /api/v1, return a consistent success envelope, and are protected by JWT auth middleware where required.' },
      { heading: 'Known Limitations', content: 'Real-time collaboration and native mobile clients are out of scope for this release; the roadmap defers them to a future iteration.' },
    ],
  }),

  COST_ESTIMATION: () => ({
    currency: 'USD',
    items: [
      { category: 'hosting', name: 'Vercel (frontend)', estimatedCost: 0, billingCycle: 'monthly', notes: 'Free Hobby tier covers a student project comfortably.' },
      { category: 'hosting', name: 'Render (backend)', estimatedCost: 0, billingCycle: 'monthly', notes: 'Free web service tier; spins down when idle, which is acceptable for a demo.' },
      { category: 'hosting', name: 'MongoDB Atlas', estimatedCost: 0, billingCycle: 'monthly', notes: 'M0 free cluster, 512MB storage, sufficient for development and a viva demo.' },
      { category: 'tools', name: 'Cloudinary', estimatedCost: 0, billingCycle: 'monthly', notes: 'Free tier covers image uploads for a project of this scale.' },
      { category: 'apis', name: 'Gemini API', estimatedCost: 0, billingCycle: 'monthly', notes: 'Free tier quota is sufficient for iterative development and a live demo.' },
      { category: 'other', name: 'Custom domain', estimatedCost: 12, billingCycle: 'yearly', notes: 'Optional — only needed if a branded URL is wanted for submission.' },
    ],
    totalMonthlyCost: 0,
    totalOneTimeCost: 0,
    freeTierNotes: 'Every core service (hosting, database, image storage, AI API) has a free tier that comfortably covers development and a viva demonstration; the only realistic cost is an optional custom domain.',
  }),

  RISK_ANALYSIS: () => ({
    risks: [
      { title: 'Gemini API quota exhaustion during a demo', category: 'external', likelihood: 'medium', impact: 'high', mitigation: 'Keep a mock-provider fallback wired in so a demo can continue on canned output if the live quota is hit.' },
      { title: 'Scope creep beyond what the team can build in the timeline', category: 'scope', likelihood: 'high', impact: 'medium', mitigation: 'Lock the feature list after the roadmap is generated and treat anything new as a stretch goal, not a requirement.' },
      { title: 'Uneven task distribution across a small team', category: 'resource', likelihood: 'medium', impact: 'medium', mitigation: 'Review the sprint backlog weekly and rebalance backlog items before a teammate becomes a bottleneck.' },
      { title: 'MongoDB schema churn breaking existing data during development', category: 'technical', likelihood: 'medium', impact: 'low', mitigation: 'Keep development on a disposable local or free-tier database and avoid manual migrations until the schema stabilises.' },
      { title: 'Deadline slipping due to underestimated AI integration complexity', category: 'schedule', likelihood: 'medium', impact: 'high', mitigation: 'Timebox the AI integration spike early in the roadmap so a fallback (mock provider) is available if it runs over.' },
    ],
  }),

  GITHUB_GUIDE: (p) => ({
    branchingStrategy: `A lightweight feature-branch model suits a team of ${p?.teamSize ?? 'a few'} — every change lands on a short-lived branch off main and merges via pull request, with no long-lived develop branch needed at this scale.`,
    branches: [
      { name: 'main', purpose: 'Always deployable; every merge here should be demo-ready.' },
      { name: 'feature/*', purpose: 'One branch per feature or fix, deleted after merge.' },
    ],
    commitConvention: {
      format: 'Conventional Commits: type(scope): short description',
      examples: ['feat(auth): add JWT refresh rotation', 'fix(records): correct pagination off-by-one', 'docs(readme): add setup instructions'],
    },
    workflowSteps: [
      'Pull the latest main before starting new work',
      'Create a feature branch named feature/<short-description>',
      'Commit in small, logical steps using the commit convention',
      'Push the branch and open a pull request against main',
      'Address review comments and wait for CI to pass',
      'Merge via squash-and-merge, then delete the branch',
    ],
    prGuidelines: [
      'At least one teammate approval before merging',
      'CI (lint and tests) must pass before merge is allowed',
      'PR description explains what changed and why, not just what',
    ],
  }),

  DEPLOYMENT_GUIDE: () => ({
    platforms: [
      {
        component: 'frontend',
        platform: 'Vercel',
        steps: ['Connect the GitHub repo to a new Vercel project', 'Set the root directory to frontend', 'Add the VITE_API_BASE_URL environment variable', 'Deploy'],
      },
      {
        component: 'backend',
        platform: 'Render',
        steps: ['Create a new Web Service from the repo', 'Set the root directory to backend', 'Set the build command to npm ci and start command to node src/server.js', 'Add all required environment variables', 'Deploy'],
      },
      {
        component: 'database',
        platform: 'MongoDB Atlas',
        steps: ['Create a free M0 cluster', 'Create a database user and whitelist 0.0.0.0/0 for the deployed backend', 'Copy the connection string into MONGO_URI'],
      },
    ],
    environmentVariables: [
      { key: 'MONGO_URI', description: 'MongoDB Atlas connection string', example: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname', required: true },
      { key: 'JWT_ACCESS_SECRET', description: 'Signing secret for short-lived access tokens', example: 'a-long-random-string', required: true },
      { key: 'JWT_REFRESH_SECRET', description: 'Signing secret for refresh tokens', example: 'a-different-long-random-string', required: true },
      { key: 'GEMINI_API_KEY', description: 'API key for AI generation', example: 'AIza...', required: true },
      { key: 'VITE_API_BASE_URL', description: 'Base URL the frontend calls', example: 'https://api.example.com/api/v1', required: true },
    ],
    cicdNotes: 'A minimal GitHub Actions workflow that runs lint and tests on every pull request is sufficient here; Vercel and Render both auto-deploy on push to main, so no separate deploy step needs to be scripted.',
  }),
};

/** Generic fallback so an unimplemented module still round-trips through the pipeline. */
const genericFixture = (type, project) => ({
  summary: `Mock output for ${type} on "${titleOf(project)}".`,
  note: 'Set AI_PROVIDER=gemini with a valid GEMINI_API_KEY to generate real content.',
});

export const getMockFixture = (artifactType, project) => {
  const build = fixtures[artifactType];
  return build ? build(project) : genericFixture(artifactType, project);
};

export default getMockFixture;
