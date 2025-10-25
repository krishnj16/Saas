# SaaS Vulnerability Toolkit

A Node.js + Express + PostgreSQL + Prisma project for building a SaaS-style vulnerability scanner.

---

### **Day 1: Basic Server Setup**
- Setup a simple Express server
- Added a `/health` endpoint to test server status

---

### **Day 2: Middleware & Structure**
- Added security & core middleware:
  - `helmet` → secure HTTP headers
  - `cors` → frontend–backend communication
  - `express.json()` → parse JSON requests
- Organized project structure:
  - Moved routes to `routes/` folder
  - Added **404 handler** (Not Found)
  - Added **error handler** (catch errors consistently)

---

### **Day 3: Database Integration**
- Setup **PostgreSQL** with **Prisma ORM**
- Added `.env` config for DB connection
- Defined `User` model in Prisma schema
- Ran migrations → created `User` table in Postgres
- Added `userRoutes`:
  - `GET /users` → list all users
  - `POST /users` → add a new user
- Verified DB operations with **Prisma Studio**

---

---

### **Day 4: Signup Endpoint (POST /auth/signup)**
- Learned why storing plain passwords is unsafe  
- Understood the difference between **hashing** (one-way) and **encryption** (two-way)  
- Used **bcrypt** for hashing passwords with salt  
- Added proper error handling with correct HTTP status codes  
- **Deliverable:** Working `POST /auth/signup` route that securely stores hashed passwords  

---
---

### **Day 5: Authentication (Signup & Login)**
- **Signup API** (`POST /auth/signup`)
  - Validates input, hashes password with bcrypt, saves user via Prisma
- **Login API** (`POST /auth/login`)
  - Verifies user, checks password, returns JWT token
- **Security**
  - Added rate limiter on login (5 tries / 15 mins)
  - Centralized error handling

---

### **Day 6: JWT Middleware & Protected Routes**
- Added **JWT Middleware**
  - Verifies `Authorization: Bearer <token>` header
  - Blocks access if token is missing/invalid
- Added **Protected Route**:
  - `/user/me` → returns logged-in user details
- Added **Role Support**
  - Token includes user role (`user` / `admin`) for role-based access

---

### **Day 7: User Management API**
- Added `GET /users` → fetch all users (id, email, name, createdAt)
- Results sorted by user ID
- **Prisma Integration**
  - Used `findMany` to query users
- **Error Handling**
  - Used try/catch in routes
  - Errors forwarded to central handler

---

### **Day 8: Week 2 Setup & Planning**
- Reviewed progress from Week 1
- Planned Week 2 (focus: websites, queues, workers)
- Setup folder structure for new modules:
  - `controllers/website.controller.js`
  - `routes/websites.js`
  - `queues/`
  - `workers/`
- Prepared migration for `websites` table
- **Deliverable:** project ready for Week 2

---

### **Day 9: Website Endpoints (Add & List)**
- Implemented `POST /websites` → add website (validated, owner-only)
- Implemented `GET /websites` → list websites owned by user
- Added basic validation (require `url`)
- Owner-only access enforced with middleware

---

### **Day 10: Website Endpoints (Update & Delete)**
- Implemented `PUT /websites/:id` → update website details
- Implemented `DELETE /websites/:id` → soft delete (added `deleted_at`)
- Used **soft delete** so old scan tasks remain linked

---

### **Day 11: Redis + BullMQ Setup**
- Installed Redis (via Docker)
- Added BullMQ → created `scanQueue`
- Implemented `POST /websites/:id/scan` → enqueues a job into Redis
- Each request also creates a `scan_tasks` row for tracking

---

### **Day 12: Worker Skeleton**
- Built a worker process listening to `scanQueue`
- Worker reads job data (`taskId`, `websiteId`, `url`)
- Logs activity → `scanning site <url>`

---

### **Day 13: Job Status Tracking**
- Added `scan_tasks` table with:
  - `id, website_id, job_id, status, started_at, finished_at, result_location`
- Enqueue endpoint creates a `scan_tasks` row
- Worker updates task status (`queued → running → done/failed`)

---

### **Day 14: Testing & Docs**
- Tested multiple enqueues + concurrency
- Verified error handling (worker exceptions → status = `failed`)
- Added docs:
  - How to run Redis
  - How to start API server
  - How to start worker

---

### **Day 15: Child Process Utility**
- Learned `child_process.spawn` to run shell commands
- Built reusable `runCommand(cmd, args)` function
- Tested with `echo` and a small Node script

---

### **Day 16: Scanner Install Plan**
- Decided on:
  - **WPScan** via Docker
  - **Wapiti** via pip/Docker
- Wrote run commands for both
- Ensured output is JSON saved to mounted volume

---

### **Day 17: Running Scanners Manually**
- Ran WPScan on sample site → saved JSON output
- Ran Wapiti on sample site → confirmed JSON format
- Stored example outputs in `scanner_results/` for future parsing

### **Day 18: Raw Output Storage & Unified Parsers**
- Added `scan_outputs` table (PostgreSQL JSONB / S3 pointer) to store raw scanner JSON  
- Updated worker to always save scanner stdout/stderr for every run  
- Implemented parsers:
  - `parseWpscan(json)` → normalized vulnerability objects  
  - `parseWapiti(json)` → normalized vulnerability objects  
- Wrote unit tests using saved sample JSON files  
- **Deliverable:** Raw outputs safely stored; parsers return consistent, unified vulnerability objects  

---

### **Day 19: Sandboxed Scanner Execution (Docker)**
- Created reusable `runScannerDocker()` wrapper inside worker  
- Enforced safe execution:
  - `--memory`, `--cpus`, `--network none`, timeout limit  
  - Runs as non-root where possible  
- Captured metadata (container id, exit code, stdout size) and handled failures gracefully  
- **Deliverable:** Scanners run safely inside Docker containers; worker logs and recovers cleanly  

---

### **Day 20: Database Schema + Audit Logs + Indices**
- Finalized backend tables:  
  `scan_tasks`, `scan_outputs`, `vulnerabilities`, `malware_results`, `ip_reputation_results`, `notifications`, `audit_logs`  
- Added GIN indices on JSONB columns and indexes on `website_id`, `scan_task_id`  
- Implemented `logAudit(userId, action, resource, data)` utility → tracks enqueue/start/finish  
- **Deliverable:** Migrations applied, performance improved, and audit trail active  

---

### **Day 21: Crawler & Input Discovery (Puppeteer)**
- Built Puppeteer-based crawler for URL and form discovery  
- Extracted:
  - Pages, links, forms, hidden fields, and REST (`wp-json`) endpoints  
- Stored results in `scan_discovery` table (url, method, param, input_type, sample_value)  
- Added a “discovery-only” endpoint for manual testing  
- **Deliverable:** Discovery inventory ready for injection engine  

---

### **Day 22: Safe Payload Injector (XSS / SQLi / CSRF Detection)**
- Built a non-destructive injection engine that reads `scan_discovery`  
- Implemented safe probes:
  - Reflective XSS checks (using harmless markers)
  - Time-based blind SQLi (small delays, strict limits)
  - CSRF checks (missing anti-token fields)  
- Added throttling + `SAFE_MODE` flag for safety  
- Stored evidence (request, response snippet, timing difference)  
- **Deliverable:** Injector detects vulnerabilities safely and stores findings in DB  

---

### **Day 23: Vulnerability Normalization & Deduplication**
- Unified severity levels across scanners (`low / medium / high / critical`)  
- Added dedup rules (website + path + parameter + type)  
- Compared current vs previous scan to mark `new_since_last_scan`  
- **Deliverable:** Clean, consistent, de-duplicated vulnerability records with new/old tags  

---

### **Day 24: Malware Scanning & VirusTotal Integration**
- Added safe file downloader (plugin/theme files)  
- Computed SHA-256 hashes and stored in `malware_results`  
- Created VirusTotal lookup queue with rate-limit & TTL cache  
- Worker processes jobs and flags malicious files automatically  
- **Deliverable:** Files hashed + VirusTotal results cached + linked to scan records  

---

### **Day 25: IP Reputation Checks**
- Resolved target IP addresses during scan startup  
- Queued IP reputation lookups (IPQS / similar) with cached results  
- Saved to `ip_reputation_results` and generated notifications for high risk IPs  
- **Deliverable:** IP reputation data integrated into scan workflow and alert system  

---

### **Day 26: Notifications & API**
- Created `notifications` table and endpoints:
  - `GET /notifications` (paginated)  
  - `POST /notifications/mark-read` (bulk)  
- Added user/site preferences (e.g., email only for critical issues)  
- Worker now creates notifications for critical findings, malware flags, and IP alerts  
- **Deliverable:** Notification system operational with REST APIs and user settings  

---

### **Day 27: Real-Time Updates & Email Alerts**
- Integrated Socket.IO with Express + JWT auth  
- Worker emits events: `scan:started`, `scan:progress`, `scan:finished`, `vuln:found`  
- Configured Nodemailer (Mailtrap in dev) to send emails on critical vulnerabilities  
- **Deliverable:** Live dashboard updates + email alerts for high-severity findings  

---

### **Day 28: Security Hardening & Final Testing**
- Strengthened auth security:
  - Login throttling + lockout policy  
  - Refresh tokens stored hashed in DB  
- Added rate-limit middleware to heavy endpoints  
- Implemented retention policy (90-day raw output purge / cold storage)  
- Added DB backup (`pg_dump`) cron example and monitoring notes  
- Wrote E2E test covering signup → add site → discovery → scan → notifications  
- **Deliverable:** Production-ready backend with tests and deployment docs  

---
