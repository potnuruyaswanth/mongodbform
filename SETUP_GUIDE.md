# Authentication & Authorization Setup Guide

## Issues Found & Fixed ✅

### 1. **Missing Environment Variables**
   - **Problem**: Server referenced `process.env.JWT_Token_Secret` and `process.env.REFRESH_SECRET` but no `.env` file existed
   - **Solution**: Created `.env` file with required secrets
   - **File**: `.env`

### 2. **Typo in authenticate() Function (server.js:64)**
   - **Problem**: `req.cookie.access_token` (singular)
   - **Fixed**: `req.cookies.access_token` (plural)

### 3. **Variable Not Using process.env (server.js:67)**
   - **Problem**: `JWT_Token_Secret` (undefined variable)
   - **Fixed**: `process.env.JWT_Token_Secret`

### 4. **Form Input References (auth.js)**
   - **Problem**: `username.value` and `password.value` without getting element first
   - **Fixed**: `document.getElementById("username").value`

### 5. **Missing Error Handling (auth.js)**
   - **Problem**: No try-catch or error feedback
   - **Solution**: Added try-catch blocks with user-friendly error messages

### 6. **Incomplete axios.js Interceptor**
   - **Problem**: Missing closing brace and export statement
   - **Fixed**: Added proper closing and `export default api`

### 7. **No Static File Serving (server.js)**
   - **Problem**: Frontend files not served by Express
   - **Fixed**: Added `app.use(express.static('frontend'))`

### 8. **Missing CORS Origin (server.js:14)**
   - **Problem**: CORS origin was `http://localhost:5501` but backend is on `3000`
   - **Fixed**: Changed to `http://localhost:3000`

### 9. **Missing Database Callbacks (server.js:157, 167)**
   - **Problem**: `db.query()` calls without error callback
   - **Fixed**: Added proper error handling callbacks

---

## Database Setup Required

You need to create these MySQL tables:

```sql
-- Registration table
CREATE TABLE registration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  hashedpassword VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES registration(id) ON DELETE CASCADE
);
```

---

## How to Run

### Step 1: Start MySQL
Ensure MySQL is running on `localhost:3306`

### Step 2: Create Database & Tables
```sql
CREATE DATABASE student;
USE student;
-- Run the table creation queries above
```

### Step 3: Start the Server
```bash
npm start
```
Server runs on: `http://localhost:3000`

### Step 4: Access the App
- **Register**: http://localhost:3000/register.html
- **Login**: http://localhost:3000/login.html
- **Dashboard**: http://localhost:3000/dashboard.html (protected route)

---

## Environment Variables (.env)

```
JWT_Token_Secret=your_jwt_secret_key_change_this_in_production
REFRESH_SECRET=your_refresh_secret_key_change_this_in_production
```

**⚠️ IMPORTANT**: Change these secrets to strong random values in production!

```bash
# Generate secure secrets (run in bash/powershell):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Authentication Flow

1. **Register**: User submits username/password → hashed with bcrypt → stored in DB
2. **Login**: Credentials validated → JWT access token + refresh token issued → stored in HttpOnly cookies
3. **Protected Routes**: Access token checked via middleware → if expired, refresh endpoint called automatically
4. **Logout**: Refresh token deleted from DB, cookies cleared

---

## Testing

### Register
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}' \
  -c cookies.txt
```

### Access Protected Route
```bash
curl http://localhost:3000/dashboard \
  -b cookies.txt
```

---

## Security Features Implemented

✅ Password hashing with bcrypt  
✅ JWT tokens (short-lived access, long-lived refresh)  
✅ HttpOnly cookies (prevent XSS)  
✅ CORS protection  
✅ Rate limiting on auth endpoints  
✅ Refresh token rotation  
✅ Role-based authorization  
✅ SameSite=Strict cookies  
