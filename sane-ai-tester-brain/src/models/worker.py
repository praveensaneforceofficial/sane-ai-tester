from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class WorkerStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    IDLE = "idle"

class WorkerType(str, Enum):
    WEB_LOCAL = "Web Agents (Local)"
    WEB_REMOTE = "Remote Integrated"
    MOBILE_USB = "Mobile USB"

class Worker(BaseModel):
    worker_id: str
    nickname: str
    machine_id: str
    system_ip: Optional[str] = None
    os_platform: Optional[str] = None
    status: WorkerStatus = WorkerStatus.OFFLINE
    worker_type: Optional[WorkerType] = None
    last_seen: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True

class WorkerDetail(Worker):
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    success_rate: float = 0.0
    current_task: Optional[str] = None
    version: Optional[str] = None

class WorkerCreate(BaseModel):
    nickname: str
    machine_id: str
    system_ip: Optional[str] = None
    os_platform: Optional[str] = None
    worker_type: Optional[WorkerType] = None

class WorkerUpdate(BaseModel):
    nickname: Optional[str] = None
    status: Optional[WorkerStatus] = None
    system_ip: Optional[str] = None