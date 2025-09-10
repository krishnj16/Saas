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

<<<<<<< HEAD
### **Day 4: Signup Endpoint (POST /auth/signup)**
- Learned why storing plain passwords is unsafe
- Understood difference between **hashing** (one-way) and **encryption** (two-way)
- Used **bcrypt** for hashing with salt
- Added proper error handling with correct HTTP status codes
- **Deliverable:** working `POST /auth/signup` route
=======
 ## Day 7 Progress
>>>>>>> 90fc1d4 (Update README.md)

### Implemented
- **User Management API**
  - `GET /users` → fetch all users (id, email, name, createdAt).
  - Results sorted by user ID in ascending order.

- **Prisma Integration**
  - Queried users with `findMany`.
  - Returned clean JSON response.

- **Error Handling**
  - Used try/catch in routes.
  - Forwarded errors to central error handler middleware.
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
