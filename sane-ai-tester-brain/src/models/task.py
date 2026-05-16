from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    TRIVIAL = "Trivial"

class Task(BaseModel):
    id: int
    worker_id: str
    prompt: str
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    result_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[float] = None
    
    class Config:
        use_enum_values = True

class TaskCreate(BaseModel):
    worker_id: str
    url: str
    prompt: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM

class TaskDetail(Task):
    worker_nickname: Optional[str] = None
    retry_count: int = 0
    error_message: Optional[str] = None

class TaskHistory(BaseModel):
    worker_id: str
    tasks: List[Task]
    total: int
    completed: int
    failed: int