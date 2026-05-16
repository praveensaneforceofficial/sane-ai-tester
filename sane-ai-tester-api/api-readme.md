# 🧠 SANE-AI TESTER API

**Central WebSocket Bridge & REST API Server for SANE-AI Testing Platform**

[![Node.js Version](https://img.shields.io/badge/node-18%2B-green.svg)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/socket.io-4.7.2-blue.svg)](https://socket.io/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 Overview

SANE-AI API acts as the central communication hub between the **Brain Controller** and **Worker Agents**. It manages WebSocket connections, task distribution, real-time status updates, and persistent data storage.

### Key Features

- 🔌 **Real-time WebSocket Communication** - Bidirectional between Brain and Workers
- 📡 **REST API Endpoints** - For dashboard and external integrations
- 💾 **PostgreSQL Database** - Persistent storage for workers and tasks
- 🔄 **Auto-offline Detection** - Automatically marks inactive workers offline
- 📊 **Task Management** - Create, queue, and track test tasks
- 🏗️ **SOLID Architecture** - Clean, maintainable, and scalable codebase

## 🏗️ Architecture

### Component Responsibilities

| Component | Role | Communication |
|-----------|------|---------------|
| **Brain** | Task planning, Zoho scraping, AI decision making | REST + WebSocket |
| **API** | Central bridge, message routing, data persistence | WebSocket + REST |
| **Worker** | Test execution, Playwright automation, AI error fixing | WebSocket |
| **Database** | Workers registry, tasks history, results storage | SQL |

### Data Flow

1. **Brain** creates test task → sends to **API** via REST/WebSocket
2. **API** stores task in **PostgreSQL** → forwards to **Worker**
3. **Worker** executes test → captures screenshot → sends result to **API**
4. **API** updates task status → notifies **Brain** and **Dashboard**
5. **Auto-offline** checks every 10s → marks inactive workers offline

### Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| WebSocket | Socket.io |
| Database | PostgreSQL |
| Logging | Winston |
| Validation | Joi |

## 📁 Project Structure
sane-ai-tester-api/
├── src/
│ ├── server.js # Entry point - Initializes server, routes, WebSocket
│ │
│ ├── config/
│ │ └── database.js # Database connection pool & configuration
│ │
│ ├── controllers/
│ │ ├── workerController.js # Worker REST endpoints (GET, PUT, DELETE)
│ │ ├── taskController.js # Task REST endpoints (GET history)
│ │ └── healthController.js # Health check endpoint
│ │
│ ├── services/
│ │ ├── workerService.js # Worker business logic (register, status, activity)
│ │ ├── taskService.js # Task business logic (create, complete, history)
│ │ └── heartbeatService.js # Auto-offline logic (runs every 10 seconds)
│ │
│ ├── repositories/
│ │ ├── workerRepository.js # Worker DB operations (CRUD, status updates)
│ │ └── taskRepository.js # Task DB operations (insert, update, query)
│ │
│ ├── socket/
│ │ └── socketManager.js # All Socket.IO event handlers in one file
│ │
│ ├── models/
│ │ ├── worker.model.js # Worker data structure (toJSON, isOnline)
│ │ └── task.model.js # Task data structure (toJSON)
│ │
│ ├── routes/
│ │ ├── worker.routes.js /api/workers routes
│ │ ├── task.routes.js /api/tasks routes
│ │ └── health.routes.js /api/health routes
│ │
│ └── utils/
│ ├── logger.js # Winston logger (console + file)
│ └── validators.js # Joi input validation schemas
│
├── logs/ # Auto-generated log files
│ ├── error.log # Error-level logs only
│ └── combined.log # All logs
│
├── package.json # Dependencies & scripts
├── .gitignore # Git ignore rules
└── README.md # Project documentation



### File Purpose Quick Reference

| File | Purpose | Depends On |
|------|---------|------------|
| `server.js` | App entry point | All modules |
| `database.js` | DB connection | - |
| `*Controller.js` | Handle HTTP requests | Service layer |
| `*Service.js` | Business logic | Repository layer |
| `*Repository.js` | Database operations | Database |
| `*.model.js` | Data structure | - |
| `socketManager.js` | WebSocket events | Services |
| `*.routes.js` | API endpoints | Controllers |
| `logger.js` | Logging utility | - |
| `validators.js` | Input validation | Joi |


