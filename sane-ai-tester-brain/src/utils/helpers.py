import uuid
from datetime import datetime

def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix"""
    return f"{prefix}{uuid.uuid4().hex[:8]}"

def get_current_timestamp() -> str:
    """Get ISO format current timestamp"""
    return datetime.now().isoformat()

def format_duration(seconds: float) -> str:
    """Format seconds into human readable duration"""
    if seconds < 60:
        return f"{seconds:.2f}s"
    minutes = int(seconds // 60)
    remaining_seconds = seconds % 60
    return f"{minutes}m {remaining_seconds:.2f}s"

def sanitize_filename(filename: str) -> str:
    """Remove unsafe characters from filename"""
    return "".join([c for c in filename if c.isalnum() or c in (' ', '.', '_', '-')]).strip()