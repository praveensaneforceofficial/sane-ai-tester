# Sane AI Tester API Planned Sheet

## 1. Worker Management APIs
File: `routes/worker.routes.js` → `controllers/workerController.js` → `services/workerService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| GET | `/api/workers` | `getAllWorkers()` | `workerService.getAll()` | Get all workers |
| GET | `/api/workers/:workerId` | `getWorkerById()` | `workerService.getById()` | Get specific worker |
| POST | `/api/workers/register` | `registerWorker()` | `workerService.register()` | Register new worker |
| PUT | `/api/workers/:workerId/status` | `updateWorkerStatus()` | `workerService.updateStatus()` | Update worker status |
| PUT | `/api/workers/:workerId` | `updateWorker()` | `workerService.update()` | Update worker details |
| DELETE | `/api/workers/:workerId` | `deleteWorker()` | `workerService.delete()` | Remove worker |
| GET | `/api/workers/online` | `getOnlineWorkers()` | `workerService.getOnline()` | Get online workers |
| GET | `/api/workers/:workerId/heartbeat` | `getWorkerHeartbeats()` | `workerService.getHeartbeats()` | Get heartbeat history |

## 2. Task Management APIs
File: `routes/task.routes.js` → `controllers/taskController.js` → `services/taskService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| POST | `/api/tasks` | `createTask()` | `taskService.create()` | Create new task |
| GET | `/api/tasks` | `getAllTasks()` | `taskService.getAll()` | Get all tasks |
| GET | `/api/tasks/:taskId` | `getTaskById()` | `taskService.getById()` | Get specific task |
| PUT | `/api/tasks/:taskId/status` | `updateTaskStatus()` | `taskService.updateStatus()` | Update task status |
| PUT | `/api/tasks/:taskId/assign` | `assignTask()` | `taskService.assign()` | Assign task to worker |
| POST | `/api/tasks/:taskId/retry` | `retryTask()` | `taskService.retry()` | Retry failed task |
| DELETE | `/api/tasks/:taskId` | `cancelTask()` | `taskService.cancel()` | Cancel task |
| GET | `/api/tasks/worker/:workerId` | `getTasksByWorker()` | `taskService.getByWorker()` | Get tasks by worker |
| GET | `/api/tasks/status/:status` | `getTasksByStatus()` | `taskService.getByStatus()` | Get tasks by status |
| POST | `/api/tasks/:taskId/actions` | `addTaskAction()` | `taskService.addAction()` | Add task action |
| GET | `/api/tasks/:taskId/actions` | `getTaskActions()` | `taskService.getActions()` | Get task actions |

## 3. Project Management APIs (Zoho Projects)
File: `routes/project.routes.js` → `controllers/projectController.js` → `services/projectService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| POST | `/api/projects` | `createProject()` | `projectService.create()` | Create project |
| GET | `/api/projects` | `getAllProjects()` | `projectService.getAll()` | Get all projects |
| GET | `/api/projects/:projectJobjId` | `getProjectById()` | `projectService.getById()` | Get project by ID |
| PUT | `/api/projects/:projectJobjId` | `updateProject()` | `projectService.update()` | Update project |
| DELETE | `/api/projects/:projectJobjId` | `deleteProject()` | `projectService.delete()` | Delete project |
| GET | `/api/projects/category/:category` | `getProjectsByCategory()` | `projectService.getByCategory()` | Get by category (custom/zohosprint) |
| GET | `/api/projects/active` | `getActiveProjects()` | `projectService.getActive()` | Get active projects |
| POST | `/api/projects/sync` | `syncZohoProjects()` | `projectService.syncZoho()` | Sync from Zoho |

## 4. Ticket Management APIs (Zoho Tickets)
File: `routes/ticket.routes.js` → `controllers/ticketController.js` → `services/ticketService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| POST | `/api/tickets` | `createTicket()` | `ticketService.create()` | Create ticket |
| GET | `/api/tickets` | `getAllTickets()` | `ticketService.getAll()` | Get all tickets |
| GET | `/api/tickets/:ticketId` | `getTicketById()` | `ticketService.getById()` | Get ticket by ID |
| PUT | `/api/tickets/:ticketId` | `updateTicket()` | `ticketService.update()` | Update ticket |
| PUT | `/api/tickets/:ticketId/ai-status` | `updateAiTestingStatus()` | `ticketService.updateAiStatus()` | Update AI testing status |
| GET | `/api/tickets/project/:projectJobjId` | `getTicketsByProject()` | `ticketService.getByProject()` | Get tickets by project |
| GET | `/api/tickets/ai-testing` | `getAiTestingTickets()` | `ticketService.getAiTesting()` | Get AI testing tickets |
| POST | `/api/tickets/:ticketId/comments` | `addComment()` | `ticketService.addComment()` | Add comment to ticket |
| GET | `/api/tickets/:ticketId/comments` | `getTicketComments()` | `ticketService.getComments()` | Get ticket comments |

## 5. Test Report APIs
File: `routes/report.routes.js` → `controllers/reportController.js` → `services/reportService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| POST | `/api/reports` | `generateReport()` | `reportService.generate()` | Generate test report |
| GET | `/api/reports` | `getAllReports()` | `reportService.getAll()` | Get all reports |
| GET | `/api/reports/:reportId` | `getReportById()` | `reportService.getById()` | Get report by ID |
| GET | `/api/reports/task/:taskId` | `getReportByTask()` | `reportService.getByTask()` | Get report by task |
| GET | `/api/reports/worker/:workerId` | `getReportsByWorker()` | `reportService.getByWorker()` | Get reports by worker |
| GET | `/api/reports/project/:projectName` | `getReportsByProject()` | `reportService.getByProject()` | Get reports by project |
| DELETE | `/api/reports/:reportId` | `deleteReport()` | `reportService.delete()` | Delete report |
| GET | `/api/reports/:reportId/download` | `downloadReport()` | `reportService.download()` | Download report file |

## 6. Error Log APIs
File: `routes/error.routes.js` → `controllers/errorController.js` → `services/errorService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| POST | `/api/errors` | `createErrorLog()` | `errorService.create()` | Create error log |
| GET | `/api/errors` | `getAllErrors()` | `errorService.getAll()` | Get all errors |
| GET | `/api/errors/:errorId` | `getErrorById()` | `errorService.getById()` | Get error by ID |
| GET | `/api/errors/task/:taskId` | `getErrorsByTask()` | `errorService.getByTask()` | Get errors by task |
| GET | `/api/errors/worker/:workerId` | `getErrorsByWorker()` | `errorService.getByWorker()` | Get errors by worker |
| PUT | `/api/errors/:errorId/resolve` | `resolveError()` | `errorService.resolve()` | Mark error resolved |
| GET | `/api/errors/severity/:severity` | `getErrorsBySeverity()` | `errorService.getBySeverity()` | Get by severity |

## 7. Analytics & Metrics APIs
File: `routes/analytics.routes.js` → `controllers/analyticsController.js` → `services/analyticsService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| GET | `/api/analytics/dashboard` | `getDashboardMetrics()` | `analyticsService.getDashboard()` | Dashboard metrics |
| GET | `/api/analytics/workers` | `getWorkerAnalytics()` | `analyticsService.getWorkerStats()` | Worker analytics |
| GET | `/api/analytics/tasks` | `getTaskAnalytics()` | `analyticsService.getTaskStats()` | Task analytics |
| GET | `/api/analytics/errors` | `getErrorAnalytics()` | `analyticsService.getErrorStats()` | Error analytics |
| GET | `/api/analytics/success-rate` | `getSuccessRate()` | `analyticsService.getSuccessRate()` | Success rate |
| GET | `/api/analytics/projects` | `getProjectAnalytics()` | `analyticsService.getProjectStats()` | Project analytics |

## 8. AI Usage Tracking APIs
File: `routes/aiUsage.routes.js` → `controllers/aiUsageController.js` → `services/aiUsageService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| POST | `/api/ai-usage` | `logAiUsage()` | `aiUsageService.log()` | Log AI API usage |
| GET | `/api/ai-usage` | `getAiUsage()` | `aiUsageService.getAll()` | Get all usage logs |
| GET | `/api/ai-usage/summary` | `getUsageSummary()` | `aiUsageService.getSummary()` | Get usage summary |
| GET | `/api/ai-usage/tokens` | `getTokenUsage()` | `aiUsageService.getTokenStats()` | Get token stats |
| GET | `/api/ai-usage/source/:source` | `getUsageBySource()` | `aiUsageService.getBySource()` | Get by source (brain/worker) |

## 9. System Configuration APIs
File: `routes/config.routes.js` → `controllers/configController.js` → `services/configService.js`

| Method | Endpoint | Controller Method | Service Method | Description |
|--------|----------|-------------------|----------------|-------------|
| GET | `/api/config` | `getAllConfigs()` | `configService.getAll()` | Get all configs |
| GET | `/api/config/:key` | `getConfigByKey()` | `configService.getByKey()` | Get config by key |
| PUT | `/api/config/:key` | `updateConfig()` | `configService.update()` | Update config |
| POST | `/api/config` | `createConfig()` | `configService.create()` | Create new config |

## 10. Health & Monitoring APIs
File: `routes/health.routes.js` → `controllers/healthController.js`

| Method | Endpoint | Controller Method | Description |
|--------|----------|-------------------|-------------|
| GET | `/api/health` | `healthCheck()` | Basic health check |
| GET | `/api/health/detailed` | `detailedHealthCheck()` | Detailed health check |
| GET | `/api/health/metrics` | `getSystemMetrics()` | System metrics |
| GET | `/api/health/workers` | `getWorkerHealth()` | Worker health summary |

## WebSocket Events (Socket.IO)
File: `socket/socketManager.js`

| Event Name | Direction | Handler Method | Description |
|------------|-----------|----------------|-------------|
| `worker:register` | Client → Server | `handleWorkerRegister()` | Register worker |
| `worker:heartbeat` | Client → Server | `handleWorkerHeartbeat()` | Worker heartbeat |
| `worker:status` | Client → Server | `handleWorkerStatus()` | Worker status update |
| `worker:task:complete` | Client → Server | `handleTaskComplete()` | Task completion |
| `worker:task:error` | Client → Server | `handleTaskError()` | Task error |
| `task:assign` | Server → Client | `emitTaskAssign()` | Assign task to worker |
| `task:cancel` | Server → Client | `emitTaskCancel()` | Cancel task |
| `dashboard:update` | Server → Client | `emitDashboardUpdate()` | Dashboard refresh |
| `worker:online` | Server → Client | `emitWorkerOnline()` | Worker online event |
| `worker:offline` | Server → Client | `emitWorkerOffline()` | Worker offline event |
| `ticket:update` | Server → Client | `emitTicketUpdate()` | Ticket status update |
| `report:generated` | Server → Client | `emitReportGenerated()` | New report available |
