# 🧪 Sane-AI Tester Worker

AI-powered test execution agent with Playwright automation.

## Features
- 🤖 AI-driven test script generation
- 🎭 Playwright browser automation
- 📹 Screen recording for debugging
- 📸 Screenshot capture
- 🔄 Real-time communication with Brain
- 🖥️ Electron GUI for monitoring

## Installation

```bash
cd sane-ai-tester-worker
npm install
npm run setup
npm start
Or with Electron GUI:

bash
npm run electron
```

#Project Structure for sane-ai-tester-worker

sane-ai-tester-worker/
├── src/
│   ├── index.js                       # Main entry point (CLI + Electron)
│   ├── main.js                        # Electron main process
│   ├── preload.js                     # Electron preload script
│   │
│   ├── core/
│   │   ├── agent.js                   # Worker agent core logic
│   │   ├── playwrightRunner.js        # Playwright automation runner
│   │   ├── aiExecutor.js              # AI-powered task executor
│   │   └── scriptGenerator.js         # Generate test scripts from AI prompts
│   │
│   ├── ai/
│   │   ├── promptProcessor.js         # Process AI prompts from brain
│   │   ├── actionParser.js            # Parse AI actions into Playwright commands
│   │   └── errorAnalyzer.js           # Analyze errors and suggest fixes
│   │
│   ├── browser/
│   │   ├── browserManager.js          # Manage browser instances
│   │   ├── recorder.js                # Record screen/video
│   │   ├── screenshot.js              # Take screenshots
│   │   └── domAnalyzer.js             # Analyze DOM for debugging
│   │
│   ├── report/
│   │   ├── reportGenerator.js         # Generate task reports
│   │   ├── errorLogger.js             # Log errors with context
│   │   └── videoEncoder.js            # Encode recorded videos
│   │
│   ├── network/
│   │   ├── socketClient.js            # Socket.IO client wrapper
│   │   ├── apiClient.js               # REST API client
│   │   └── heartbeat.js               # Heartbeat manager
│   │
│   ├── utils/
│   │   ├── logger.js                  # Logging utility
│   │   ├── config.js                  # Configuration loader
│   │   ├── helpers.js                 # Helper functions
│   │   └── validators.js              # Input validators
│   │
│   └── constants/
│       ├── status.js                  # Status constants
│       ├── errors.js                  # Error messages
│       └── selectors.js               # Common selectors
│
├── recordings/                         # Screen recordings storage
│   ├── videos/
│   ├── screenshots/
│   └── logs/
│
├── scripts/
│   ├── postinstall.js                 # Post-install setup
│   └── playwright-setup.js            # Playwright browser setup
│
├── tests/
│   ├── unit/
│   │   ├── test_agent.js
│   │   ├── test_playwright.js
│   │   └── test_ai.js
│   └── integration/
│       └── test_workflow.js
│
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
├── icon.png                           # Electron app icon
└── forge.config.js                    # Electron builder config (if needed)