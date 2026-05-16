import re
import json
from typing import Dict, Any, Optional
from datetime import datetime

def sanitize_string(text: str) -> str:
    """Sanitize string for safe use"""
    if not text:
        return ""
    # Remove special characters
    text = re.sub(r'[^\w\s\-\.]', '', text)
    return text.strip()

def parse_json_safely(text: str) -> Optional[Dict[str, Any]]:
    """Parse JSON safely without crashing"""
    if not text:
        return None
    
    # Try to extract JSON from text
    json_match = re.search(r'\{.*\}|\[.*\]', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except:
            pass
    
    try:
        return json.loads(text)
    except:
        return None

def format_duration(seconds: float) -> str:
    """Format duration in human-readable format"""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}m"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}h"

def get_time_ago(timestamp: str) -> str:
    """Get time ago string"""
    if not timestamp:
        return "Never"
    
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        now = datetime.now()
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60}m ago"
        else:
            return f"{diff.seconds}s ago"
    except:
        return "Unknown"