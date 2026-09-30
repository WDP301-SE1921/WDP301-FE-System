# EduGrade — System Structure & Architecture Specification (SYSTEM_STRUCTURE.md)

This document provides a detailed specification of the directory layout, architectural layers, routing strategy, and code organization rules for the **EduGrade** application.

---

## 1. Architectural Overview

The EduGrade codebase is built on **Next.js (App Router)** following a **Feature-driven Modular Design**. This pattern strictly isolates Routing, Core Business Logic, Shared UI Components, and AI Agent Contexts.

### High-Level Folder Allocation:
* `.claude/`: Contains AI coding agent rules, memory logs, agent personas, and business domain skills.
* `docs/`: Technical specifications and workflow documentation (Business Workflows, Data Contracts, Feature Architecture, System Structure).
* `public/`: Static assets (SVGs, icons, logos).
* `src/app/`: Next.js App Router layer, logically partitioned using Route Groups for role-based access.
* `src/components/`: Reusable interface components (Shared UI, Radix/Shadcn UI base elements, and Form primitives).
* `src/features/`: Encapsulated domain-driven modules containing business logic, hooks, and feature-specific components.
* `src/lib/`: Core utilities, helper functions, and Zod validation schemas.

---

## 2. Directory Layout & File Tree

```text
EduGrade/
├── .claude/                             # AI Agent Rules, Context & Memory
│   ├── agents/                          # Role specifications (frontend.md, reviewer.md)
│   ├── commands/                        # Custom AI CLI workflows (feature, fix, review, verify, etc.)
│   ├── memory/                          # Long-term memory context (Decisions, Gotchas, Progress, MEMORY.md)
│   ├── rules/                           # System rules (Architecture, Data Contracts, UI, Tech Stack, Naming)
│   └── skills/                          # Complex domain skill definitions (Enrollment, Attendance, Shared UI)
├── docs/                                # System design documentation & workflow specs
│   ├── AI_AGENT_GUIDE.md
│   ├── BUSINESS_WORKFLOW.md
│   ├── DATA_CONTRACTS.md
│   ├── DESIGN.md
│   ├── FEATURE_ARCHITECTURE.md
│   ├── MOCK_DATA.md
│   └── SYSTEM_STRUCTURE.md              # This document
├── public/                              # Static public assets (SVGs, branding)
├── src/                                 # Primary source code directory
│   ├── app/                             # Next.js App Router (Layouts & Pages)
│   │   ├── (auth)/                      # Group Router: Login & Token Activation
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (manager)/                   # Group Router: center back-office (/manager/*) shared by admin, center_manager, curriculum_designer, staff — see src/constants/role-access.ts
│   │   │   ├── classes/                 # Class, fixed schedule & session management
│   │   │   ├── dashboard/               # Operational analytics dashboard
│   │   │   ├── payments/                # Payment confirmation & receipt generation
│   │   │   ├── students/                # Student & Parent Profile records
│   │   │   └── teachers/                # Teacher assignments & substitute management
│   │   ├── (parent)/                    # Group Router: Parent Portal (Web/Mobile)
│   │   │   ├── children/                # Profile switcher & child management
│   │   │   ├── dashboard/               # Student academic overview
│   │   │   ├── grades/                  # Grades, AI feedback & official solutions
│   │   │   └── schedule/                # Class timetables & make-up schedules
│   │   ├── (public)/                    # Group Router: Public pages
│   │   │   └── about/
│   │   ├── (teacher)/                   # Group Router: Teacher Portal (Web/Mobile)
│   │   │   ├── attendance/              # Session attendance tracking
│   │   │   ├── grading/                 # AI grading verification & publishing interface
│   │   │   ├── reports/                 # Student evaluation & AI report generator (Excel/PDF)
│   │   │   └── schedule/                # Teaching schedule & substitute requests
│   │   ├── globals.css                  # Global styles & Tailwind configuration
│   │   ├── layout.tsx                   # Root layout component
│   │   └── page.tsx                     # Landing page / Root redirect controller
│   ├── components/                      # Reusable UI component library
│   │   ├── forms/                       # Shared form wrapper components
│   │   ├── shared/                      # Dynamic structural elements (Navbars, Sidebars)
│   │   └── ui/                          # Primitive UI primitives (Radix/Shadcn UI)
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       └── tabs.tsx
│   ├── constants/                       # System-wide constants & enums
│   ├── features/                        # Core Business Domain Logic
│   │   ├── attendance/                  # Attendance rules & calculation logic
│   │   ├── classes/                     # Class creation & session generation logic
│   │   ├── payments/                    # Payment collection & single-use token logic
│   │   └── students/                    # Student profile & parent account linkage logic
│   ├── hooks/                           # Shared custom React hooks
│   ├── lib/                             # Utility & Validation core
│   │   ├── validators/                  # Zod schema definitions for API data contracts
│   │   └── utils.ts                     # Utility helpers (cn, formatters)
│   ├── providers/                       # React Context Providers (Theme, Auth, Query)
│   └── types/                           # Global TypeScript interface definitions
├── components.json                      # Shadcn UI CLI configuration
├── next.config.ts                       # Next.js configuration
├── package.json                         # Project dependencies & npm scripts
└── tsconfig.json                        # TypeScript compiler options