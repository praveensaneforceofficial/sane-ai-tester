# Open Terminal 2 - Brain
cd sane-ai-tester-brain

# Create Python virtual environment (First time only)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies (First time only)
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env
# Edit .env file with your settings (API_URL, etc.)

# Start the Brain server
python src/main.py

# OR using uvicorn directly
uvicorn src.main:app --reload --port 8000 --host 0.0.0.0




# start

# Terminal 1: API (always running)
cd sane-ai-tester-api && npm run dev

# Terminal 2: Brain (always running)
cd sane-ai-tester-brain && python src/main.py

# Terminal 3: Dashboard dev (for UI changes)
cd sane-ai-tester-brain/dashboard && npm run dev

# Make changes to React code, see updates immediately at http://localhost:5173
# Build for production when done
npm run build

# end

## Project Structure for sane-ai-tester-brain

 sane-ai-tester-brain/
├── src/
│   ├── main.py                          # FastAPI entry point
│   │
│   ├── config/
│   │   ├── settings.py                  # Pydantic settings
│   │   ├── database.py                  # No DB, just API bridge config
│   │   ├── zoho.py                      # Zoho Sprint API config
│   │   └── ai_config.py                 # LLM configs (OpenAI/Ollama)
│   │
│   ├── controllers/
│   │   ├── dashboardController.py       # Dashboard data aggregation
│   │   ├── workerController.py          # Worker status via API bridge
│   │   ├── taskController.py            # Task management via API bridge
│   │   ├── analyticsController.py       # Analytics & metrics
│   │   ├── reportController.py          # Report generation
│   │   └── healthController.py          # Health check
│   │
│   ├── services/
│   │   ├── apiBridgeService.py          # Communication with API server
│   │   ├── zohoService.py               # Zoho Sprint scraping
│   │   ├── aiOrchestratorService.py     # AI task planning & distribution
│   │   ├── ragService.py                # RAG for test cases
│   │   ├── promptService.py             # Prompt engineering & improvement
│   │   ├── analyticsService.py          # Token usage & metrics
│   │   ├── reportService.py             # Test report generation
│   │   └── schedulerService.py          # Job scheduling
│   │
│   ├── ai/
│   │   ├── llm/
│   │   │   ├── openai_client.py         # OpenAI API integration
│   │   │   ├── ollama_client.py         # Local LLM (Llama 3)
│   │   │   └── prompt_templates.py      # Test case prompts
│   │   │
│   │   ├── rag/
│   │   │   ├── vector_store.py          # ChromaDB setup
│   │   │   ├── embeddings.py            # Text embeddings
│   │   │   ├── retriever.py             # Search similar test cases
│   │   │   └── indexer.py               # Index test reports
│   │   │
│   │   └── agents/
│   │       ├── testPlanner.py           # Plans test cases from Zoho
│   │       ├── testImprover.py          # Improves prompts from history
│   │       ├── bugAnalyzer.py           # Analyzes worker errors
│   │       └── reportGenerator.py       # Generates AI summaries
│   │
│   ├── connectors/
│   │   ├── api_bridge/
│   │   │   ├── websocket_client.py      # Socket.IO client
│   │   │   ├── rest_client.py           # HTTP calls to API
│   │   │   ├── event_handlers.py        # Handle API events
│   │   │   └── reconnection.py          # Auto-reconnect
│   │   │
│   │   └── zoho/
│   │       ├── zoho_client.py           # Zoho Sprint API
│   │       ├── zoho_auth.py             # OAuth2 authentication
│   │       ├── zoho_scraper.py          # Polls Zoho for updates
│   │       └── data_mapper.py           # Map Zoho → Internal
│   │
│   ├── routes/
│   │   ├── dashboard.routes.py          # Dashboard endpoints
│   │   ├── workers.routes.py            # Worker endpoints
│   │   ├── tasks.routes.py              # Task endpoints
│   │   ├── analytics.routes.py          # Analytics endpoints
│   │   ├── reports.routes.py            # Report endpoints
│   │   ├── health.routes.py             # Health check
│   │   └── __init__.py
│   │
│   ├── models/
│   │   ├── worker.py                    # Worker data models
│   │   ├── task.py                      # Task data models
│   │   ├── report.py                    # Report models
│   │   ├── analytics.py                 # Analytics models
│   │   └── schemas.py                   # Pydantic schemas
│   │
│   ├── scheduler/
│   │   ├── jobs/
│   │   │   ├── zoho_poller.py           # Polls Zoho every minute
│   │   │   ├── worker_health.py         # Check worker health via API
│   │   │   ├── task_retrier.py          # Retry failed tasks
│   │   │   ├── report_cleaner.py        # Clean old reports
│   │   │   └── analytics_updater.py     # Update analytics
│   │   └── scheduler_manager.py         # APScheduler manager
│   │
│   ├── utils/
│   │   ├── logger.py                    # Logging configuration
│   │   ├── helpers.py                   # Utility functions
│   │   ├── formatters.py                # Date/number formatters
│   │   ├── validators.py                # Data validators
│   │   └── decorators.py                # Custom decorators
│   │
│   ├── constants/
│   │   ├── status.py                    # Status constants
│   │   ├── errors.py                    # Error messages
│   │   ├── priorities.py                # Priority levels
│   │   └── prompts.py                   # AI prompt constants
│   │
│   └── templates/                       # If using server-side templates
│       └── index.html                   # Fallback (React will override)
│
├── dashboard/                           # React Frontend (based on your HTML)
│   ├── public/
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── main.jsx                     # Entry point
│   │   ├── App.jsx                      # Main app component
│   │   ├── index.css                    # Global styles
│   │   │
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Sidebar.jsx          # Navigation menu
│   │   │   │   ├── Header.jsx           # Top bar with search
│   │   │   │   └── Footer.jsx
│   │   │   │
│   │   │   ├── Dashboard/
│   │   │   │   ├── KPICards.jsx         # KPI cards
│   │   │   │   ├── Charts.jsx           # Bar & Donut charts
│   │   │   │   ├── ActiveThreads.jsx    # Active agents list
│   │   │   │   ├── SystemHealth.jsx     # Health status
│   │   │   │   └── HeroBanner.jsx
│   │   │   │
│   │   │   ├── Sprint/
│   │   │   │   ├── KanbanBoard.jsx      # Drag-drop board
│   │   │   │   ├── TaskCard.jsx         # Individual task card
│   │   │   │   └── ColumnHeader.jsx
│   │   │   │
│   │   │   ├── Agents/
│   │   │   │   ├── TreeView.jsx         # D3.js tree visualization
│   │   │   │   ├── BoardView.jsx        # Card-based agent view
│   │   │   │   ├── AgentCard.jsx
│   │   │   │   └── ViewToggle.jsx
│   │   │   │
│   │   │   ├── Analytics/
│   │   │   │   ├── TokenUsageChart.jsx
│   │   │   │   ├── ProjectTable.jsx
│   │   │   │   └── MetricsCards.jsx
│   │   │   │
│   │   │   └── Common/
│   │   │       ├── StatusBadge.jsx
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── ErrorAlert.jsx
│   │   │       └── PriorityBadge.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx            # Main dashboard view
│   │   │   ├── SprintBoard.jsx          # Kanban board view
│   │   │   ├── Agents.jsx               # Agents management view
│   │   │   ├── Analytics.jsx            # Token & metrics view
│   │   │   └── Reports.jsx              # Test reports view
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                   # Axios instance
│   │   │   ├── socket.js                # Socket.IO client
│   │   │   ├── workerService.js         # Worker API calls
│   │   │   ├── taskService.js           # Task API calls
│   │   │   └── analyticsService.js      # Analytics API calls
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js          # WebSocket connection
│   │   │   ├── useWorkers.js            # Worker data fetching
│   │   │   ├── useTasks.js              # Task data fetching
│   │   │   └── useAnalytics.js          # Analytics data
│   │   │
│   │   ├── store/
│   │   │   ├── workerStore.js           # Zustand store for workers
│   │   │   ├── taskStore.js             # Task state
│   │   │   ├── uiStore.js               # UI state (active tab)
│   │   │   └── index.js
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.js            # Date, number formatting
│   │   │   ├── constants.js             # App constants
│   │   │   └── helpers.js
│   │   │
│   │   └── styles/
│   │       ├── globals.css
│   │       └── variables.css
│   │
│   ├── package.json
│   ├── vite.config.js                   # Vite configuration
│   ├── tailwind.config.js               # Tailwind CSS config
│   └── postcss.config.js
│
├── data/                                # Local persistent storage
│   ├── vector_db/                       # ChromaDB storage
│   ├── reports/                         # Generated PDF/HTML reports
│   ├── screenshots/                     # Cached screenshots
│   └── logs/                            # Application logs
│
├── logs/                                # Symlink to data/logs
│   ├── brain.log
│   ├── zoho.log
│   ├── ai.log
│   └── error.log
│
├── scripts/
│   ├── init_db.py                       # Initialize ChromaDB
│   ├── seed_data.py                     # Seed test data
│   ├── migrate.py                       # Run migrations
│   └── build_dashboard.py               # Build React dashboard
│
├── tests/
│   ├── unit/
│   │   ├── test_zoho.py
│   │   ├── test_ai.py
│   │   ├── test_scheduler.py
│   │   └── test_api_bridge.py
│   ├── integration/
│   │   ├── test_workflow.py
│   │   └── test_api.py
│   └── conftest.py
│
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── .gitignore
├── pyproject.toml
├── pytest.ini
└── README.md



