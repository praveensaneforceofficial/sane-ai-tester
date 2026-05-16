from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class TaskStatusEnum(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"

class WorkerStatusEnum(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"

class PriorityEnum(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

# Request Schemas
class TaskCreateRequest(BaseModel):
    worker_id: str = Field(..., description="Worker ID to assign task")
    url: str = Field(..., description="URL to test")
    prompt: Optional[str] = Field(None, description="Optional custom prompt")
    priority: PriorityEnum = Field(PriorityEnum.MEDIUM, description="Task priority")
    
    @validator('url')
    def validate_url(cls, v):
        if not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v
    
    @validator('worker_id')
    def validate_worker_id(cls, v):
        if not v.startswith('sane-tester-'):
            raise ValueError('Worker ID must start with sane-tester-')
        return v

class WorkerRegisterRequest(BaseModel):
    machine_id: str = Field(..., description="Unique machine identifier")
    nickname: str = Field(..., min_length=3, max_length=50, description="Worker nickname")
    system_ip: Optional[str] = None
    os_platform: Optional[str] = None

class ReportRequest(BaseModel):
    project_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    format: str = Field("json", description="Export format: json, html, pdf")

# Response Schemas
class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class WorkerResponse(BaseModel):
    worker_id: str
    nickname: str
    status: WorkerStatusEnum
    system_ip: Optional[str]
    os_platform: Optional[str]
    last_seen: Optional[datetime]
    total_tasks: int = 0
    success_rate: float = 0.0

class TaskResponse(BaseModel):
    id: int
    worker_id: str
    prompt: str
    status: TaskStatusEnum
    created_at: datetime
    completed_at: Optional[datetime]
    duration: Optional[float]
    result: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: datetime
    components: Dict[str, str]

class AnalyticsResponse(BaseModel):
    total_workers: int
    online_workers: int
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    success_rate: float
    token_usage: Dict[str, int]
    timestamp: datetime

# Error Response
class ErrorResponse(BaseModel):
    error: str
    code: int
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

# Pagination
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: str = Field("desc", regex="^(asc|desc)$")

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int