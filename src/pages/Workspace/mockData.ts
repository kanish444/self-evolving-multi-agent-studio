export interface FileNode {
  name: string
  path: string
  isFolder: boolean
  children?: FileNode[]
  isModified?: boolean
  isSaved?: boolean
}

export interface WorkspaceProjectData {
  fileTree: FileNode[]
  codeFiles: Record<string, string>
  defaultFile: string
  agentInfo: {
    name: string
    status: string
    progress: number
    started: string
    estimated: string
    subtasks: { id: number; title: string; status: string }[]
    activity: { time: string; agent: string; action: string; status: string }[]
    context: {
      role: string
      model: string
      task: string
      filesModified: number
      linesAdded: number
      linesRemoved: number
    }
  }
  terminalLogs: string[]
  problems: { severity: string; code: string; msg: string; file: string; line: number }[]
  outputLogs: string[]
  debugLogs: string[]
}

export const PROJECT_WORKSPACES: Record<string, WorkspaceProjectData> = {
  P001: {
    fileTree: [
      {
        name: 'StudentManagementSystem',
        path: 'StudentManagementSystem',
        isFolder: true,
        children: [
          {
            name: 'backend',
            path: 'StudentManagementSystem/backend',
            isFolder: true,
            isModified: true,
            children: [
              {
                name: 'CONTROLLERS',
                path: 'StudentManagementSystem/backend/CONTROLLERS',
                isFolder: true,
                children: [
                  {
                    name: 'StudentController.py',
                    path: 'StudentManagementSystem/backend/CONTROLLERS/StudentController.py',
                    isFolder: false,
                    isModified: true
                  }
                ]
              },
              {
                name: 'MODELS',
                path: 'StudentManagementSystem/backend/MODELS',
                isFolder: true,
                children: [
                  {
                    name: 'Student.py',
                    path: 'StudentManagementSystem/backend/MODELS/Student.py',
                    isFolder: false,
                    isSaved: true
                  }
                ]
              },
              {
                name: 'ROUTES',
                path: 'StudentManagementSystem/backend/ROUTES',
                isFolder: true,
                children: [
                  {
                    name: 'student_routes.py',
                    path: 'StudentManagementSystem/backend/ROUTES/student_routes.py',
                    isFolder: false,
                    isModified: true
                  }
                ]
              },
              {
                name: 'SERVICES',
                path: 'StudentManagementSystem/backend/SERVICES',
                isFolder: true,
                children: [
                  {
                    name: 'student_service.py',
                    path: 'StudentManagementSystem/backend/SERVICES/student_service.py',
                    isFolder: false
                  }
                ]
              },
              {
                name: 'DATABASE',
                path: 'StudentManagementSystem/backend/DATABASE',
                isFolder: true,
                children: [
                  {
                    name: 'database.py',
                    path: 'StudentManagementSystem/backend/DATABASE/database.py',
                    isFolder: false,
                    isSaved: true
                  }
                ]
              },
              {
                name: 'TESTS',
                path: 'StudentManagementSystem/backend/TESTS',
                isFolder: true,
                children: [
                  {
                    name: 'test_student.py',
                    path: 'StudentManagementSystem/backend/TESTS/test_student.py',
                    isFolder: false
                  }
                ]
              }
            ]
          },
          {
            name: 'README.md',
            path: 'StudentManagementSystem/README.md',
            isFolder: false
          },
          {
            name: 'requirements.txt',
            path: 'StudentManagementSystem/requirements.txt',
            isFolder: false
          }
        ]
      }
    ],
    defaultFile: 'StudentManagementSystem/backend/CONTROLLERS/StudentController.py',
    codeFiles: {
      'StudentManagementSystem/backend/CONTROLLERS/StudentController.py': `from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.student import Student
from app.database import get_db

router = APIRouter(prefix="/students", tags=["students"])

@router.get("/")
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).all()

@router.post("/")
def create_student(student: Student, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    db.add(student)
    db.commit()
    db.refresh(student)
    return student`,

      'StudentManagementSystem/backend/MODELS/Student.py': `from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    gpa = Column(String, default="3.85")
    is_active = Column(Boolean, default=True)`,

      'StudentManagementSystem/backend/ROUTES/student_routes.py': `from fastapi import APIRouter
from app.controllers.StudentController import router as student_router

router = APIRouter()
router.include_router(student_router)`,

      'StudentManagementSystem/backend/DATABASE/database.py': `from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`,

      'StudentManagementSystem/backend/SERVICES/student_service.py': `from sqlalchemy.orm import Session
from app.models.student import Student

def get_student_by_id(db: Session, student_id: int):
    return db.query(Student).filter(Student.id == student_id).first()`,

      'StudentManagementSystem/backend/TESTS/test_student.py': `import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_students():
    response = client.get("/students")
    assert response.status_code == 200`,

      'StudentManagementSystem/README.md': `# Student Management System (P001)
A high-performance FastAPI and SQLite application for orchestrating campus operations, including student profile registration, GPA summaries, and dynamic validations.`,

      'StudentManagementSystem/requirements.txt': `fastapi>=0.100.0\nuvicorn>=0.22.0\nsqlalchemy>=2.0.0\npydantic>=2.0.0\npytest>=7.3.0`
    },
    agentInfo: {
      name: 'Developer Agent',
      status: 'IN PROGRESS',
      progress: 68,
      started: '10:41:05 AM',
      estimated: '10:43:30 AM',
      subtasks: [
        { id: 1, title: 'Create Student model', status: 'completed' },
        { id: 2, title: 'Create database schema', status: 'completed' },
        { id: 3, title: 'Implement GET endpoint', status: 'completed' },
        { id: 4, title: 'Implement POST endpoint', status: 'in-progress' }
      ],
      activity: [
        { time: '10:42:15', agent: 'Developer Agent', action: 'Generated StudentController.py', status: 'success' },
        { time: '10:42:02', agent: 'Developer Agent', action: 'Connected to database', status: 'success' }
      ],
      context: {
        role: 'Code Generation & Implementation',
        model: 'Gemini 3.5 Flash',
        task: 'Student CRUD API',
        filesModified: 3,
        linesAdded: 142,
        linesRemoved: 18
      }
    },
    terminalLogs: [
      '10:42:15 [INFO] Code generated successfully',
      '10:42:12 [INFO] Database connection established',
      '10:42:05 [INFO] StudentController.py saved'
    ],
    problems: [
      { severity: 'error', code: 'E104', msg: 'Student email validation missing', file: 'StudentController.py', line: 18 },
      { severity: 'warning', code: 'W201', msg: 'Unused import detected', file: 'student_routes.py', line: 2 }
    ],
    outputLogs: [
      '[INFO] Building StudentManagementSystem...',
      '[SUCCESS] Build completed successfully.'
    ],
    debugLogs: [
      '[DEBUG] FastAPI server listening on http://127.0.0.1:8000',
      '[DEBUG] Database path: sqlite:///./sql_app.db'
    ]
  },

  P002: {
    fileTree: [
      {
        name: 'ECommerceMicroservices',
        path: 'ECommerceMicroservices',
        isFolder: true,
        children: [
          {
            name: 'services',
            path: 'ECommerceMicroservices/services',
            isFolder: true,
            children: [
              {
                name: 'orders',
                path: 'ECommerceMicroservices/services/orders',
                isFolder: true,
                children: [
                  { name: 'OrderController.py', path: 'ECommerceMicroservices/services/orders/OrderController.py', isFolder: false, isModified: true },
                  { name: 'OrderModel.py', path: 'ECommerceMicroservices/services/orders/OrderModel.py', isFolder: false }
                ]
              },
              {
                name: 'inventory',
                path: 'ECommerceMicroservices/services/inventory',
                isFolder: true,
                children: [
                  { name: 'InventoryService.py', path: 'ECommerceMicroservices/services/inventory/InventoryService.py', isFolder: false }
                ]
              },
              {
                name: 'payments',
                path: 'ECommerceMicroservices/services/payments',
                isFolder: true,
                children: [
                  { name: 'PaymentGateway.py', path: 'ECommerceMicroservices/services/payments/PaymentGateway.py', isFolder: false }
                ]
              }
            ]
          },
          { name: 'docker-compose.yml', path: 'ECommerceMicroservices/docker-compose.yml', isFolder: false },
          { name: 'README.md', path: 'ECommerceMicroservices/README.md', isFolder: false }
        ]
      }
    ],
    defaultFile: 'ECommerceMicroservices/services/orders/OrderController.py',
    codeFiles: {
      'ECommerceMicroservices/services/orders/OrderController.py': `from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/orders", tags=["orders"])

class OrderItem(BaseModel):
    sku: str
    quantity: int
    unit_price: float

class CreateOrderRequest(BaseModel):
    customer_id: str
    items: List[OrderItem]

@router.post("/checkout")
async def process_checkout(req: CreateOrderRequest):
    # Microservice Distributed Saga Orchestration
    total_amount = sum(item.quantity * item.unit_price for item in req.items)
    return {
        "status": "ORDER_CONFIRMED",
        "order_id": "ORD-98421",
        "customer_id": req.customer_id,
        "total_amount": total_amount,
        "inventory_lock": "HELD"
    }`,

      'ECommerceMicroservices/services/orders/OrderModel.py': `from pydantic import BaseModel

class Order(BaseModel):
    order_id: str
    customer_id: str
    status: str
    total_amount: float`,

      'ECommerceMicroservices/services/inventory/InventoryService.py': `class InventoryManager:
    async def reserve_stock(self, sku: str, count: int) -> bool:
        # Atomic Redis stock reservation lock
        return True`,

      'ECommerceMicroservices/services/payments/PaymentGateway.py': `class StripeProcessor:
    async def charge_token(self, token: str, amount_cents: int):
        return {"charge_id": "ch_3N8e19", "success": True}`,

      'ECommerceMicroservices/docker-compose.yml': `version: '3.8'
services:
  orders-service:
    build: ./services/orders
    ports: ["8001:8000"]
  inventory-service:
    build: ./services/inventory
    ports: ["8002:8000"]
  redis-cluster:
    image: redis:7-alpine
    ports: ["6379:6379"]`,

      'ECommerceMicroservices/README.md': `# E-Commerce Microservices (P002)
Dockerized microservice backend handling orders, inventories, and billing transactions with distributed Saga transaction compensation.`
    },
    agentInfo: {
      name: 'Architect Agent',
      status: 'PAUSED',
      progress: 45,
      started: '09:15:00 AM',
      estimated: '09:30:00 AM',
      subtasks: [
        { id: 1, title: 'Define Order schema', status: 'completed' },
        { id: 2, title: 'Saga compensation pattern', status: 'in-progress' }
      ],
      activity: [
        { time: '09:20:10', agent: 'Architect Agent', action: 'Configured Redis distributed locks', status: 'success' }
      ],
      context: {
        role: 'Microservice Architecture',
        model: 'Gemini 3.5 Flash',
        task: 'Microservice Order Saga & Inventory Lock',
        filesModified: 4,
        linesAdded: 210,
        linesRemoved: 12
      }
    },
    terminalLogs: [
      '[INFO] Initializing Redis cluster...',
      '[INFO] OrderController.py validated against OpenAPI schema',
      '[INFO] Subscribing to kafka topic orders.events'
    ],
    problems: [
      { severity: 'warning', code: 'W302', msg: 'Idempotency key header missing in checkout POST', file: 'OrderController.py', line: 16 }
    ],
    outputLogs: [
      '[INFO] Starting microservices container suite...',
      '[SUCCESS] All 3 services registered in Consul.'
    ],
    debugLogs: [
      '[DEBUG] Kafka event emitted: order.created {order_id: ORD-98421}'
    ]
  },

  P003: {
    fileTree: [
      {
        name: 'AutonomousAgentEngine',
        path: 'AutonomousAgentEngine',
        isFolder: true,
        children: [
          {
            name: 'src',
            path: 'AutonomousAgentEngine/src',
            isFolder: true,
            children: [
              { name: 'main.rs', path: 'AutonomousAgentEngine/src/main.rs', isFolder: false },
              { name: 'state_machine.rs', path: 'AutonomousAgentEngine/src/state_machine.rs', isFolder: false, isModified: true },
              { name: 'orchestrator.rs', path: 'AutonomousAgentEngine/src/orchestrator.rs', isFolder: false, isModified: true },
              { name: 'llm_client.rs', path: 'AutonomousAgentEngine/src/llm_client.rs', isFolder: false }
            ]
          },
          { name: 'Cargo.toml', path: 'AutonomousAgentEngine/Cargo.toml', isFolder: false },
          { name: 'README.md', path: 'AutonomousAgentEngine/README.md', isFolder: false }
        ]
      }
    ],
    defaultFile: 'AutonomousAgentEngine/src/orchestrator.rs',
    codeFiles: {
      'AutonomousAgentEngine/src/orchestrator.rs': `use crate::state_machine::{AgentState, StateTransition};
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AgentOrchestrator {
    pub session_id: String,
    pub current_state: Arc<Mutex<AgentState>>,
}

impl AgentOrchestrator {
    pub fn new(session_id: String) -> Self {
        Self {
            session_id,
            current_state: Arc::new(Mutex::new(AgentState::Idle)),
        }
    }

    pub async fn dispatch_goal(&self, prompt: &str) -> Result<StateTransition, String> {
        let mut state = self.current_state.lock().await;
        *state = AgentState::Planning;
        println!("[ORCHESTRATOR] Goal received: {}", prompt);
        Ok(StateTransition::Success)
    }
}`,

      'AutonomousAgentEngine/src/state_machine.rs': `#[derive(Debug, Clone, PartialEq)]
pub enum AgentState {
    Idle,
    Planning,
    Executing,
    Reviewing,
    Converged,
    Failed,
}

pub enum StateTransition {
    Success,
    Retry(u32),
    Aborted,
}`,

      'AutonomousAgentEngine/src/main.rs': `mod state_machine;
mod orchestrator;
mod llm_client;

#[tokio::main]
async fn main() {
    println!("Autonomous Agent Engine v0.3.0 initialized.");
    let orch = orchestrator::AgentOrchestrator::new("AGY-SESSION-01".to_string());
    orch.dispatch_goal("Optimize system memory vectors").await.unwrap();
}`,

      'AutonomousAgentEngine/src/llm_client.rs': `pub struct LLMClient;
impl LLMClient {
    pub async fn query_reasoning_stream(prompt: &str) -> String {
        format!("Reasoning trace for: {}", prompt)
    }
}`,

      'AutonomousAgentEngine/Cargo.toml': `[package]
name = "autonomous_agent_engine"
version = "0.3.0"
edition = "2021"

[dependencies]
tokio = { version = "1.32", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"`,

      'AutonomousAgentEngine/README.md': `# Autonomous Agent Engine (P003)
A Rust-based state machine container running goal-oriented LLM orchestration pipelines with formal convergence guarantees.`
    },
    agentInfo: {
      name: 'Evolution Agent',
      status: 'IDLE',
      progress: 100,
      started: '08:00:00 AM',
      estimated: '08:05:00 AM',
      subtasks: [
        { id: 1, title: 'State machine formal verification', status: 'completed' }
      ],
      activity: [
        { time: '08:04:12', agent: 'Evolution Agent', action: 'Compiled Rust binary target', status: 'success' }
      ],
      context: {
        role: 'Autonomous LLM State Engine',
        model: 'Gemini 3.5 Flash',
        task: 'Goal-Oriented LLM State Transition Pipeline',
        filesModified: 5,
        linesAdded: 380,
        linesRemoved: 4
      }
    },
    terminalLogs: [
      '[INFO] cargo build --release',
      '[INFO] Finished release [optimized] target(s) in 2.14s',
      '[INFO] Agent state machine listening on channel 0'
    ],
    problems: [],
    outputLogs: [
      '[INFO] Running test suite for autonomous state transitions...',
      '[SUCCESS] 14 passed; 0 failed; 0 ignored.'
    ],
    debugLogs: [
      '[DEBUG] StateTransition::Success dispatched on thread 4'
    ]
  },

  P004: {
    fileTree: [
      {
        name: 'VehicleServiceManagement',
        path: 'VehicleServiceManagement',
        isFolder: true,
        children: [
          {
            name: 'backend',
            path: 'VehicleServiceManagement/backend',
            isFolder: true,
            children: [
              { name: 'BookingController.py', path: 'VehicleServiceManagement/backend/BookingController.py', isFolder: false, isModified: true },
              { name: 'VehicleService.py', path: 'VehicleServiceManagement/backend/VehicleService.py', isFolder: false },
              { name: 'self_heal.py', path: 'VehicleServiceManagement/backend/self_heal.py', isFolder: false }
            ]
          },
          { name: 'README.md', path: 'VehicleServiceManagement/README.md', isFolder: false }
        ]
      }
    ],
    defaultFile: 'VehicleServiceManagement/backend/BookingController.py',
    codeFiles: {
      'VehicleServiceManagement/backend/BookingController.py': `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/vehicle-bookings", tags=["bookings"])

class BookingRequest(BaseModel):
    vehicle_vin: str
    customer_id: str
    service_type: str
    appointment_time: datetime

@router.post("/reserve")
async def create_booking(req: BookingRequest):
    # Self-healing booking validator
    if len(req.vehicle_vin) != 17:
        raise HTTPException(status_code=400, detail="Invalid 17-character VIN code")
    return {
        "booking_id": "VEC-4491",
        "vin": req.vehicle_vin,
        "status": "SCHEDULED",
        "bay_assigned": "Bay-04"
    }`,

      'VehicleServiceManagement/backend/VehicleService.py': `class VehicleManager:
    def verify_telemetry(self, vin: str):
        return {"engine_status": "NORMAL", "odometer": 42150}`,

      'VehicleServiceManagement/backend/self_heal.py': `def retry_with_circuit_breaker(operation_fn):
    # Automated self-healing remediation decorator
    pass`,

      'VehicleServiceManagement/README.md': `# Vehicle Service Management System (P004)
Autonomous software development loop demonstrating self-healing vehicle booking logic and live bay diagnostics.`
    },
    agentInfo: {
      name: 'Debugger Agent',
      status: 'IN PROGRESS',
      progress: 75,
      started: '11:00:00 AM',
      estimated: '11:04:00 AM',
      subtasks: [
        { id: 1, title: 'VIN 17-character validator', status: 'completed' },
        { id: 2, title: 'Circuit breaker retry logic', status: 'in-progress' }
      ],
      activity: [
        { time: '11:02:10', agent: 'Debugger Agent', action: 'Added VIN regex format guard', status: 'success' }
      ],
      context: {
        role: 'Self-Healing System Engineering',
        model: 'Gemini 3.5 Flash',
        task: 'Self-Healing Vehicle Booking Logic',
        filesModified: 2,
        linesAdded: 95,
        linesRemoved: 8
      }
    },
    terminalLogs: [
      '[INFO] Testing VIN validator regex against 50 simulated inputs',
      '[INFO] All 50 validation cases PASSED'
    ],
    problems: [],
    outputLogs: [
      '[INFO] Compiling vehicle telemetry bindings...',
      '[SUCCESS] Vehicle Service container ready.'
    ],
    debugLogs: [
      '[DEBUG] Slot allocation: Bay-04 reserved for appointment'
    ]
  },

  P005: {
    fileTree: [
      {
        name: 'LibraryManagementSystem',
        path: 'LibraryManagementSystem',
        isFolder: true,
        children: [
          {
            name: 'backend',
            path: 'LibraryManagementSystem/backend',
            isFolder: true,
            children: [
              { name: 'BookController.py', path: 'LibraryManagementSystem/backend/BookController.py', isFolder: false, isModified: true },
              { name: 'MemberService.py', path: 'LibraryManagementSystem/backend/MemberService.py', isFolder: false },
              { name: 'FineCalculator.py', path: 'LibraryManagementSystem/backend/FineCalculator.py', isFolder: false }
            ]
          },
          { name: 'README.md', path: 'LibraryManagementSystem/README.md', isFolder: false }
        ]
      }
    ],
    defaultFile: 'LibraryManagementSystem/backend/BookController.py',
    codeFiles: {
      'LibraryManagementSystem/backend/BookController.py': `from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/library", tags=["library"])

class BookCheckoutRequest(BaseModel):
    isbn: str
    member_id: str
    due_days: Optional[int] = 14

@router.post("/checkout")
def checkout_book(req: BookCheckoutRequest):
    return {
        "transaction_id": "LIB-TX-8812",
        "isbn": req.isbn,
        "member_id": req.member_id,
        "due_date": "2026-09-19",
        "status": "LOANED"
    }`,

      'LibraryManagementSystem/backend/MemberService.py': `class MemberDirectory:
    def check_eligibility(self, member_id: str) -> bool:
        return True`,

      'LibraryManagementSystem/backend/FineCalculator.py': `def calculate_overdue_fine(overdue_days: int) -> float:
    return max(0.0, overdue_days * 0.50)`,

      'LibraryManagementSystem/README.md': `# Library Management System (P005)
A Library Management System that automates book, member, issue-return, due-date, and fine management through a centralized digital platform.`
    },
    agentInfo: {
      name: 'Developer Agent',
      status: 'IN PROGRESS',
      progress: 50,
      started: '11:15:00 AM',
      estimated: '11:20:00 AM',
      subtasks: [
        { id: 1, title: 'Book catalog schema', status: 'completed' },
        { id: 2, title: 'Loan checkout endpoint', status: 'in-progress' }
      ],
      activity: [
        { time: '11:16:40', agent: 'Developer Agent', action: 'Created BookController.py', status: 'success' }
      ],
      context: {
        role: 'Catalog & Loan Systems',
        model: 'Gemini 3.5 Flash',
        task: 'Book Registry & Fine Calculator API',
        filesModified: 3,
        linesAdded: 110,
        linesRemoved: 5
      }
    },
    terminalLogs: [
      '[INFO] Library database connection established',
      '[INFO] BookController.py registered on /library routes'
    ],
    problems: [],
    outputLogs: [
      '[INFO] Building LibraryManagementSystem container...',
      '[SUCCESS] Build ready.'
    ],
    debugLogs: [
      '[DEBUG] Loan limit check passed for Member M-1092'
    ]
  }
}

// Fallback getters for backwards compatibility
export const MOCK_FILE_TREE = PROJECT_WORKSPACES.P001.fileTree
export const MOCK_CODE_FILES = PROJECT_WORKSPACES.P001.codeFiles
export const MOCK_AGENT_INFO = PROJECT_WORKSPACES.P001.agentInfo
export const MOCK_TERMINAL_LOGS = PROJECT_WORKSPACES.P001.terminalLogs
export const MOCK_PROBLEMS = PROJECT_WORKSPACES.P001.problems
export const MOCK_OUTPUT_LOGS = PROJECT_WORKSPACES.P001.outputLogs
export const MOCK_DEBUG_LOGS = PROJECT_WORKSPACES.P001.debugLogs
