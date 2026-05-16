import re
from typing import Any, Optional

def validate_url(url: str) -> bool:
    """Validate URL format"""
    if not url:
        return False
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return url_pattern.match(url) is not None

def validate_worker_id(worker_id: str) -> bool:
    """Validate worker ID format"""
    if not worker_id:
        return False
    pattern = r'^sane-tester-\d{3}$'
    return re.match(pattern, worker_id) is not None

def validate_task_data(data: dict) -> tuple[bool, Optional[str]]:
    """Validate task data"""
    if not data.get('url'):
        return False, "URL is required"
    
    if not validate_url(data['url']):
        return False, "Invalid URL format"
    
    if not data.get('worker_id'):
        return False, "Worker ID is required"
    
    if not validate_worker_id(data['worker_id']):
        return False, "Invalid worker ID format"
    
    return True, None