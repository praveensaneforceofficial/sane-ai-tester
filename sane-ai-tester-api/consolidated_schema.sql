-- ==========================================
-- Sane-AI Tester - Consolidated Schema
-- ==========================================

-- 0. Authentication & Users
CREATE TABLE IF NOT EXISTS app_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 1. worker_registry - Worker Registration & Status
CREATE TABLE IF NOT EXISTS worker_registry (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR(50) UNIQUE NOT NULL,      -- e.g., sane-tester-001
    nickname VARCHAR(100) NOT NULL,              -- User-friendly name
    machine_id TEXT UNIQUE NOT NULL,             -- Hardware fingerprint
    system_ip VARCHAR(50),                       -- Local IP address
    os_platform VARCHAR(50),                     -- Windows/Linux/Mac
    worker_type VARCHAR(50) DEFAULT 'web_local', -- web_local, web_remote, mobile_usb
    status VARCHAR(20) DEFAULT 'offline',        -- online, offline, busy
    version VARCHAR(20),                         -- Worker version
    last_seen TIMESTAMP DEFAULT NOW(),           -- Last heartbeat
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_status ON worker_registry(status);
CREATE INDEX IF NOT EXISTS idx_worker_machine_id ON worker_registry(machine_id);

-- 2. tasks - Task Management
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) UNIQUE NOT NULL,         -- UUID format
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,                        -- AI prompt from brain
    url TEXT,                                    -- Target URL
    priority VARCHAR(20) DEFAULT 'medium',       -- critical, high, medium, low
    status VARCHAR(20) DEFAULT 'pending',        -- pending, running, completed, failed, retrying
    result_data JSONB,                           -- Screenshot, video, analysis
    error_message TEXT,                          -- Error if failed
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration INT,                                -- Execution time in ms
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- 3. task_actions - Detailed Task Steps
CREATE TABLE IF NOT EXISTS task_actions (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    action_type VARCHAR(50),                     -- click, fill, navigate, wait, etc.
    selector TEXT,                               -- CSS/XPath selector
    value TEXT,                                  -- Value to enter
    screenshot_path TEXT,                        -- Screenshot for this step
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_actions_task_id ON task_actions(task_id);

-- 4. zoho_projects - Zoho Projects Management
CREATE TABLE IF NOT EXISTS zoho_projects (
    id SERIAL PRIMARY KEY,
    project_jobj_id VARCHAR(100) UNIQUE NOT NULL,
    project_name VARCHAR(500) NOT NULL,
    category VARCHAR(50) DEFAULT 'zohosprint',
    test_type VARCHAR(50),
    mobile_platform VARCHAR(50),
    description TEXT,
    created_date TIMESTAMP DEFAULT NOW(),
    active_flag BOOLEAN DEFAULT TRUE,
    deactivated_date TIMESTAMP,
    last_synced_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zoho_projects_jobj_id ON zoho_projects(project_jobj_id);
CREATE INDEX IF NOT EXISTS idx_zoho_projects_name ON zoho_projects(project_name);

-- 5. zoho_tickets - Zoho Sprint Tickets/Issues
CREATE TABLE IF NOT EXISTS zoho_tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(100) UNIQUE NOT NULL,
    project_jobj_id VARCHAR(100) REFERENCES zoho_projects(project_jobj_id) ON DELETE CASCADE,
    sprint_id VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    priority VARCHAR(20),
    severity VARCHAR(20),
    ticket_type VARCHAR(50),
    assigned_to VARCHAR(100),
    reporter VARCHAR(100),
    is_ai_testing BOOLEAN DEFAULT FALSE,
    ai_testing_status VARCHAR(50),
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE SET NULL,
    custom_fields JSONB,
    zoho_data JSONB,
    created_time TIMESTAMP,
    modified_time TIMESTAMP,
    closed_time TIMESTAMP,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zoho_tickets_ticket_id ON zoho_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_zoho_tickets_project ON zoho_tickets(project_jobj_id);

-- 6. test_reports - Test Execution Reports
CREATE TABLE IF NOT EXISTS test_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id),
    project_name VARCHAR(200),
    total_tests INT DEFAULT 0,
    passed_tests INT DEFAULT 0,
    failed_tests INT DEFAULT 0,
    success_rate DECIMAL(5,2),
    duration INT,
    summary TEXT,
    report_data JSONB,
    video_path TEXT,
    screenshots JSONB,
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_reports_task_id ON test_reports(task_id);

-- 7. error_logs - Detailed Error Tracking
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_id VARCHAR(50) UNIQUE NOT NULL,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id),
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    screenshot_path TEXT,
    severity VARCHAR(20),
    ai_analysis TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_task_id ON error_logs(task_id);

-- 8. ai_api_usage - API Token Usage Tracking
CREATE TABLE IF NOT EXISTS ai_api_usage (
    id SERIAL PRIMARY KEY,
    usage_id VARCHAR(50) UNIQUE NOT NULL,
    api_type VARCHAR(50),
    api_endpoint VARCHAR(500),
    request_type VARCHAR(50),
    tokens_used INT,
    prompt_tokens INT,
    completion_tokens INT,
    request_duration INT,
    status_code INT,
    success BOOLEAN DEFAULT TRUE,
    source VARCHAR(50),
    source_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_api_usage_timestamp ON ai_api_usage(timestamp);

-- 9. system_config - Configuration Settings
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20),
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Default Configs
INSERT INTO system_config (config_key, config_value, config_type, description) 
VALUES 
('zoho_poll_interval', '60', 'number', 'Seconds between Zoho polls'),
('worker_heartbeat_timeout', '60', 'number', 'Seconds before marking worker offline'),
('task_retry_delay', '300', 'number', 'Seconds before retrying failed task'),
('max_concurrent_tasks', '5', 'number', 'Maximum concurrent tasks per worker'),
('record_video_default', 'true', 'boolean', 'Record video by default'),
('ai_model', 'ollama', 'string', 'AI model to use: openai or ollama')
ON CONFLICT (config_key) DO NOTHING;

-- 10. worker_heartbeats - Heartbeat History
CREATE TABLE IF NOT EXISTS worker_heartbeats (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id) ON DELETE CASCADE,
    status VARCHAR(20),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    current_task_id VARCHAR(50),
    heartbeat_at TIMESTAMP DEFAULT NOW()
);

-- 11. ticket_comments - Zoho Comments
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    comment_id VARCHAR(100) UNIQUE NOT NULL,
    ticket_id VARCHAR(100) REFERENCES zoho_tickets(ticket_id) ON DELETE CASCADE,
    commenter_name VARCHAR(100),
    comment_text TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. git_triggers - GitHub Webhook Triggers
CREATE TABLE IF NOT EXISTS git_triggers (
    id SERIAL PRIMARY KEY,
    branch VARCHAR(255) NOT NULL,
    repository VARCHAR(255) NOT NULL,
    pr_number INT NOT NULL,
    commit_sha VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    description TEXT,
    comment TEXT,
    action VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample Data
INSERT INTO app_users (username, password, role) 
VALUES ('admin', 'saneai@2024', 'admin')
ON CONFLICT (username) DO NOTHING;