# Postman API Testing Guide - Sane AI Tester

This document provides sample request bodies and instructions for testing the newly implemented APIs.

## 1. Worker Management

### Register Worker
- **POST** `{{baseUrl}}/api/workers/register`
```json
{
    "machineId": "mac-001",
    "nickname": "Alpha-Worker",
    "ip": "192.168.1.10",
    "os": "Windows 11"
}
```

### Get All Workers
- **GET** `{{baseUrl}}/api/workers`

### Update Worker Status
- **PUT** `{{baseUrl}}/api/workers/:workerId/status`
```json
{
    "action": "active"
}
```

---

## 2. Task Management

### Create Task
- **POST** `{{baseUrl}}/api/tasks`
```json
{
    "task_id": "task-101",
    "worker_id": "sane-tester-001",
    "prompt": "Test login functionality on example.com",
    "url": "https://example.com/login",
    "priority": "high"
}
```

### Assign Task
- **PUT** `{{baseUrl}}/api/tasks/:taskId/assign`
```json
{
    "workerId": "sane-tester-001"
}
```

### Add Task Action
- **POST** `{{baseUrl}}/api/tasks/:taskId/actions`
```json
{
    "step_number": 1,
    "action_type": "click",
    "selector": "#login-btn",
    "value": "",
    "success": true
}
```

---

## 3. Project Management

### Create Project
- **POST** `{{baseUrl}}/api/projects`
```json
{
    "project_jobj_id": "proj-999",
    "project_name": "Sane AI Website",
    "category": "zohosprint",
    "test_type": "UI Testing",
    "description": "Internal testing project"
}
```

### Sync Zoho Projects
- **POST** `{{baseUrl}}/api/projects/sync`

---

## 4. Ticket Management

### Create Ticket
- **POST** `{{baseUrl}}/api/tickets`
```json
{
    "ticket_id": "TIC-001",
    "project_jobj_id": "proj-999",
    "title": "Button not clickable",
    "description": "Login button is disabled on mobile",
    "status": "Open",
    "priority": "High",
    "severity": "Major"
}
```

### Add Comment
- **POST** `{{baseUrl}}/api/tickets/:ticketId/comments`
```json
{
    "commenter_type": "ai-assistant",
    "commenter_name": "Sane AI",
    "comment_text": "I have analyzed this ticket and started testing.",
    "is_ai_generated": true
}
```

---

## 5. Test Reports

### Generate Report
- **POST** `{{baseUrl}}/api/reports`
```json
{
    "report_id": "REP-001",
    "task_id": "task-101",
    "worker_id": "sane-tester-001",
    "project_name": "Sane AI Website",
    "total_tests": 10,
    "passed_tests": 8,
    "failed_tests": 2,
    "success_rate": 80.0,
    "summary": "Login tests passed, but dashboard failed."
}
```

---

## 6. Error Logs

### Create Error Log
- **POST** `{{baseUrl}}/api/errors`
```json
{
    "error_id": "ERR-500",
    "task_id": "task-101",
    "error_type": "SelectorNotFound",
    "error_message": "Could not find element #dashboard-link",
    "severity": "high",
    "ai_analysis": "The page structure might have changed."
}
```

---

## 7. Analytics

### Get Dashboard Metrics
- **GET** `{{baseUrl}}/api/analytics/dashboard`

### Get Success Rate
- **GET** `{{baseUrl}}/api/analytics/success-rate`

---

## 8. AI Usage

### Log AI Usage
- **POST** `{{baseUrl}}/api/ai-usage`
```json
{
    "api_type": "gpt-4",
    "tokens_used": 150,
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "source": "worker",
    "success": true
}
```

---

## 9. System Configuration

### Create Config
- **POST** `{{baseUrl}}/api/config`
```json
{
    "config_key": "max_retries",
    "config_value": "5",
    "config_type": "number",
    "description": "Max task retries"
}
```

---

## 10. Health & Monitoring

### Detailed Health Check
- **GET** `{{baseUrl}}/api/health/detailed`

### System Metrics
- **GET** `{{baseUrl}}/api/health/metrics`
