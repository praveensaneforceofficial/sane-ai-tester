from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class WorkerMetrics(BaseModel):
    worker_id: str
    nickname: str
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    success_rate: float
    avg_duration: float
    status: str
    last_seen: Optional[datetime]

class TaskMetrics(BaseModel):
    total: int
    completed: int
    failed: int
    pending: int
    success_rate: float
    avg_duration: float
    by_priority: Dict[str, int]
    by_hour: List[int]

class TokenMetrics(BaseModel):
    used: int
    remaining: int
    total: int
    used_percentage: float
    daily_usage: List[int]
    by_project: Dict[str, int]
    by_model: Dict[str, int]

class DashboardMetrics(BaseModel):
    workers: Dict[str, int]
    tasks: Dict[str, Any]
    tokens: TokenMetrics
    timestamp: datetime
    trends: List[Dict[str, Any]]

class DailyTrend(BaseModel):
    date: str
    completed: int
    failed: int
    total: int