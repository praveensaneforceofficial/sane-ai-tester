# Priority Levels
PRIORITY_LEVELS = {
    "CRITICAL": {
        "name": "Critical",
        "value": 0,
        "color": "#ef4444",
        "icon": "fa-exclamation-triangle",
        "timeout": 300  # seconds
    },
    "HIGH": {
        "name": "High",
        "value": 1,
        "color": "#f97316",
        "icon": "fa-arrow-up",
        "timeout": 600
    },
    "MEDIUM": {
        "name": "Medium",
        "value": 2,
        "color": "#eab308",
        "icon": "fa-minus",
        "timeout": 1200
    },
    "LOW": {
        "name": "Low",
        "value": 3,
        "color": "#10b981",
        "icon": "fa-arrow-down",
        "timeout": 1800
    },
    "TRIVIAL": {
        "name": "Trivial",
        "value": 4,
        "color": "#94a3b8",
        "icon": "fa-info-circle",
        "timeout": 3600
    }
}

# Priority order for sorting
PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "TRIVIAL"]

def get_priority_by_value(value: int) -> str:
    """Get priority name by value"""
    for key, val in PRIORITY_LEVELS.items():
        if val["value"] == value:
            return key
    return "MEDIUM"

def get_priority_color(priority: str) -> str:
    """Get color for priority"""
    return PRIORITY_LEVELS.get(priority.upper(), PRIORITY_LEVELS["MEDIUM"])["color"]