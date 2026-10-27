> **Current live update:** See [LIVE_SETUP.md](LIVE_SETUP.md) for the supported live execution path, required configuration, validation and limitations. Original demo descriptions below do not establish completed live capabilities.

# SE-MAESTRO
### Self-Evolving Multi-Agent Software Engineering Studio & AI Command Center

[![Tests](https://img.shields.io/badge/Backend%20Tests-67%2F67%20Passed-34D399?style=flat-square&logo=pytest)](file:///c:/SE-MAESTRO/backend/tests)
[![Build](https://img.shields.io/badge/Frontend%20Build-Vite%208%20%7C%20React%2019-8B5CF6?style=flat-square&logo=vite)](file:///c:/SE-MAESTRO/dist)
[![Phases](https://img.shields.io/badge/Completed%20Phases-1%20to%2016-22D3EE?style=flat-square)](file:///c:/SE-MAESTRO)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)](file:///c:/SE-MAESTRO/LICENSE)

**SE-MAESTRO** is an enterprise-grade multi-agent software engineering studio and autonomous AI command center. It orchestrates a specialized team of autonomous AI engineering agents to decompose requirements, architect system schemas, implement source code, execute test suites inside isolated sandboxes, analyze failure patterns, continuously self-evolve across iterations, and enforce granular security policies under human governance.

---

## 🌟 Key Capabilities & Highlights

- **AI Engineering Command Center**: Dark-first control room interface (`#0B0D12` canvas, `#11141B` surfaces, `#8B5CF6` AI violet, `#22D3EE` system cyan) featuring real-time telemetry, agent state transitions, and live execution streams.
- **Specialized 7-Agent Autonomous Team**:
  - 📋 **Project Manager (PM)**: Decomposes requirements into user stories, milestones, and task queues.
  - 📐 **Architect Agent**: Synthesizes schema diagrams, API contracts, and database declarations.
  - 💻 **Developer Agent**: Writes clean backend controllers, routing modules, and frontend UI components.
  - 🧪 **Tester Agent**: Executes unit, API, integration, and stress verification test suites.
  - 🔍 **Reviewer Agent**: Audits code compliance against security standards and design tokens.
  - 🛠️ **Debugger Agent**: Conducts root-cause traceback analysis and injects targeted code patches.
  - 🧬 **Evolution Agent**: Extracts cross-iteration failure learnings and updates prompt guidelines.
- **Continuous Self-Evolution Loop**:
  $$\text{BUILD} \rightarrow \text{TEST} \rightarrow \text{FAILURE} \rightarrow \text{ANALYZE} \rightarrow \text{PATTERN} \rightarrow \text{LEARNING} \rightarrow \text{WORKFLOW} \rightarrow \text{ITERATION} \rightarrow \text{MEASURE} \rightarrow \text{IMPROVE}$$
- **Centralized Governance & AI Trust Center**: Enforces Default Deny, Least Privilege, Role-Based Access Control (RBAC), Four-Eyes Approval pipelines, and immutable SHA-256 audit logging.
- **Isolated Sandbox Execution**: Runs untrusted code safely in isolated execution containers with resource and timeout quotas.
- **Observability & Incident Center**: Real-time service health tracking, telemetry graphs, and automated post-incident review (PIR) generation.
- **Global Command Palette**: Instant `Ctrl + K` (or `Cmd + K`) search and navigation across all studio modules.
- **Authentication Gate**: Light-mode login portal (`#F6F7FB`) with 1-click evaluation access for `ADMIN`, `DEVELOPER`, and `TESTER` personas.

---

## 🏛️ Studio Modules & Routes

| Phase | Module | Route | Key Capabilities |
| :---: | :--- | :---: | :--- |
| **01** | **Foundation** | `/` | Responsive layouts, design token system, and atomic UI components |
| **02** | **Dashboard** | `/dashboard` | Mission control overview, active orchestration pipeline, and simulation controls |
| **03** | **Workspace** | `/workspace` | Multi-file IDE, Python syntax highlighter, minimap, and multi-tab terminal |
| **04** | **Agents** | `/agents` | Team network flow graph, agent progress bars, task queues, and handoffs stream |
| **05** | **Testing** | `/testing` | Test health metrics, execution timelines, failure inspector, and AI Debugger |
| **06** | **Evolution** | `/evolution` | Continuous self-evolution visualizer, prompt mutation history, and candidate benchmarking |
| **07** | **Memory** | `/memory` | AI knowledge repository (Project Knowledge, Agent Learnings, Error & Success Patterns) |
| **08** | **Projects** | `/projects` | Repository workspaces, backlog decompositions, and AI Architect Assist |
| **09** | **Logs** | `/logs` | Observability console with severity filters, trace ID lookups, and correlation tracking |
| **10** | **Diagnostics** | `/testing` | Runtime diagnostic traces, exception categorization, and assertion diffs |
| **11** | **Monitoring** | `/monitoring` | Service health dashboard, telemetry graphs, and incident management center |
| **12** | **Delivery** | `/workspace?tab=releases` | Automated CI/CD build pipelines, release verification, and instant rollbacks |
| **13** | **Sandbox** | `/workspace` | Isolated container execution environment with memory/timeout limits |
| **14** | **Autonomous Loop** | `/workspace` | Autonomous iteration loop controller with stop conditions and convergence thresholds |
| **15** | **AI Strategy** | `/settings` | Multi-model orchestration, reasoning temperature controls, and token optimization |
| **16** | **Governance** | `/governance` | PolicyEngine rules, Policy Simulator, RBAC Operator Personas, and audit logs |

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler & Dev Server**: Vite 8 with Hot Module Replacement (HMR)
- **Styling**: Tailwind CSS v4 with custom dark-first command center design tokens
- **Routing**: React Router v7 with protected route gating
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ASGI Server**: Uvicorn
- **ORM & Database**: SQLAlchemy with SQLite
- **Validation**: Pydantic v2
- **Testing**: Pytest & AnyIO test client

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/SE-MAESTRO.git
cd SE-MAESTRO
```

### 2. Backend Setup
```bash
# Navigate to backend directory and install Python dependencies
cd backend
python -m pip install -r requirements.txt

# Seed the SQLite database with initial projects, agents, memories, and logs
python -m app.seed

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API Documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 3. Frontend Setup
```bash
# In the project root directory, install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend Studio is available at [http://localhost:5173/](http://localhost:5173/).*

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Authentication & Demo Accounts

SE-MAESTRO features an authentication gate protecting all studio routes. On the login screen, you can click any of the pre-configured 1-click persona cards or enter the credentials below:

| Persona | Email | Password | Assigned Role | Capabilities |
| :--- | :--- | :--- | :---: | :--- |
| **Lead Developer** *(Default)* | `developer@se-maestro.ai` | `DeveloperMaestro2026!` | `DEVELOPER` | Full Workspace IDE, Agent Orchestration, Testing & Self-Evolution |
| **Studio Administrator** | `admin@se-maestro.ai` | `AdminMaestro2026!` | `ADMIN` | Global Governance, Policy Rules, Approvals, Production Releases |
| **QA Tester** | `tester@se-maestro.ai` | `TesterMaestro2026!` | `TESTER` | Test Execution, Failure Diagnostics, Service Monitoring |

---

## 🧪 Verification & Test Suite

Run the full automated test suite covering all 16 studio phases:

```bash
# Run backend pytest suite
pytest backend/tests -v
```

### Test Coverage Summary
```text
backend/tests/test_ai.py ............             [ 17%]
backend/tests/test_api.py .........               [ 31%]
backend/tests/test_autonomous.py ........         [ 43%]
backend/tests/test_delivery.py ........           [ 55%]
backend/tests/test_governance.py ...........      [ 71%]
backend/tests/test_monitoring.py ......           [ 80%]
backend/tests/test_orchestration.py ....          [ 86%]
backend/tests/test_sandbox.py .........           [100%]

====================== 67 passed, 39 warnings in 16.54s ======================
```

---

## 📁 Repository Structure

```text
SE-MAESTRO/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (agents, ai, governance, monitoring, auth, etc.)
│   │   ├── core/         # Database engine, config, security & password hashing
│   │   ├── models/       # SQLAlchemy ORM models (projects, tasks, agents, memory, logs, etc.)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # PolicyEngine, SandboxManager, EvolutionEngine
│   │   ├── seed.py       # Database seeding script
│   │   └── main.py       # FastAPI application entry point & CORS configuration
│   └── tests/            # Pytest test suite (67 unit & integration tests)
├── src/
│   ├── components/
│   │   ├── auth/         # ProtectedRoute authentication gate
│   │   ├── common/       # PageHeader, EmptyState, StatCard
│   │   ├── layout/       # AppShell, Sidebar, Topbar
│   │   ├── navigation/   # NavigationItem, ProjectSelector
│   │   └── ui/           # Avatar, Badge, Button, Card, Dropdown, Input, Modal, Tabs
│   ├── context/          # AuthContext with session persistence & demo accounts
│   ├── pages/
│   │   ├── Agents/       # AI Team orchestration center
│   │   ├── Dashboard/    # Mission control command center
│   │   ├── Evolution/    # Continuous self-evolution visualizer
│   │   ├── Governance/   # Security, RBAC, and AI trust center
│   │   ├── Login/        # Light-mode authentication portal
│   │   ├── Logs/         # Observability & telemetry console
│   │   ├── Memory/       # AI knowledge repository
│   │   ├── Monitoring/   # Real-time incident & service health
│   │   ├── Projects/     # Workspace repository manager
│   │   ├── Settings/     # Studio & engine configuration
│   │   ├── Testing/      # Validation & AI Debugger
│   │   └── Workspace/    # Multi-agent developer IDE
│   ├── services/api/     # Typed frontend API clients
│   ├── App.tsx           # Route definitions & auth wrapper
│   ├── index.css         # Command center design tokens & styles
│   └── main.tsx          # React application root
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](file:///c:/SE-MAESTRO/LICENSE) file for details.
