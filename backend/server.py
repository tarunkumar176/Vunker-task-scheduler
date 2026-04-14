from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Float, Boolean, Text, DateTime, ForeignKey, Integer, select, func
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from datetime import datetime, timedelta, date
from pathlib import Path
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt, JWTError
import os, uuid, logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ── Config ────────────────────────────────────────────────────────────────────
DATABASE_URL  = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./dev.db")
JWT_SECRET    = os.environ.get("JWT_SECRET", "dev-secret-change-in-prod")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE    = int(os.environ.get("JWT_EXPIRE_MINUTES", 43200))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ── DB setup ──────────────────────────────────────────────────────────────────
engine = create_async_engine(DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase): pass

async def get_db():
    async with SessionLocal() as session:
        yield session

# ── Models ────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id:           Mapped[str]  = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name:         Mapped[str]  = mapped_column(String)
    email:        Mapped[str]  = mapped_column(String, unique=True, index=True)
    password_hash:Mapped[str]  = mapped_column(String)
    created_at:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    tasks:        Mapped[List["Task"]]    = relationship(back_populates="user", cascade="all, delete")
    projects:     Mapped[List["Project"]] = relationship(back_populates="user", cascade="all, delete")

class Task(Base):
    __tablename__ = "tasks"
    id:               Mapped[str]  = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:          Mapped[str]  = mapped_column(ForeignKey("users.id"))
    title:            Mapped[str]  = mapped_column(String)
    description:      Mapped[str]  = mapped_column(Text, default="")
    date:             Mapped[str]  = mapped_column(String)
    time:             Mapped[str]  = mapped_column(String)
    priority:         Mapped[str]  = mapped_column(String, default="Medium")
    completed:        Mapped[bool] = mapped_column(Boolean, default=False)
    notification_ids: Mapped[str]  = mapped_column(Text, default="[]")
    recurrence:       Mapped[str]  = mapped_column(String, default="none")
    recurrence_days:  Mapped[str]  = mapped_column(Text, default="[]")
    created_at:       Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user:             Mapped["User"] = relationship(back_populates="tasks")

class Project(Base):
    __tablename__ = "projects"
    id:               Mapped[str]   = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:          Mapped[str]   = mapped_column(ForeignKey("users.id"))
    name:             Mapped[str]   = mapped_column(String)
    description:      Mapped[str]   = mapped_column(Text, default="")
    client_name:      Mapped[str]   = mapped_column(String)
    client_phone:     Mapped[str]   = mapped_column(String, default="")
    client_email:     Mapped[str]   = mapped_column(String, default="")
    client_company:   Mapped[str]   = mapped_column(String, default="")
    total_cost:       Mapped[float] = mapped_column(Float, default=0)
    advance_paid:     Mapped[float] = mapped_column(Float, default=0)
    start_date:       Mapped[str]   = mapped_column(String, default="")
    deadline:         Mapped[str]   = mapped_column(String, default="")
    milestone_notes:  Mapped[str]   = mapped_column(Text, default="")
    status:           Mapped[str]   = mapped_column(String, default="Not Started")
    created_at:       Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user:             Mapped["User"]              = relationship(back_populates="projects")
    payments:         Mapped[List["ProjectPayment"]]   = relationship(back_populates="project", cascade="all, delete")
    maintenance:      Mapped[Union["Maintenance", None]]  = relationship(back_populates="project", cascade="all, delete", uselist=False)
    timeline_notes:   Mapped[List["TimelineNote"]]     = relationship(back_populates="project", cascade="all, delete")

class ProjectPayment(Base):
    __tablename__ = "project_payments"
    id:           Mapped[str]   = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id:   Mapped[str]   = mapped_column(ForeignKey("projects.id"))
    amount:       Mapped[float] = mapped_column(Float)
    payment_date: Mapped[str]   = mapped_column(String)
    payment_mode: Mapped[str]   = mapped_column(String, default="Cash")
    note:         Mapped[str]   = mapped_column(Text, default="")
    created_at:   Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    project:      Mapped["Project"] = relationship(back_populates="payments")

class TimelineNote(Base):
    __tablename__ = "project_timeline_notes"
    id:         Mapped[str]  = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str]  = mapped_column(ForeignKey("projects.id"))
    note:       Mapped[str]  = mapped_column(Text)
    note_date:  Mapped[str]  = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    project:    Mapped["Project"] = relationship(back_populates="timeline_notes")

class Maintenance(Base):
    __tablename__ = "maintenance_contracts"
    id:             Mapped[str]   = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id:     Mapped[str]   = mapped_column(ForeignKey("projects.id"), unique=True)
    plan_name:      Mapped[str]   = mapped_column(String, default="")
    start_date:     Mapped[str]   = mapped_column(String)
    cost:           Mapped[float] = mapped_column(Float, default=0)
    billing_cycle:  Mapped[str]   = mapped_column(String, default="Monthly")
    notes:          Mapped[str]   = mapped_column(Text, default="")
    renewal_status: Mapped[str]   = mapped_column(String, default="Active")
    next_due_date:  Mapped[str]   = mapped_column(String, default="")
    total_renewals: Mapped[int]   = mapped_column(Integer, default=0)
    created_at:     Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    project:        Mapped["Project"]              = relationship(back_populates="maintenance")
    payments:       Mapped[List["MaintenancePayment"]] = relationship(back_populates="maintenance", cascade="all, delete")

class MaintenancePayment(Base):
    __tablename__ = "maintenance_payments"
    id:             Mapped[str]   = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    maintenance_id: Mapped[str]   = mapped_column(ForeignKey("maintenance_contracts.id"))
    amount:         Mapped[float] = mapped_column(Float)
    paid_date:      Mapped[str]   = mapped_column(String)
    billing_cycle:  Mapped[str]   = mapped_column(String)
    payment_mode:   Mapped[str]   = mapped_column(String, default="Cash")
    invoice_note:   Mapped[str]   = mapped_column(Text, default="")
    next_due_date:  Mapped[str]   = mapped_column(String, default="")
    created_at:     Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    maintenance:    Mapped["Maintenance"] = relationship(back_populates="payments")

# ── Auth helpers ──────────────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

def hash_password(p: str) -> str: return pwd_ctx.hash(p)
def verify_password(p: str, h: str) -> bool: return pwd_ctx.verify(p, h)

def create_token(user_id: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE)
    return jwt.encode({"sub": user_id, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer), db: AsyncSession = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ── Maintenance helpers ───────────────────────────────────────────────────────
CYCLE_DAYS = {"Monthly": 30, "Quarterly": 90, "Half Yearly": 180, "Yearly": 365}

def calc_next_due(from_date: str, cycle: str) -> str:
    try:
        d = datetime.strptime(from_date, "%Y-%m-%d").date()
        days = CYCLE_DAYS.get(cycle, 30)
        return (d + timedelta(days=days)).strftime("%Y-%m-%d")
    except Exception:
        return from_date

def days_left(due_date: str) -> int:
    try:
        d = datetime.strptime(due_date, "%Y-%m-%d").date()
        return (d - datetime.utcnow().date()).days
    except Exception:
        return 0

# ── Pydantic schemas ──────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    name: str
    email: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

class TaskIn(BaseModel):
    title: str
    description: Optional[str] = ""
    date: str
    time: str
    priority: Optional[str] = "Medium"
    recurrence: Optional[str] = "none"
    recurrence_days: Optional[str] = "[]"
    notification_ids: Optional[str] = "[]"

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    notification_ids: Optional[str] = None

class MigrateTaskIn(BaseModel):
    title: str
    description: Optional[str] = ""
    date: str
    time: str
    priority: Optional[str] = "Medium"
    recurrence: Optional[str] = "none"
    recurrence_days: Optional[str] = "[]"
    notification_ids: Optional[str] = "[]"
    migrated_local_id: Optional[str] = None

class MigrateIn(BaseModel):
    tasks: List[MigrateTaskIn]

class ProjectIn(BaseModel):
    name: str
    description: Optional[str] = ""
    client_name: str
    client_phone: Optional[str] = ""
    client_email: Optional[str] = ""
    client_company: Optional[str] = ""
    total_cost: Optional[float] = 0
    advance_paid: Optional[float] = 0
    start_date: Optional[str] = ""
    deadline: Optional[str] = ""
    milestone_notes: Optional[str] = ""
    status: Optional[str] = "Not Started"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    client_company: Optional[str] = None
    total_cost: Optional[float] = None
    advance_paid: Optional[float] = None
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    milestone_notes: Optional[str] = None
    status: Optional[str] = None

class PaymentIn(BaseModel):
    amount: float
    payment_date: str
    payment_mode: Optional[str] = "Cash"
    note: Optional[str] = ""

class NoteIn(BaseModel):
    note: str

class MaintenanceIn(BaseModel):
    plan_name: Optional[str] = ""
    start_date: str
    cost: Optional[float] = 0
    billing_cycle: Optional[str] = "Monthly"
    notes: Optional[str] = ""
    renewal_status: Optional[str] = "Active"

class MaintenanceUpdate(BaseModel):
    plan_name: Optional[str] = None
    cost: Optional[float] = None
    billing_cycle: Optional[str] = None
    notes: Optional[str] = None
    renewal_status: Optional[str] = None
    next_due_date: Optional[str] = None

class MaintenancePaymentIn(BaseModel):
    amount: float
    paid_date: str
    billing_cycle: str
    payment_mode: Optional[str] = "Cash"
    invoice_note: Optional[str] = ""

# ── App + Router ──────────────────────────────────────────────────────────────
app = FastAPI(title="Vynker Scheduler API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
router = APIRouter(prefix="/api")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database tables created/verified")

# ── Auth routes ───────────────────────────────────────────────────────────────
@router.post("/auth/register")
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(id=str(uuid.uuid4()), name=body.name, email=body.email.lower(), password_hash=hash_password(body.password))
    db.add(user)
    await db.commit()
    token = create_token(user.id)
    return {"access_token": token, "user_id": user.id, "name": user.name, "email": user.email}

@router.post("/auth/login")
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user.id)
    return {"access_token": token, "user_id": user.id, "name": user.name, "email": user.email}

@router.get("/auth/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}

# ── Task routes ───────────────────────────────────────────────────────────────
def task_out(t: Task) -> dict:
    return {"id": t.id, "title": t.title, "description": t.description, "date": t.date,
            "time": t.time, "priority": t.priority, "completed": t.completed,
            "notification_ids": t.notification_ids, "recurrence": t.recurrence,
            "recurrence_days": t.recurrence_days, "created_at": t.created_at.isoformat() if t.created_at else ""}

@router.get("/tasks/date/{date}")
async def get_tasks_by_date(date: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.user_id == user.id, Task.date == date).order_by(Task.time))
    return [task_out(t) for t in result.scalars().all()]

@router.get("/tasks")
async def get_all_tasks(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.user_id == user.id).order_by(Task.date, Task.time))
    return [task_out(t) for t in result.scalars().all()]

@router.post("/tasks")
async def create_task(body: TaskIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    task = Task(id=str(uuid.uuid4()), user_id=user.id, title=body.title, description=body.description or "",
                date=body.date, time=body.time, priority=body.priority or "Medium",
                recurrence=body.recurrence or "none", recurrence_days=body.recurrence_days or "[]",
                notification_ids=body.notification_ids or "[]")
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task_out(task)

@router.put("/tasks/{task_id}")
async def update_task(task_id: str, body: TaskUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user.id))
    task = result.scalar_one_or_none()
    if not task: raise HTTPException(404, "Task not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(task, field, val)
    await db.commit()
    await db.refresh(task)
    return task_out(task)

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user.id))
    task = result.scalar_one_or_none()
    if not task: raise HTTPException(404, "Task not found")
    await db.delete(task)
    await db.commit()
    return {"ok": True}

@router.delete("/tasks/completed/clear")
async def clear_completed(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.user_id == user.id, Task.completed == True))
    for t in result.scalars().all():
        await db.delete(t)
    await db.commit()
    return {"ok": True}

@router.post("/tasks/migrate")
async def migrate_tasks(body: MigrateIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    migrated = 0
    skipped = 0
    for t in body.tasks:
        task = Task(id=str(uuid.uuid4()), user_id=user.id, title=t.title, description=t.description or "",
                    date=t.date, time=t.time, priority=t.priority or "Medium",
                    recurrence=t.recurrence or "none", recurrence_days=t.recurrence_days or "[]",
                    notification_ids=t.notification_ids or "[]")
        db.add(task)
        migrated += 1
    await db.commit()
    return {"migrated": migrated, "skipped": skipped}

# ── Project routes ────────────────────────────────────────────────────────────
def project_summary(p: Project) -> dict:
    total_paid = p.advance_paid + sum(pay.amount for pay in p.payments)
    remaining = max(0, p.total_cost - total_paid)
    pct = round((total_paid / p.total_cost * 100), 1) if p.total_cost > 0 else 0
    overdue = 0
    days_to_deadline = None
    if p.deadline:
        try:
            dl = datetime.strptime(p.deadline, "%Y-%m-%d").date()
            diff = (datetime.utcnow().date() - dl).days
            overdue = max(0, diff)
            days_to_deadline = (dl - datetime.utcnow().date()).days
        except Exception:
            pass
    return {
        "id": p.id, "name": p.name, "description": p.description,
        "client_name": p.client_name, "client_phone": p.client_phone,
        "client_email": p.client_email, "client_company": p.client_company,
        "total_cost": p.total_cost, "advance_paid": p.advance_paid,
        "total_paid": total_paid, "remaining": remaining, "payment_pct": pct,
        "start_date": p.start_date, "deadline": p.deadline,
        "milestone_notes": p.milestone_notes, "status": p.status,
        "overdue_days": overdue, "days_to_deadline": days_to_deadline,
        "payment_count": len(p.payments), "created_at": p.created_at.isoformat() if p.created_at else "",
    }

def project_detail(p: Project) -> dict:
    base = project_summary(p)
    base["payments"] = [{"id": pay.id, "project_id": pay.project_id, "amount": pay.amount,
                          "payment_date": pay.payment_date, "payment_mode": pay.payment_mode,
                          "note": pay.note, "created_at": pay.created_at.isoformat() if pay.created_at else ""}
                         for pay in sorted(p.payments, key=lambda x: x.payment_date)]
    base["timeline_notes"] = [{"id": n.id, "note": n.note, "note_date": n.note_date,
                                 "created_at": n.created_at.isoformat() if n.created_at else ""}
                                for n in sorted(p.timeline_notes, key=lambda x: x.created_at)]
    if p.maintenance:
        m = p.maintenance
        dl = days_left(m.next_due_date) if m.next_due_date else None
        base["maintenance"] = {
            "id": m.id, "project_id": m.project_id, "plan_name": m.plan_name,
            "start_date": m.start_date, "cost": m.cost, "billing_cycle": m.billing_cycle,
            "notes": m.notes, "status": m.renewal_status, "next_due_date": m.next_due_date,
            "total_renewals": m.total_renewals, "days_left": dl,
            "overdue_days": max(0, -(dl or 0)) if dl is not None and dl < 0 else 0,
            "payments": [{"id": mp.id, "amount": mp.amount, "paid_date": mp.paid_date,
                           "billing_cycle": mp.billing_cycle, "payment_mode": mp.payment_mode,
                           "invoice_note": mp.invoice_note, "next_due_date": mp.next_due_date}
                          for mp in sorted(m.payments, key=lambda x: x.paid_date)],
        }
    else:
        base["maintenance"] = None
    return base

from sqlalchemy.orm import selectinload

@router.get("/projects")
async def get_projects(status: Optional[str] = None, search: Optional[str] = None,
                        sort: Optional[str] = None, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    q = select(Project).where(Project.user_id == user.id).options(selectinload(Project.payments), selectinload(Project.maintenance), selectinload(Project.timeline_notes))
    if status and status not in ("All", "Overdue"):
        q = q.where(Project.status == status)
    result = await db.execute(q)
    projects = result.scalars().all()
    summaries = [project_summary(p) for p in projects]
    if status == "Overdue":
        summaries = [s for s in summaries if s["overdue_days"] > 0]
    if search:
        sl = search.lower()
        summaries = [s for s in summaries if sl in s["name"].lower() or sl in s["client_name"].lower()]
    if sort == "deadline":
        summaries.sort(key=lambda s: s["deadline"] or "9999")
    elif sort == "pending":
        summaries.sort(key=lambda s: s["remaining"], reverse=True)
    else:
        summaries.sort(key=lambda s: s["created_at"], reverse=True)
    return summaries

@router.get("/projects/{project_id}")
async def get_project(project_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id)
                               .options(selectinload(Project.payments), selectinload(Project.maintenance).selectinload(Maintenance.payments), selectinload(Project.timeline_notes)))
    p = result.scalar_one_or_none()
    if not p: raise HTTPException(404, "Project not found")
    return project_detail(p)

@router.post("/projects")
async def create_project(body: ProjectIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = Project(id=str(uuid.uuid4()), user_id=user.id, **body.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return {"id": p.id, "name": p.name, "status": p.status}

@router.put("/projects/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    p = result.scalar_one_or_none()
    if not p: raise HTTPException(404, "Project not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(p, field, val)
    await db.commit()
    return {"ok": True}

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    p = result.scalar_one_or_none()
    if not p: raise HTTPException(404, "Project not found")
    await db.delete(p)
    await db.commit()
    return {"ok": True}

@router.post("/projects/{project_id}/payments")
async def add_payment(project_id: str, body: PaymentIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    p = result.scalar_one_or_none()
    if not p: raise HTTPException(404, "Project not found")
    pay = ProjectPayment(id=str(uuid.uuid4()), project_id=project_id, amount=body.amount,
                          payment_date=body.payment_date, payment_mode=body.payment_mode, note=body.note or "")
    db.add(pay)
    if p.status == "Not Started": p.status = "In Progress"
    await db.commit()
    return {"ok": True, "id": pay.id}

@router.delete("/projects/{project_id}/payments/{payment_id}")
async def delete_payment(project_id: str, payment_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectPayment).where(ProjectPayment.id == payment_id, ProjectPayment.project_id == project_id))
    pay = result.scalar_one_or_none()
    if not pay: raise HTTPException(404, "Payment not found")
    await db.delete(pay)
    await db.commit()
    return {"ok": True}

@router.post("/projects/{project_id}/notes")
async def add_note(project_id: str, body: NoteIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    if not result.scalar_one_or_none(): raise HTTPException(404, "Project not found")
    note = TimelineNote(id=str(uuid.uuid4()), project_id=project_id, note=body.note,
                         note_date=datetime.utcnow().strftime("%Y-%m-%d"))
    db.add(note)
    await db.commit()
    return {"ok": True}

# ── Maintenance routes ────────────────────────────────────────────────────────
@router.post("/projects/{project_id}/maintenance")
async def create_maintenance(project_id: str, body: MaintenanceIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == user.id))
    if not result.scalar_one_or_none(): raise HTTPException(404, "Project not found")
    existing = await db.execute(select(Maintenance).where(Maintenance.project_id == project_id))
    if existing.scalar_one_or_none(): raise HTTPException(400, "Maintenance contract already exists")
    next_due = calc_next_due(body.start_date, body.billing_cycle or "Monthly")
    m = Maintenance(id=str(uuid.uuid4()), project_id=project_id, plan_name=body.plan_name or "",
                     start_date=body.start_date, cost=body.cost or 0,
                     billing_cycle=body.billing_cycle or "Monthly", notes=body.notes or "",
                     renewal_status=body.renewal_status or "Active", next_due_date=next_due)
    db.add(m)
    await db.commit()
    return {"ok": True, "id": m.id, "next_due_date": next_due}

@router.put("/projects/{project_id}/maintenance")
async def update_maintenance(project_id: str, body: MaintenanceUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Maintenance).where(Maintenance.project_id == project_id))
    m = result.scalar_one_or_none()
    if not m: raise HTTPException(404, "Maintenance contract not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(m, field, val)
    if body.billing_cycle and not body.next_due_date:
        m.next_due_date = calc_next_due(m.start_date, body.billing_cycle)
    await db.commit()
    return {"ok": True}

@router.post("/projects/{project_id}/maintenance/payments")
async def add_maintenance_payment(project_id: str, body: MaintenancePaymentIn, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Maintenance).where(Maintenance.project_id == project_id))
    m = result.scalar_one_or_none()
    if not m: raise HTTPException(404, "Maintenance contract not found")
    next_due = calc_next_due(body.paid_date, body.billing_cycle)
    mp = MaintenancePayment(id=str(uuid.uuid4()), maintenance_id=m.id, amount=body.amount,
                             paid_date=body.paid_date, billing_cycle=body.billing_cycle,
                             payment_mode=body.payment_mode or "Cash", invoice_note=body.invoice_note or "",
                             next_due_date=next_due)
    db.add(mp)
    m.next_due_date = next_due
    m.total_renewals += 1
    m.renewal_status = "Active"
    await db.commit()
    return {"ok": True, "next_due_date": next_due}

@router.get("/maintenance/upcoming")
async def get_upcoming_renewals(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Maintenance).join(Project).where(Project.user_id == user.id, Maintenance.renewal_status.in_(["Active", "Upcoming"])).options(selectinload(Maintenance.project)))
    contracts = result.scalars().all()
    upcoming = []
    for m in contracts:
        dl = days_left(m.next_due_date) if m.next_due_date else None
        if dl is not None and dl <= 30:
            upcoming.append({"id": m.id, "project_id": m.project_id, "project_name": m.project.name,
                              "plan_name": m.plan_name, "cost": m.cost, "billing_cycle": m.billing_cycle,
                              "next_due_date": m.next_due_date, "days_left": dl, "status": m.renewal_status})
    upcoming.sort(key=lambda x: x["days_left"])
    return upcoming

# ── Dashboard ─────────────────────────────────────────────────────────────────
@router.get("/dashboard")
async def dashboard(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    today = datetime.utcnow().date().strftime("%Y-%m-%d")
    projects_res = await db.execute(select(Project).where(Project.user_id == user.id).options(selectinload(Project.payments)))
    projects = projects_res.scalars().all()
    tasks_res = await db.execute(select(Task).where(Task.user_id == user.id, Task.date == today, Task.completed == False))
    pending_today = len(tasks_res.scalars().all())
    active = sum(1 for p in projects if p.status in ("In Progress", "Not Started"))
    maintenance_res = await db.execute(select(Maintenance).join(Project).where(Project.user_id == user.id).options(selectinload(Maintenance.project)))
    contracts = maintenance_res.scalars().all()
    upcoming = []
    for m in contracts:
        dl = days_left(m.next_due_date) if m.next_due_date else None
        if dl is not None and dl <= 7:
            upcoming.append({"project_name": m.project.name, "days_left": dl, "cost": m.cost})
    return {"total_projects": len(projects), "active_projects": active,
            "pending_tasks_today": pending_today, "upcoming_renewals": upcoming}

app.include_router(router)

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
