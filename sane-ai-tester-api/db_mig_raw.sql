-- Create all tables in correct order
-- Run this in your PostgreSQL database

-- 1. worker_registry
CREATE TABLE IF NOT EXISTS worker_registry (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    machine_id TEXT UNIQUE NOT NULL,
    system_ip VARCHAR(50),
    os_platform VARCHAR(50),
    worker_type VARCHAR(50) DEFAULT 'web_local',
    status VARCHAR(20) DEFAULT 'offline',
    version VARCHAR(20),
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. tasks
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) UNIQUE NOT NULL,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    url TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    result_data JSONB,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. task_actions
CREATE TABLE IF NOT EXISTS task_actions (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    action_type VARCHAR(50),
    selector TEXT,
    value TEXT,
    screenshot_path TEXT,
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- 4. zoho_sprint_items
CREATE TABLE IF NOT EXISTS zoho_sprint_items (
    id SERIAL PRIMARY KEY,
    zoho_id VARCHAR(100) UNIQUE NOT NULL,
    sprint_id VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50),
    priority VARCHAR(20),
    assigned_to VARCHAR(100),
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE SET NULL,
    synced_at TIMESTAMP DEFAULT NOW(),
    last_modified TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. test_reports
CREATE TABLE IF NOT EXISTS test_reports (
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
    screenshots JSONB,
    generated_at TIMESTAMP DEFAULT NOW()
);

-- 6. error_logs
CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_id VARCHAR(50) UNIQUE NOT NULL,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id),
    error_type VARCHAR(100),
    error_message TEXT,
    stack_trace TEXT,
    screenshot_path TEXT,
    video_path TEXT,
    severity VARCHAR(20),
    ai_analysis TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. ai_prompts
CREATE TABLE IF NOT EXISTS ai_prompts (
    id SERIAL PRIMARY KEY,
    prompt_id VARCHAR(50) UNIQUE NOT NULL,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    prompt_type VARCHAR(50),
    original_prompt TEXT,
    processed_prompt TEXT,
    ai_response TEXT,
    model_used VARCHAR(50),
    tokens_used INT,
    response_time INT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. analytics_metrics
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    unit VARCHAR(20),
    dimension VARCHAR(100),
    dimension_value VARCHAR(200),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- 9. worker_heartbeats
CREATE TABLE IF NOT EXISTS worker_heartbeats (
    id SERIAL PRIMARY KEY,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id) ON DELETE CASCADE,
    status VARCHAR(20),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    current_task_id VARCHAR(50),
    heartbeat_at TIMESTAMP DEFAULT NOW()
);

-- 10. rag_documents
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    doc_id VARCHAR(100) UNIQUE NOT NULL,
    doc_type VARCHAR(50),
    title VARCHAR(500),
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 11. user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(200),
    role VARCHAR(50) DEFAULT 'viewer',
    session_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. system_config
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20),
    description TEXT,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_status ON worker_registry(status);
CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_task_id ON error_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_task_id ON test_reports(task_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_worker_registry_updated_at 
    BEFORE UPDATE ON worker_registry 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();






-- ============================================
-- ADD MISSING TABLES FOR Sane-AI System
-- ============================================

-- 13. Zoho Projects
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

-- 14. Zoho Tickets
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
    comments_count INT DEFAULT 0,
    attachments_count INT DEFAULT 0,
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

-- 15. Ticket Comments
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    comment_id VARCHAR(100) UNIQUE NOT NULL,
    ticket_id VARCHAR(100) REFERENCES zoho_tickets(ticket_id) ON DELETE CASCADE,
    commenter_type VARCHAR(50),
    commenter_name VARCHAR(100),
    comment_text TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_model_used VARCHAR(50),
    tokens_used INT,
    response_time INT,
    parent_comment_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 16. AI API Usage
CREATE TABLE IF NOT EXISTS ai_api_usage (
    id SERIAL PRIMARY KEY,
    usage_id VARCHAR(50) UNIQUE NOT NULL,
    api_type VARCHAR(50),
    api_endpoint VARCHAR(500),
    request_type VARCHAR(50),
    request_data JSONB,
    response_data JSONB,
    tokens_used INT,
    prompt_tokens INT,
    completion_tokens INT,
    request_duration INT,
    status_code INT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    source VARCHAR(50),
    source_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 17. Agent Communications
CREATE TABLE IF NOT EXISTS agent_communications (
    id SERIAL PRIMARY KEY,
    comm_id VARCHAR(50) UNIQUE NOT NULL,
    from_agent VARCHAR(50),
    to_agent VARCHAR(50),
    message_type VARCHAR(50),
    message_data JSONB,
    message_size INT,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    retry_count INT DEFAULT 0,
    response_time INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 18. Custom Tasks
CREATE TABLE IF NOT EXISTS custom_tasks (
    id SERIAL PRIMARY KEY,
    custom_task_id VARCHAR(50) UNIQUE NOT NULL,
    project_jobj_id VARCHAR(100) REFERENCES zoho_projects(project_jobj_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    test_instructions TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE SET NULL,
    created_by VARCHAR(100),
    report_generated BOOLEAN DEFAULT FALSE,
    report_id VARCHAR(50) REFERENCES test_reports(report_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 19. Test Execution History
CREATE TABLE IF NOT EXISTS test_execution_history (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(50) UNIQUE NOT NULL,
    ticket_id VARCHAR(100) REFERENCES zoho_tickets(ticket_id) ON DELETE CASCADE,
    task_id VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    worker_id VARCHAR(50) REFERENCES worker_registry(worker_id),
    execution_status VARCHAR(50),
    execution_start TIMESTAMP,
    execution_end TIMESTAMP,
    duration INT,
    screenshots_taken INT,
    video_recorded BOOLEAN DEFAULT FALSE,
    video_path TEXT,
    steps_executed INT,
    steps_passed INT,
    steps_failed INT,
    error_summary TEXT,
    ai_analysis TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 20. Zoho Webhook Logs
CREATE TABLE IF NOT EXISTS zoho_webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100),
    payload JSONB,
    ticket_id VARCHAR(100),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    received_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for all new tables
CREATE INDEX IF NOT EXISTS idx_zoho_projects_jobj ON zoho_projects(project_jobj_id);
CREATE INDEX IF NOT EXISTS idx_zoho_tickets_project ON zoho_tickets(project_jobj_id);
CREATE INDEX IF NOT EXISTS idx_zoho_tickets_ai_testing ON zoho_tickets(is_ai_testing);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_source ON ai_api_usage(source);
CREATE INDEX IF NOT EXISTS idx_ai_api_usage_timestamp ON ai_api_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_comm_created ON agent_communications(created_at);
CREATE INDEX IF NOT EXISTS idx_custom_tasks_project ON custom_tasks(project_jobj_id);
CREATE INDEX IF NOT EXISTS idx_test_execution_ticket ON test_execution_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_zoho_webhook_processed ON zoho_webhook_logs(processed);

-- Create update triggers
CREATE TRIGGER update_zoho_projects_updated_at 
    BEFORE UPDATE ON zoho_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zoho_tickets_updated_at 
    BEFORE UPDATE ON zoho_tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_tasks_updated_at 
    BEFORE UPDATE ON custom_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default configs for new features
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('zoho_projects_sync_interval', '3600', 'number', 'Seconds between Zoho projects sync'),
('zoho_tickets_sync_interval', '300', 'number', 'Seconds between Zoho tickets sync'),
('ai_testing_auto_assign', 'true', 'boolean', 'Auto assign tickets to AI testing'),
('max_ai_retries_per_ticket', '3', 'number', 'Maximum AI retries per ticket')
ON CONFLICT (config_key) DO NOTHING;




	CREATE TABLE IF NOT EXISTS git_triggers (
    id SERIAL PRIMARY KEY,
    branch VARCHAR(255) NOT NULL,
    repository VARCHAR(255) NOT NULL,
    pr_number INT NOT NULL,
    commit_sha VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);