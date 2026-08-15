# Projexa — 06. Dashboard Planning & Design System

> **Phase 1 · Document 6 of 7**
> Three dashboards, one design system, ~30 reusable primitives.

---

## 1. Design Principles

1. **The artifact is the hero.** Chrome recedes; generated content gets the space, the contrast and the typography.
2. **State is always visible.** Every module shows generated / generating / stale / failed without a click.
3. **Nothing blocks.** Long operations are backgrounded with honest progress; the UI stays usable.
4. **Density where it earns its place.** Dashboards are scannable and compact; artifact reading views are generous and calm.
5. **One primitive, one job.** Thirty small components composed everywhere beats sixty bespoke ones.

---

## 2. Design Tokens

### 2.1 Colour Palette

Defined as CSS custom properties in `styles/index.css` and mapped into `tailwind.config.js`, so every colour is available as `bg-primary-600`, `text-muted`, etc., and dark mode is a variable swap rather than a second set of classes.

| Role | Token | Light | Dark | Use |
|---|---|---|---|---|
| **Primary** | `primary-600` | `#4F46E5` | `#6366F1` | Buttons, links, active nav, focus rings |
| | `primary-700` | `#4338CA` | `#4F46E5` | Hover |
| | `primary-50` | `#EEF2FF` | `#1E1B4B` | Subtle backgrounds, selected rows |
| **Accent** | `accent-500` | `#8B5CF6` | `#A78BFA` | AI-specific affordances only |
| | `accent-gradient` | `linear-gradient(135deg,#4F46E5,#8B5CF6)` | same | Generate buttons, hero |
| **Success** | `success-600` | `#059669` | `#10B981` | Completed modules, done tasks |
| **Warning** | `warning-500` | `#D97706` | `#F59E0B` | Stale artifacts, quota warnings |
| **Danger** | `danger-600` | `#DC2626` | `#EF4444` | Failures, destructive actions |
| **Info** | `info-500` | `#0EA5E9` | `#38BDF8` | Generating state, tips |
| **Surface** | `bg-base` | `#FFFFFF` | `#0B1120` | Page background |
| | `bg-surface` | `#F8FAFC` | `#111827` | Cards, sidebar |
| | `bg-elevated` | `#FFFFFF` | `#1F2937` | Modals, dropdowns |
| **Border** | `border-subtle` | `#E2E8F0` | `#1F2937` | Dividers |
| | `border-strong` | `#CBD5E1` | `#374151` | Inputs |
| **Text** | `text-primary` | `#0F172A` | `#F1F5F9` | Headings, body |
| | `text-secondary` | `#475569` | `#94A3B8` | Supporting copy |
| | `text-muted` | `#94A3B8` | `#64748B` | Timestamps, hints |

**Why indigo→violet rather than the default blue.** Blue is the default for every dashboard template and reads as generic. The indigo-to-violet gradient is reserved *exclusively* for AI actions, which makes "this button spends a credit and calls the model" instantly recognisable across 20 modules — a functional signal, not decoration.

**Contrast is verified, not assumed.** `text-primary` on `bg-base` is 16.1:1; `primary-600` on white is 6.5:1; `success-600` on white is 4.6:1. All clear WCAG AA. `warning-500` is used only for backgrounds and icons paired with dark text, never as small text on white.

### 2.2 Category Colours (sprint tasks & module groups)

| Category | Token |
|---|---|
| setup | slate-500 |
| backend | emerald-500 |
| frontend | sky-500 |
| database | amber-500 |
| ai | violet-500 |
| testing | rose-500 |
| deployment | cyan-500 |
| documentation | indigo-400 |
| design | fuchsia-500 |

Always rendered as a coloured dot **plus** a text label — never colour alone.

### 2.3 Typography

| Role | Family | Size / Weight / Leading |
|---|---|---|
| Display | Inter | 36–48px · 700 · 1.1 |
| H1 | Inter | 30px · 700 · 1.2 |
| H2 | Inter | 24px · 600 · 1.3 |
| H3 | Inter | 20px · 600 · 1.4 |
| Body | Inter | 16px · 400 · 1.6 |
| Body small | Inter | 14px · 400 · 1.5 |
| Caption | Inter | 12px · 500 · 1.4 |
| Code | JetBrains Mono | 14px · 400 · 1.6 |

Loaded via `@fontsource` and self-hosted — no render-blocking request to Google Fonts, which also keeps the app usable offline in a college lab.

### 2.4 Spacing, Radius, Elevation, Motion

| Token | Value |
|---|---|
| Spacing scale | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px |
| Radius | `sm` 6 · `md` 10 · `lg` 14 · `xl` 20 · `full` 9999 |
| Shadow | `sm` cards · `md` dropdowns · `lg` modals · `glow` AI buttons |
| Container | max-width 1440px; content column 768px for artifact reading |
| Motion | fast 150ms · base 250ms · slow 400ms · easing `cubic-bezier(0.4,0,0.2,1)` |
| Breakpoints | `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536 |

**The 768px reading column is a real decision.** Generated documentation runs to thousands of words. Full-width text at 1440px produces ~200-character lines that are physically hard to read. Artifact views constrain to 768px (~75 characters) while dashboards use the full width.

---

## 3. Student Dashboard — `/dashboard`

### 3.1 Layout

```
┌───────────┬──────────────────────────────────────────────────────────┐
│           │  Good evening, Ahad 👋            [🔍 ⌘K] [🔔3] [◑] [◯] │
│  SIDEBAR  ├──────────────────────────────────────────────────────────┤
│           │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │
│  ⌂ Dash   │  │   12   │ │   3    │ │  187   │ │  62%   │             │
│  ▣ Proj   │  │Projects│ │ Active │ │Credits │ │  Avg   │             │
│  ✚ New    │  │  +2 wk │ │        │ │ left   │ │ progr. │             │
│  ☑ Tasks  │  └────────┘ └────────┘ └────────┘ └────────┘             │
│  ★ Marks  ├──────────────────────────────────────────────────────────┤
│  ⊕ Explr  │  ┌──────────────────────────────┐ ┌────────────────────┐ │
│           │  │  CONTINUE WHERE YOU LEFT OFF │ │  UPCOMING TASKS    │ │
│  ───────  │  │  ┌────────────────────────┐  │ │  ☐ JWT middleware  │ │
│  RECENT   │  │  │ Hospital Management    │  │ │    Today · high    │ │
│  • Hosp ● │  │  │ ▰▰▰▰▰▰▱▱▱▱ 62%         │  │ │  ☐ Appointment API │ │
│  • E-Lrn  │  │  │ Next: Documentation    │  │ │    Tomorrow        │ │
│  • Agri   │  │  │ [Continue →]           │  │ │  ☐ Doctor schema   │ │
│           │  │  └────────────────────────┘  │ │    Fri · medium    │ │
│  ───────  │  └──────────────────────────────┘ │  [View all →]      │ │
│  ⚙ Set    │                                    └────────────────────┘ │
│  Credits  ├──────────────────────────────────────────────────────────┤
│  ▰▰▰▰▰▱   │  YOUR PROJECTS                    [grid|list] [filters ▾] │
│  187/200  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  ───────  │  │ ▰▰▰▰▰▱   │ │ ▰▰▱▱▱▱   │ │ ▰▰▰▰▰▰   │ │    ✚     │    │
│  ◯ Ahad ▾ │  │ Hospital │ │ E-Learn  │ │ Agri IoT │ │   New    │    │
│           │  │ ●health  │ │ ●edu     │ │ ●iot     │ │ Project  │    │
│           │  │ 17/20 ⚡  │ │ 6/20     │ │ 20/20 ✓  │ │          │    │
│           │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│           ├──────────────────────────────────────────────────────────┤
│           │  ACTIVITY                                                 │
│           │  ⚡ SRS generated · Hospital Management · 2m ago          │
│           │  💬 Prof. Sharma commented on Database Design · 1h ago    │
│           │  ✓ Sprint 2 completed · Agri IoT · yesterday              │
└───────────┴──────────────────────────────────────────────────────────┘
```

### 3.2 Widget Inventory

| Widget | Data source | Refresh |
|---|---|---|
| Stat cards ×4 | `GET /projects/stats` | On mount; on generation complete |
| Continue card | Most recently updated non-completed project | On mount |
| Upcoming tasks | `GET /tasks/upcoming` | On mount; optimistic on check |
| Project grid | `GET /projects?limit=8&sort=-updatedAt` | On mount; on filter change |
| Activity feed | `GET /notifications?limit=10` | On mount; polled every 60s |
| Credit meter | `GET /users/me` | On mount; after each generation |

**"Continue where you left off" is the most valuable widget on this page.** The core failure mode for a student project tool is abandonment after the first burst of enthusiasm. One card that names the exact next action — "Next: Documentation" with a single button — removes the "where was I?" friction that causes drop-off.

### 3.3 Project Card Anatomy

```
┌──────────────────────────────────┐
│ [cover image or gradient]     ★  │
│                                  │
├──────────────────────────────────┤
│ Hospital Management System       │
│ ● healthcare · advanced · 3 devs │
│                                  │
│ ▰▰▰▰▰▰▰▰▱▱  17/20 modules        │
│                                  │
│ ⚡ generating   💬 3   ⚠ 2 stale │
│ Updated 2 hours ago         [⋯]  │
└──────────────────────────────────┘
```

Hover lifts the card 2px with a `shadow-md` transition (150ms). The `⋯` menu holds Open, Duplicate, Export, Share, Archive, Delete.

---

## 4. Project Workspace — `/projects/:projectId`

### 4.1 Overview (Module Grid)

```
┌────────────┬─────────────────────────────────────────────────────────┐
│ ◀ Projects │  Hospital Management System        [Share] [⚡Generate] │
│ ────────── │  healthcare · advanced · 3 devs · due 15 Dec 2026       │
│ Hospital   │  ▰▰▰▰▰▰▰▰▱▱ 17 of 20 modules · 62% tasks complete       │
│ ▰▰▰▰▰▱ 62% ├─────────────────────────────────────────────────────────┤
│ ────────── │  ⚠ Your idea changed. 2 modules are out of date.        │
│ OVERVIEW   │                              [Review] [Regenerate both] │
│ ⊙ Overview✓├─────────────────────────────────────────────────────────┤
│ ⊙ Features✓│  OVERVIEW                                                │
│ ⊙ Stack  ✓ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ ANALYSIS   │  │ ✓ Overview  │ │ ✓ Features  │ │ ✓ TechStack │        │
│ ⊙ SRS    ✓ │  │ Objective,  │ │ 24 features │ │ MERN + Gem. │        │
│ ⊙ Risk   ⟳ │  │ scope, users│ │ 3 roles     │ │ 6 categories│        │
│ ⊙ Cost   ○ │  │ [View →]    │ │ [View →]    │ │ [View →]    │        │
│ DESIGN     │  └─────────────┘ └─────────────┘ └─────────────┘        │
│ ⊙ Database✓│  ANALYSIS                                                │
│ ⊙ API    ✓ │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ ⊙ Folders✓ │  │ ✓ SRS       │ │ ⟳ Risk      │ │ ○ Cost      │        │
│ ⊙ UI Plan⚠ │  │ 18 FR · 9NFR│ │ ▰▰▰▱▱ 61%   │ │ Not yet     │        │
│ ⊙ Diagram✓ │  │ [View →]    │ │ generating… │ │ [⚡Generate]│        │
│ PLANNING   │  └─────────────┘ └─────────────┘ └─────────────┘        │
│ ⊙ Sprints✓ │  DESIGN                                                  │
│ ⊙ Roadmap✓ │  … 5 cards …                                            │
│ DELIVERY   │  PLANNING · DELIVERY · SUBMISSION                        │
│ ⊙ Docs   ○ │  … remaining cards …                                    │
│ ⊙ GitHub ○ ├─────────────────────────────────────────────────────────┤
│ ⊙ Deploy ○ │            [⚡ Generate all 5 missing modules · 5 credits]│
└────────────┴─────────────────────────────────────────────────────────┘
```

### 4.2 Artifact Page — `/projects/:projectId/module/:type`

```
┌────────────┬────────────────────────────────────┬───────────────────┐
│  RAIL      │  Software Requirement Spec         │  ON THIS PAGE     │
│            │  v2 · gemini-1.5-flash · 2h ago    │  › Functional (18)│
│            │  [⟳ Regenerate][✎ Edit][⧉][⇩][⋯]  │  › Non-func. (9)  │
│            ├────────────────────────────────────┤                   │
│            │  FUNCTIONAL REQUIREMENTS           │  COMMENTS      3  │
│            │  ┌──────────────────────────────┐  │  ┌──────────────┐ │
│            │  │ FR-01  User Authentication   │  │  │ ◯ Prof. S.   │ │
│            │  │ ▰ high                       │  │  │ Add OTP for  │ │
│            │  │ The system shall allow …     │  │  │ doctor login │ │
│            │  └──────────────────────────────┘  │  │ 1h · [Reply] │ │
│            │  ┌──────────────────────────────┐  │  └──────────────┘ │
│            │  │ FR-02  Appointment Booking   │  │  [+ Add comment]  │
│            │  │ ▰ high                       │  │                   │
│            │  │ Patients shall be able to …  │  │  VERSIONS         │
│            │  └──────────────────────────────┘  │  v2 current       │
│            │  … 16 more …                       │  v1 · 3d · restore│
│            │                                    │                   │
│            │  NON-FUNCTIONAL REQUIREMENTS       │                   │
│            │  ┌──────────────────────────────┐  │                   │
│            │  │ 🔒 Security                  │  │                   │
│            │  │ All patient data encrypted…  │  │                   │
│            │  │ metric: 0 plaintext at rest  │  │                   │
│            │  └──────────────────────────────┘  │                   │
└────────────┴────────────────────────────────────┴───────────────────┘
```

Three columns: navigation rail (fixed 260px), content (max 768px, centred), context rail (300px, collapsible). Below `lg` the context rail becomes a bottom sheet; below `md` the nav rail becomes a dropdown.

### 4.3 Renderer Design Notes

| Module | Presentation |
|---|---|
| `OVERVIEW` | Definition-list cards; target users as avatars + labels |
| `FEATURES` | Tabs per role → priority-sorted feature list with priority pills |
| `SRS` | FR cards with ID badge + priority; NFR cards with a category icon and a bold measurable metric |
| `DATABASE_DESIGN` | Collection accordions with a field table; relationships as a Mermaid graph |
| `API_DESIGN` | Grouped by resource; coloured method chips (GET green / POST blue / PATCH amber / DELETE red); expandable request & response `CodeBlock`s with copy |
| `FOLDER_STRUCTURE` | Interactive `FileTree` — expand/collapse, hover shows the file's purpose, "Copy as tree" |
| `UI_PLAN` | Page cards + a rendered colour-palette swatch strip with hex copy |
| `COST_ESTIMATION` | Table + a total card + a stacked bar of cost by category |
| `RISK_ANALYSIS` | 3×3 likelihood × impact matrix; click a cell to filter the risk list |
| `TECH_STACK` | Category columns of technology chips + a rationale panel |
| `ROADMAP` | Horizontal phase timeline with dependency arrows |
| `DOCUMENTATION` | Long-form `MarkdownViewer`, 768px column, sticky section nav |
| `VIVA_PREP` | Flashcard mode (flip to reveal), category filter, "shuffle", "mark as known" |
| `GITHUB_GUIDE` | Copyable README and .gitignore blocks + a milestone checklist |
| `DEPLOYMENT_GUIDE` | Platform tabs → numbered steps with copyable commands and a gotchas callout |

**Every renderer must handle four states — `completed`, `generating`, `failed`, `not generated` — and the `isStale` flag.** This is enforced by having each renderer receive already-loaded content from `ArtifactPanel`, which owns all four states centrally. A renderer that also had to handle loading would duplicate that logic fifteen times.

### 4.4 Sprint Board — `/projects/:projectId/sprints`

Two views on a toggle:

**Timeline** — horizontal weeks with progress bars, today marker, deadline marker.

**Kanban** — four columns (`To Do · In Progress · Review · Done`), drag-and-drop with optimistic updates, task cards showing category dot, priority, estimate and assignee, filterable by sprint / category / assignee.

Optimistic updates matter here: a Kanban that waits ~200ms for a server round-trip before the card moves feels broken. We move immediately and roll back with a toast on failure.

---

## 5. Mentor Dashboard — `/mentor`

```
┌───────────┬──────────────────────────────────────────────────────────┐
│ MENTOR    │  Mentor Dashboard                       [🔔5] [◑] [◯]   │
│ ⌂ Overview│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ ▣ Assigned│  │   8    │ │   3    │ │   12   │ │   2    │            │
│ 💬 Reviews│  │Assigned│ │ Need   │ │Comments│ │Deadline│            │
│ ⚙ Settings│  │        │ │ review │ │        │ │this wk │            │
│           │  └────────┘ └────────┘ └────────┘ └────────┘            │
│           ├──────────────────────────────────────────────────────────┤
│           │  NEEDS YOUR REVIEW                                        │
│           │  ┌──────────────────────────────────────────────────────┐│
│           │  │ ◯ Ahad Q. · Hospital Management                      ││
│           │  │   17/20 modules · updated 2h ago · 0 comments        ││
│           │  │   ⚠ due in 6 days              [Review →]            ││
│           │  └──────────────────────────────────────────────────────┘│
│           ├──────────────────────────────────────────────────────────┤
│           │  ALL ASSIGNED PROJECTS        [search] [filter: all ▾]   │
│           │  Student      Project        Progress   Deadline  Action │
│           │  Ahad Q.      Hospital Mgmt  ▰▰▰▰▱ 62%  15 Dec   [Open] │
│           │  Sara M.      E-Learning     ▰▰▱▱▱ 30%  20 Dec   [Open] │
│           │  …                                                        │
└───────────┴──────────────────────────────────────────────────────────┘
```

"Needs your review" surfaces projects that changed since the mentor's last visit and have unresolved threads — the mentor's actual job, ranked above a generic list.

---

## 6. Admin Dashboard — `/admin`

```
┌───────────┬──────────────────────────────────────────────────────────┐
│ ADMIN     │  Platform Overview                    [range: 30 days ▾] │
│ ⌂ Overview│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│ 👥 Users  │  │  1,284 │ │  3,910 │ │ 41.2K  │ │ $18.40 │            │
│ ▣ Projects│  │ Users  │ │Projects│ │ AI gen │ │AI cost │            │
│ ⚡ AI Use │  │ +112   │ │ +340   │ │ +5.1K  │ │ this mo│            │
│ 📋 Logs   │  └────────┘ └────────┘ └────────┘ └────────┘            │
│ ⚙ Settings├──────────────────────────────────────────────────────────┤
│           │  ┌───────────────────────────┐ ┌──────────────────────┐  │
│           │  │ SIGNUPS OVER TIME         │ │ PROJECTS BY DOMAIN   │  │
│           │  │  ╱╲    ╱╲                 │ │  ▓▓▓▓▓ healthcare 28%│  │
│           │  │ ╱  ╲__╱  ╲___             │ │  ▓▓▓▓ education 22%  │  │
│           │  │ (Recharts area)           │ │  ▓▓▓ finance 15%     │  │
│           │  └───────────────────────────┘ └──────────────────────┘  │
│           │  ┌───────────────────────────┐ ┌──────────────────────┐  │
│           │  │ AI COST BY MODULE         │ │ GENERATION SUCCESS   │  │
│           │  │ documentation  $4.10 ▓▓▓▓ │ │  ✓ 96.2%  ✗ 3.8%     │  │
│           │  │ srs            $2.80 ▓▓▓  │ │  Top failure:        │  │
│           │  │ database       $2.10 ▓▓   │ │  JSON parse · UML    │  │
│           │  └───────────────────────────┘ └──────────────────────┘  │
│           ├──────────────────────────────────────────────────────────┤
│           │  RECENT FAILURES                                          │
│           │  ⚠ UML_SEQUENCE · user 66f2… · JSON parse error · 12m ago │
└───────────┴──────────────────────────────────────────────────────────┘
```

The AI cost and failure panels are the reason this dashboard exists. Generation is the only variable cost and the only unreliable dependency in the system; everything else is static hosting. Per-module cost and per-module failure rates tell you exactly which prompt to fix next — and "top failure: JSON parse on UML" is directly actionable.

---

## 7. Component Library — Build Order

Phase 4 builds these in dependency order. Nothing is built twice.

**Tier 1 — primitives (no dependencies)**
`Button` · `Input` · `Textarea` · `Select` · `Checkbox` · `RadioGroup` · `Badge` · `Avatar` · `Spinner` · `Skeleton` · `ProgressBar` · `ProgressRing` · `Card`

**Tier 2 — composed**
`Modal` · `Drawer` · `Dropdown` · `Tooltip` · `Tabs` · `Accordion` · `Table` · `Pagination` · `Stepper` · `EmptyState` · `ConfirmDialog` · `CodeBlock` · `MarkdownViewer` · `FileTree` · `MermaidChart`

**Tier 3 — form bindings (RHF wrappers over Tier 1)**
`FormField` · `FormInput` · `FormSelect` · `FormTextarea` · `FormTagInput` · `FormDatePicker` · `FormError`

**Tier 4 — feature components**
`ProjectCard` · `ArtifactPanel` · `ArtifactToolbar` · `GenerationProgress` · `ModuleSelector` · `StaleBanner` · `SprintTimeline` · `SprintBoard` · `TaskItem` · `CommentThread` · `NotificationBell` · `ReportBuilder` · `StatCard` · the 15 renderers

Every Tier 1 and Tier 2 component takes `className` merged through `cn()` (clsx + tailwind-merge) so callers can adjust spacing without prop explosion or `!important`.

---

## 8. Motion Specification

| Interaction | Animation | Duration |
|---|---|---|
| Page transition | Fade + 8px rise | 250ms |
| Card hover | 2px lift + shadow | 150ms |
| Module grid load | Stagger children, 40ms apart | 250ms each |
| Artifact reveal on completion | Fade + scale 0.98→1 | 400ms |
| Modal | Backdrop fade + panel scale 0.95→1 | 200ms |
| Toast | Slide from top-right + fade | 250ms |
| Progress bar | Spring-eased width | continuous |
| Kanban drag | Layout animation via `layoutId` | 200ms |
| Skeleton | Shimmer sweep | 1.5s loop |
| Generating pulse | Opacity 0.6↔1 | 2s loop |

All wrapped in a `useReducedMotion()` check — when the user prefers reduced motion, transitions become instant opacity changes rather than being removed entirely, so state changes remain perceptible.

---

## 9. Responsive Behaviour

| Breakpoint | Sidebar | Project grid | Workspace | Board |
|---|---|---|---|---|
| `< 640` (mobile) | Bottom tab bar | 1 col | Stage dropdown + full-width content | 1 swipeable column |
| `640–1024` (tablet) | Icon rail, expand on tap | 2 col | Rail overlays; context rail as bottom sheet | 2 columns, scrollable |
| `1024–1280` (laptop) | Full sidebar, collapsible | 3 col | Rail + content; context rail collapsed | 4 columns |
| `> 1280` (desktop) | Full sidebar | 4 col | All three columns | 4 columns |

Mobile is a genuine target, not an afterthought: students check task lists and read viva questions on a phone, even though they build the project on a laptop. Those two views (`/tasks`, `/projects/:id/viva`) are designed mobile-first; the workspace is designed desktop-first and degrades gracefully.

---

**Previous:** [05 — User Flow & Navigation](./05-user-flow-and-navigation.md) · **Next:** [07 — Packages & Environment](./07-packages-and-environment.md)
