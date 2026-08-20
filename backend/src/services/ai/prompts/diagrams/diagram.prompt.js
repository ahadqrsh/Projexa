import { z } from 'zod';
import { buildOutputContract } from '../system/outputContract.js';
import { ARTIFACT_TYPES, DIAGRAM_TYPES } from '../../../../../../shared/constants/artifactTypes.js';

export const version = 'diagram@1.0';

/**
 * Diagrams are plain TEXT (Mermaid DSL), not a paid image-generation call —
 * the same free-tier Gemini text model used for every other module can write
 * Mermaid syntax as easily as it writes JSON. Rendering the text into an
 * actual picture happens for free, client-side, via the `mermaid` npm
 * package in the browser. Nothing here ever calls an image API.
 */
export const outputSchema = z.object({
  title: z.string().min(3).max(80),
  mermaid: z.string().min(20),
});

/**
 * Per-type metadata: which upstream artifacts ground the diagram, and the
 * syntax cheatsheet + worked example that keeps the model inside Mermaid's
 * (fairly particular) grammar instead of inventing plausible-looking syntax
 * that fails to parse in the browser.
 */
export const DIAGRAM_META = {
  [DIAGRAM_TYPES.ERD]: {
    label: 'Entity-Relationship Diagram',
    dependsOn: [ARTIFACT_TYPES.DATABASE_DESIGN, ARTIFACT_TYPES.OVERVIEW],
    cheatsheet: `Mermaid ER diagram syntax:
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER {
        string id PK
        string name
        string email
    }
Relationship tokens (left--right): |o optional-one, ||exactly-one, }o zero-or-many, }| one-or-many.
Each entity block lists its key fields as "type name [PK|FK]". Keep type names simple (string, number, date, boolean, ObjectId).`,
  },
  [DIAGRAM_TYPES.UML_CLASS]: {
    label: 'UML Class Diagram',
    dependsOn: [ARTIFACT_TYPES.DATABASE_DESIGN, ARTIFACT_TYPES.API_DESIGN],
    cheatsheet: `Mermaid class diagram syntax:
classDiagram
    class User {
        +String name
        +String email
        -String passwordHash
        +login() Boolean
    }
    User "1" --> "*" Project : owns
Visibility: + public, - private, # protected. Relationships: --> association, --|> inheritance, --* composition, --o aggregation.`,
  },
  [DIAGRAM_TYPES.UML_SEQUENCE]: {
    label: 'UML Sequence Diagram',
    dependsOn: [ARTIFACT_TYPES.API_DESIGN, ARTIFACT_TYPES.SRS],
    cheatsheet: `Mermaid sequence diagram syntax:
sequenceDiagram
    actor User
    participant Client
    participant API
    participant DB
    User->>Client: Submit login form
    Client->>API: POST /auth/login
    API->>DB: findByEmail(email)
    DB-->>API: user document
    API-->>Client: 200 { accessToken }
Cover ONE representative end-to-end flow central to this project (e.g. its primary create/auth action), not every endpoint.`,
  },
  [DIAGRAM_TYPES.UML_USECASE]: {
    label: 'UML Use Case Diagram',
    dependsOn: [ARTIFACT_TYPES.FEATURES, ARTIFACT_TYPES.OVERVIEW],
    cheatsheet: `Mermaid has no native use-case shape, so model it as a flowchart with actors as
rounded nodes and use cases as stadium-shaped nodes inside a subgraph per role:
flowchart LR
    Admin([Admin])
    Student([Student])
    subgraph System[" "]
        UC1(["Manage Users"])
        UC2(["Generate Modules"])
        UC3(["Export Report"])
    end
    Admin --> UC1
    Student --> UC2
    Student --> UC3
Group use cases by role, one subgraph per role if there are multiple roles.`,
  },
  [DIAGRAM_TYPES.UML_ACTIVITY]: {
    label: 'UML Activity Diagram',
    dependsOn: [ARTIFACT_TYPES.SRS, ARTIFACT_TYPES.OVERVIEW],
    cheatsheet: `Mermaid flowchart syntax, used as an activity diagram:
flowchart TD
    Start([Start]) --> A[Enter project idea]
    A --> B{Idea valid?}
    B -- No --> A
    B -- Yes --> C[Generate SDLC modules]
    C --> D[Review artifacts]
    D --> End([End])
Use {diamond} nodes for decisions with labelled branches, [rectangle] nodes for actions, and ([stadium]) for start/end.`,
  },
};

export const buildPrompt = (diagramType, project, context = {}) => {
  const meta = DIAGRAM_META[diagramType];
  const contextBlock = Object.entries(context)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}\n${JSON.stringify(value)}`)
    .join('\n\n');

  return `Generate a ${meta.label} for this student project as Mermaid diagram source code.

PROJECT IDEA
Title: ${project.title}
Description: ${project.description}
Domain: ${project.domain}

${contextBlock ? `${contextBlock}\n` : ''}
${meta.cheatsheet}

Guidance:
- The diagram must be SPECIFIC to this project's actual entities/flows/features above, never a generic placeholder example.
- Keep it readable: 5-12 nodes/entities is usually right. Do not try to model every field or every endpoint.
- The "mermaid" value must be valid Mermaid syntax on its own — it will be passed directly to the Mermaid renderer with no post-processing. Use \\n for line breaks within the JSON string.
- Do not wrap the mermaid source in markdown code fences inside the JSON value.
${buildOutputContract(`{
  "title": "short human-readable diagram title",
  "mermaid": "the complete mermaid diagram source, starting with its diagram-type keyword"
}`)}`;
};

export default { version, outputSchema, DIAGRAM_META, buildPrompt };
