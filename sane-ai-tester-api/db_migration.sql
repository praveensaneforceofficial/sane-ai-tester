Complete Database Schema for Sane-AI System
Based on your three components (API, Brain, Worker), here are all the required tables:

1. worker_registry - Worker Registration & Status
sql
CREATE TABLE worker_registry (
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

CREATE INDEX idx_worker_status ON worker_registry(status);
CREATE INDEX idx_worker_machine_id ON worker_registry(machine_id);
2. tasks - Task Management
sql
CREATE TABLE tasks (
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

CREATE INDEX idx_tasks_worker_id ON tasks(worker_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
3. task_actions - Detailed Task Steps
sql
CREATE TABLE task_actions (
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

CREATE INDEX idx_task_actions_task_id ON task_actions(task_id);
4. zoho_sprint_items - Zoho Sprint Integration
sql
CREATE TABLE zoho_sprint_items (
    id SERIAL PRIMARY KEY,
    zoho_id VARCHAR(100) UNIQUE NOT NULL,        -- Zoho item ID
    sprint_id VARCHAR(100),                      -- Zoho sprint ID
    name VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50),                          -- open, in_progress, completed
    priority VARCHAR(20),
    assigned_to VARCHAR(100),
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE SET NULL,
    synced_at TIMESTAMP DEFAULT NOW(),
    last_modified TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_zoho_sprint_items_zoho_id ON zoho_sprint_items(zoho_id);
CREATE INDEX idx_zoho_sprint_items_sprint_id ON zoho_sprint_items(sprint_id);
5. test_reports - Test Execution Reports
sql
CREATE TABLE test_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id),
    project_name VARCHAR(200),
    total_tests INT DEFAULT 0,
    passed_tests INT DEFAULT 0,
    failed_tests INT DEFAULT 0,
    skipped_tests INT DEFAULT 0,
    success_rate DECIMAL(5,2),
    duration INT,
    summary TEXT,
    report_data JSONB,
    video_path TEXT,
    screenshots JSONB,                           -- Array of screenshot paths
    generated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_test_reports_task_id ON test_reports(task_id);
CREATE INDEX idx_test_reports_worker_id ON test_reports(worker_id);
CREATE INDEX idx_test_reports_project ON test_reports(project_name);
6. error_logs - Detailed Error Tracking
sql
CREATE TABLE error_logs (
    id SERIAL PRIMARY KEY,
    error_id VARCHAR(50) UNIQUE NOT NULL,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id),
    error_type VARCHAR(100),                     -- timeout, selector_not_found, navigation_error
    error_message TEXT,
    stack_trace TEXT,
    screenshot_path TEXT,
    video_path TEXT,
    severity VARCHAR(20),                        -- critical, high, medium, low
    ai_analysis TEXT,                            -- AI suggested fix
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_logs_task_id ON error_logs(task_id);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
7. ai_prompts - Prompt History & Templates
sql
CREATE TABLE ai_prompts (
    id SERIAL PRIMARY KEY,
    prompt_id VARCHAR(50) UNIQUE NOT NULL,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    prompt_type VARCHAR(50),                     -- test_generation, error_analysis, test_improvement
    original_prompt TEXT,
    processed_prompt TEXT,
    ai_response TEXT,
    model_used VARCHAR(50),                      -- gpt-4, llama3, etc.
    tokens_used INT,
    response_time INT,                           -- ms
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_prompts_task_id ON ai_prompts(task_id);
CREATE INDEX idx_ai_prompts_prompt_type ON ai_prompts(prompt_type);
8. analytics_metrics - System Analytics
sql
CREATE TABLE analytics_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    unit VARCHAR(20),
    dimension VARCHAR(100),
    dimension_value VARCHAR(200),
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_metrics_name ON analytics_metrics(metric_name);
CREATE INDEX idx_analytics_metrics_recorded_at ON analytics_metrics(recorded_at);

-- Common metrics to track:
-- total_tasks, completed_tasks, failed_tasks, avg_execution_time
-- token_usage_daily, active_workers, success_rate
9. worker_heartbeats - Heartbeat History
sql
CREATE TABLE worker_heartbeats (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id) ON DELETE CASCADE,
    status VARCHAR(20),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    current_task_id VARCHAR(50),
    heartbeat_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_worker_heartbeats_worker_id ON worker_heartbeats(worker_id);
CREATE INDEX idx_worker_heartbeats_heartbeat_at ON worker_heartbeats(heartbeat_at);
10. rag_documents - RAG Vector Store Metadata
sql
CREATE TABLE rag_documents (
    id SERIAL PRIMARY KEY,
    doc_id VARCHAR(100) UNIQUE NOT NULL,
    doc_type VARCHAR(50),                        -- test_case, error_log, report, prompt
    title VARCHAR(500),
    content TEXT,
    metadata JSONB,
    embedding_vector VECTOR(384),                -- For pgvector extension
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_documents_doc_type ON rag_documents(doc_type);
-- CREATE INDEX idx_rag_documents_embedding ON rag_documents USING ivfflat (embedding_vector vector_cosine_ops);
11. user_sessions - User Authentication (Dashboard)
sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(200),
    role VARCHAR(50) DEFAULT 'viewer',           -- admin, operator, viewer
    session_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_username ON user_sessions(username);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
12. system_config - Configuration Settings
sql
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20),                     -- string, number, boolean, json
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configs
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('zoho_poll_interval', '60', 'number', 'Seconds between Zoho polls'),
('worker_heartbeat_timeout', '60', 'number', 'Seconds before marking worker offline'),
('task_retry_delay', '300', 'number', 'Seconds before retrying failed task'),
('max_concurrent_tasks', '5', 'number', 'Maximum concurrent tasks per worker'),
('record_video_default', 'true', 'boolean', 'Record video by default'),
('ai_model', 'ollama', 'string', 'AI model to use: openai or ollama');