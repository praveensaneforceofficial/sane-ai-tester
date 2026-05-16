from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TestResult(BaseModel):
    task_id: int
    name: str
    status: str
    duration: float
    error: Optional[str] = None
    screenshot: Optional[str] = None
    timestamp: datetime

class TestReport(BaseModel):
    report_id: str
    project_name: str
    timestamp: datetime
    total_tests: int
    passed: int
    failed: int
    skipped: int
    duration: float
    pass_rate: float
    summary: str
    failed_tests: List[Dict[str, Any]]
    test_results: Optional[List[TestResult]] = None

class ReportExport(BaseModel):
    format: str = "json"  # json, html, pdf
    include_screenshots: bool = False
    include_details: bool = True
    date_range_start: Optional[datetime] = None
    date_range_end: Optional[datetime] = None

class FailedTestReport(BaseModel):
    total_failed: int
    failed_tests: List[Dict[str, Any]]
    generated_at: datetime
    summary: Optional[str] = None