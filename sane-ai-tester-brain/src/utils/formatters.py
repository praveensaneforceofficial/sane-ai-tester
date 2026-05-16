from datetime import datetime
from typing import Any

def format_date(date_str: str, format: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format date string"""
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime(format)
    except:
        return date_str

def format_number(num: int, suffix: bool = True) -> str:
    """Format number with K/M/B suffix"""
    if not suffix:
        return f"{num:,}"
    
    if num >= 1_000_000_000:
        return f"{num / 1_000_000_000:.1f}B"
    elif num >= 1_000_000:
        return f"{num / 1_000_000:.1f}M"
    elif num >= 1_000:
        return f"{num / 1_000:.1f}K"
    else:
        return str(num)

def format_percentage(value: float, total: float) -> str:
    """Format as percentage"""
    if total == 0:
        return "0%"
    percentage = (value / total) * 100
    return f"{percentage:.1f}%"

def truncate_string(text: str, max_length: int = 100) -> str:
    """Truncate string to max length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."