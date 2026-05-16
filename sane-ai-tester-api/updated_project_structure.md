 Complete File Structure with API Mapping for sane-ai-tester-api
text
sane-ai-tester-api/
├── src/
│   ├── server.js                              # Main entry point - Express app initialization
│   │
│   ├── config/
│   │   ├── database.js                        # PostgreSQL connection pool
│   │   ├── redis.js                           # Redis connection (for queues)
│   │   └── socket.js                          # Socket.IO configuration
│   │
│   ├── controllers/
│   │   ├── workerController.js                # Worker CRUD operations
│   │   ├── taskController.js                  # Task management
│   │   ├── projectController.js               # Zoho projects management
│   │   ├── ticketController.js                # Zoho tickets management
│   │   ├── reportController.js                # Test reports
│   │   ├── errorController.js                 # Error logs
│   │   ├── analyticsController.js             # Metrics & analytics
│   │   ├── aiUsageController.js               # AI API usage tracking
│   │   ├── configController.js                # System configuration
│   │   └── healthController.js                # Health checks
│   │
│   ├── services/
│   │   ├── workerService.js                   # Worker business logic
│   │   ├── taskService.js                     # Task business logic
│   │   ├── projectService.js                  # Project management logic
│   │   ├── ticketService.js                   # Ticket management logic
│   │   ├── reportService.js                   # Report generation
│   │   ├── heartbeatService.js                # Worker heartbeat monitoring
│   │   ├── analyticsService.js                # Analytics calculation
│   │   ├── aiUsageService.js                  # AI token usage tracking
│   │   └── zohoService.js                     # Zoho API integration
│   │
│   ├── repositories/
│   │   ├── workerRepository.js                # Worker DB queries
│   │   ├── taskRepository.js                  # Task DB queries
│   │   ├── taskActionRepository.js            # Task actions DB queries
│   │   ├── projectRepository.js               # Project DB queries
│   │   ├── ticketRepository.js                # Ticket DB queries
│   │   ├── commentRepository.js               # Comments DB queries
│   │   ├── reportRepository.js                # Report DB queries
│   │   ├── errorRepository.js                 # Error DB queries
│   │   ├── analyticsRepository.js             # Analytics DB queries
│   │   ├── aiUsageRepository.js               # AI usage DB queries
│   │   ├── communicationRepository.js         # Agent comms DB queries
│   │   ├── webhookRepository.js               # Webhook logs DB queries
│   │   └── configRepository.js                # Config DB queries
│   │
│   ├── socket/
│   │   ├── socketManager.js                   # Socket.IO event handlers
│   │   ├── workerEvents.js                    # Worker-related socket events
│   │   ├── taskEvents.js                      # Task-related socket events
│   │   └── dashboardEvents.js                 # Dashboard real-time updates
│   │
│   ├── models/
│   │   ├── worker.model.js                    # Worker schema definition
│   │   ├── task.model.js                      # Task schema definition
│   │   ├── project.model.js                   # Project schema definition
│   │   ├── ticket.model.js                    # Ticket schema definition
│   │   ├── comment.model.js                   # Comment schema definition
│   │   ├── report.model.js                    # Report schema definition
│   │   ├── error.model.js                     # Error schema definition
│   │   ├── analytics.model.js                 # Analytics schema definition
│   │   ├── aiUsage.model.js                   # AI usage schema definition
│   │   └── config.model.js                    # Config schema definition
│   │
│   ├── routes/
│   │   ├── index.js                           # Route aggregator
│   │   ├── worker.routes.js                   # Worker endpoints
│   │   ├── task.routes.js                     # Task endpoints
│   │   ├── project.routes.js                  # Project endpoints
│   │   ├── ticket.routes.js                   # Ticket endpoints
│   │   ├── report.routes.js                   # Report endpoints
│   │   ├── error.routes.js                    # Error endpoints
│   │   ├── analytics.routes.js                # Analytics endpoints
│   │   ├── aiUsage.routes.js                  # AI usage endpoints
│   │   ├── config.routes.js                   # Config endpoints
│   │   └── health.routes.js                   # Health endpoints
│   │
│   ├── middleware/
│   │   ├── auth.js                            # JWT authentication
│   │   ├── rateLimit.js                       # Rate limiting
│   │   ├── validation.js                      # Request validation
│   │   ├── logging.js                         # Request logging
│   │   └── errorHandler.js                    # Global error handler
│   │
│   ├── utils/
│   │   ├── logger.js                          # Winston logger
│   │   ├── validators.js                      # Input validators
│   │   ├── helpers.js                         # Helper functions
│   │   ├── constants.js                       # Constants
│   │   └── formatters.js                      # Response formatters
│   │
│   └── queues/
│       ├── taskQueue.js                       # Bull task queue
│       └── workerQueue.js                     # Worker job queue
│
├── logs/
│   ├── error.log
│   ├── combined.log
│   └── socket.log
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md