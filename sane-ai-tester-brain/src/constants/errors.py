# Error Messages
ERROR_MESSAGES = {
    # Connection errors
    "CONNECTION_FAILED": "Failed to connect to API Bridge",
    "WEBSOCKET_DISCONNECTED": "WebSocket connection lost",
    "API_TIMEOUT": "API request timeout",
    
    # Worker errors
    "WORKER_NOT_FOUND": "Worker not found",
    "WORKER_OFFLINE": "Worker is offline",
    "WORKER_BUSY": "Worker is busy with another task",
    
    # Task errors
    "TASK_NOT_FOUND": "Task not found",
    "TASK_FAILED": "Task execution failed",
    "TASK_TIMEOUT": "Task execution timeout",
    
    # Validation errors
    "INVALID_URL": "Invalid URL format",
    "INVALID_WORKER_ID": "Invalid worker ID format",
    "MISSING_REQUIRED_FIELD": "Missing required field",
    
    # AI errors
    "AI_SERVICE_UNAVAILABLE": "AI service is unavailable",
    "AI_RATE_LIMIT": "AI API rate limit exceeded",
    "AI_INVALID_RESPONSE": "Invalid response from AI service",
    
    # Zoho errors
    "ZOHO_AUTH_FAILED": "Zoho authentication failed",
    "ZOHO_API_ERROR": "Zoho API error",
    "ZOHO_RATE_LIMIT": "Zoho API rate limit exceeded",
}

# Error Codes
ERROR_CODES = {
    "CONNECTION_FAILED": 5001,
    "WEBSOCKET_DISCONNECTED": 5002,
    "API_TIMEOUT": 5003,
    "WORKER_NOT_FOUND": 4001,
    "WORKER_OFFLINE": 4002,
    "TASK_NOT_FOUND": 4003,
    "TASK_FAILED": 4004,
    "INVALID_URL": 4005,
    "INVALID_WORKER_ID": 4006,
    "AI_SERVICE_UNAVAILABLE": 5004,
    "ZOHO_AUTH_FAILED": 5005,
}