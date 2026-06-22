# SANE-AI TESTER AGENT

## Project Overview

Idhu oru distributed testing framework. Idhula moonu main parts irukku:

- **Central API** – Server side hub (Node.js)
- **Master Brain** – Dashboard UI (HTML/JS)
- **Worker Agent** – Tester machine-la run aagura software (Node.js/Playwright)

---

# System Requirements

| Requirement | Details |
|---|---|
| Node.js | v18.x (Stable for pkg) |
| Database | PostgreSQL 14+ |
| RAM | 4GB minimum / 8GB recommended |
| Global Tools | `npm install -g pm2 pkg` |

---

# Installation Steps

## A. Central API

```bash
cd sane-ai-tester-api

npm install
```

Update DB credentials in `index.js`

### Start Server

```bash
node index.js
```

or

```bash
pm2 start index.js --name sane-api
```

---

## B. Master Brain

Open:

```text
sane-ai-tester-brain/index.html
```

in browser.

Check if `API_URL` matches your server IP.

---

## C. Worker Agent

```bash
cd sane-ai-tester-worker

npm install
```

### Build EXE

```bash
pkg index.js --targets node18-win-x64 --output sane-agent.exe
npx pkg . --targets node18-win-x64 --no-bytecode --public-packages "*" --output sane-agent.exe
```

### Install Browser

```bash
npx playwright install chromium
```

---

# How To Use

1. API-ah start pannunga.
2. `sane-agent.exe`-ah double click panni run pannunga.
3. Pudhu machine-na nickname kuduthu register pannunga.
4. **Start Agent** select panni online vaanga.
5. Brain Dashboard-la card green-ah maarum.
6. URL kuduthu task run pannunga.

---

# Architecture Summary

```text
+-------------------+
|   Master Brain    |
|   Dashboard UI    |
+---------+---------+
          |
          v
+-------------------+
|    Central API    |
|   Node.js Server  |
+---------+---------+
          |
          v
+-------------------+
|   Worker Agent    |
| Node.js + PW      |
+-------------------+
```

---

# Recommended Production Setup

- Use `pm2` for API process management.
- Enable PostgreSQL backups.
- Keep worker agents updated regularly.
- Use static IP / domain for Central API.
- Monitor worker status from Brain Dashboard.

---

# Tech Stack

- Node.js
- Playwright
- PostgreSQL
- PM2
- HTML / JavaScript

---

# Notes

- Worker agent supports distributed browser automation.
- Chromium browser required for Playwright execution.
- `pkg` is used for generating standalone Windows executable.
- Dashboard communicates with Central API through configured `API_URL`.

