# 🧠 SANE-AI TESTER API

**Central WebSocket Bridge & REST API Server for SANE-AI Testing Platform**

[![Node.js Version](https://img.shields.io/badge/node-18%2B-green.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/socket.io-4.7.2-blue.svg)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

# 📖 Overview

SANE-AI TESTER API is the central backend communication layer for the SANE-AI Testing Platform.

It provides:

- REST APIs for worker & task management
- WebSocket communication using Socket.IO
- PostgreSQL persistence layer
- Auto heartbeat monitoring
- Worker online/offline tracking
- Task execution lifecycle handling
- Structured logging & validation

---

# ✨ Features

- Worker Registration
- Real-time WebSocket Communication
- Task Assignment & Tracking
- Heartbeat Monitoring
- Auto Offline Detection
- REST API Endpoints
- PostgreSQL Persistence
- Request Validation with Joi
- Winston Logging
- Modular Architecture

---

# 🏗️ Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| WebSocket | Socket.io |
| Database | PostgreSQL |
| Logging | Winston |
| Validation | Joi |

---

# 📁 Project Structure

```text
sane-ai-tester-api/
├── src/
│   ├── server.js
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── controllers/
│   │   ├── workerController.js
│   │   ├── taskController.js
│   │   └── healthController.js
│   │
│   ├── services/
│   │   ├── workerService.js
│   │   ├── taskService.js
│   │   └── heartbeatService.js
│   │
│   ├── repositories/
│   │   ├── workerRepository.js
│   │   └── taskRepository.js
│   │
│   ├── socket/
│   │   └── socketManager.js
│   │
│   ├── models/
│   │   ├── worker.model.js
│   │   └── task.model.js
│   │
│   ├── routes/
│   │   ├── worker.routes.js
│   │   ├── task.routes.js
│   │   └── health.routes.js
│   │
│   └── utils/
│       ├── logger.js
│       └── validators.js
│
├── logs/
│   ├── error.log
│   └── combined.log
│
├── package.json
├── .gitignore
└── README.md
```

---

# 🚀 Quick Start

## Verify Installation

### Windows

```batch
node --version
npm --version
```

### Mac/Linux

```bash
node --version
npm --version
```

---

# Install Dependencies

## Windows

```batch
cd sane-ai-tester-api
npm install
```

## Mac/Linux

```bash
cd sane-ai-tester-api
npm install
```

---

# Environment Variables

Create a `.env` file:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=sane_ai_tester

HEARTBEAT_TIMEOUT=60000
```

---

# Run Development Server

## Windows

```batch
npm run dev
```

## Mac/Linux

```bash
npm run dev
```

---

# Verify Server Running

```bash
curl http://localhost:3000/api/health
```

---

# Expected Output

```text
✅ Server started on port 3000
⏰ Heartbeat service started (checks every 10s)
```

---

# REST API Endpoints

## Health

GET `/api/health`

## Workers

- GET `/api/workers`
- GET `/api/workers/:id`
- PUT `/api/workers/:id`
- DELETE `/api/workers/:id`

## Tasks

- GET `/api/tasks`
- GET `/api/tasks/:id`

---

# WebSocket Example

```javascript
const socket = io("http://localhost:3000");

socket.emit("register-worker", {
  workerId: "worker-001",
  name: "AI Worker"
});
```

---

# Logging

Logs are stored inside:

```text
logs/
```

---

# Recommended Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

---

# License

MIT License
