# SaaS Vulnerability Toolkit

A Node.js + Express + PostgreSQL + Prisma project for building a SaaS-style vulnerability scanner.

---

### **Day 1: Basic Server Setup**
- Setup a simple Express server
- Added a `/health` endpoint to test server status

### **Day 2: Middleware & Structure**
- Added security & core middleware:
  - `helmet` → secure HTTP headers
  - `cors` → frontend–backend communication
  - `express.json()` → parse JSON requests
- Organized project structure:
  - Moved routes to `routes/` folder
  - Added **404 handler** (Not Found)
  - Added **error handler** (catch errors consistently)

### **Day 3: Database Integration**
- Setup **PostgreSQL** with **Prisma ORM**
- Added `.env` config for DB connection
- Defined `User` model in Prisma schema
- Ran migrations → created `User` table in Postgres
- Added `userRoutes`:
  - `GET /users` → list all users
  - `POST /users` → add a new user
- Verified DB operations with **Prisma Studio**

##  Day 4 — Signup Endpoint (POST /auth/signup)

### What I learned
- Why storing plain passwords is unsafe.
- Difference between hashing and encryption (hashing is one-way).
- How bcrypt adds salt to strengthen password security.
- Implemented proper error handling with correct HTTP status codes.

### Deliverable
- **Route:** `POST /auth/signup`
- **Request Body:**
  ```json
  { "email": "user@mail.com", "password": "123456" }

##  Day 5 Progress

### Implemented
- **Signup API** (`POST /auth/signup`)
  - Validates input, hashes password with bcrypt, saves user via Prisma.
- **Login API** (`POST /auth/login`)
  - Verifies user, checks password, returns JWT token.
- **Security**
  - Rate limiter on login (5 tries/15 mins).
  - Central error handling.
    
 ## Day 6 Progress

### Implemented
- **JWT Middleware**
  - Verifies `Authorization: Bearer <token>` header.
  - Blocks access if token is missing/invalid.
- **Protected Routes**
  - Added `/user/me` → returns logged-in user details.
- **Role Support**
  - Tokens include user role (`user` / `admin`) for role-based access (future use).

 ## Day 7 Progress

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
