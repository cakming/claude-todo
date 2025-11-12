# Authentication System Guide

Complete guide for the configurable authentication system in Vibe Coding Todo Manager.

## Table of Contents

1. [Overview](#overview)
2. [Configuration](#configuration)
3. [Testing Locally](#testing-locally)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The Vibe Todo Manager now includes an optional JWT-based authentication system that can be enabled/disabled via environment variable.

### Key Features

- **Configurable**: Enable/disable via `AUTH_ENABLED` environment variable
- **JWT-based**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Backward Compatible**: Works seamlessly with auth disabled (default)
- **Frontend Integration**: Automatic login screen when auth is enabled
- **Token Management**: Automatic token injection in API requests

### Default Behavior

- **AUTH_ENABLED=false** (default): Authentication is disabled, all API endpoints are accessible without login
- **AUTH_ENABLED=true**: Authentication is required, users must login to access the application

---

## Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=vibe_todo_manager

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Authentication Configuration
AUTH_ENABLED=true  # Set to 'true' to enable auth, 'false' or omit to disable

# JWT Configuration (required if AUTH_ENABLED=true)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d  # Token expiration (e.g., '7d', '24h', '60m')
```

**Important:**
- Change `JWT_SECRET` to a strong random string in production
- Use a long, random secret (at least 32 characters)
- Never commit `.env` file to version control

### Frontend Configuration

No configuration needed! The frontend automatically detects if auth is enabled by checking the `/health` endpoint.

---

## Testing Locally

### 1. Test with Authentication Disabled (Default)

```bash
# Backend - Start with default settings (auth disabled)
cd backend
npm start

# Frontend - Start development server
cd frontend
npm run dev
```

Visit `http://localhost:3000` - You should see the main application directly, no login required.

### 2. Test with Authentication Enabled

```bash
# Backend - Create .env and enable auth
cd backend
cat > .env << 'EOF'
MONGODB_URI=mongodb://localhost:27017
DB_NAME=vibe_todo_manager
PORT=3001
CORS_ORIGIN=http://localhost:3000
AUTH_ENABLED=true
JWT_SECRET=my-super-secret-jwt-key-for-testing-only-change-in-production
JWT_EXPIRES_IN=7d
EOF

# Start backend
npm start

# You should see:
# 🔐 Authentication: ENABLED
# 🔑 Auth endpoints: http://localhost:3001/api/auth/login, /api/auth/register
```

```bash
# Frontend - No changes needed
cd frontend
npm run dev
```

Visit `http://localhost:3000` - You should see the login screen.

### 3. Test Registration Flow

1. Click "Register here" on the login screen
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Create Account"
4. You should be logged in and see the main application

### 4. Test Login Flow

1. Logout (click "Logout" button in header)
2. You should see the login screen again
3. Login with:
   - Username: `testuser`
   - Password: `password123`
4. You should be logged in and see the main application

### 5. Test Token Persistence

1. Login
2. Refresh the page (F5)
3. You should remain logged in (token is stored in localStorage)

### 6. Test Protected API Routes

```bash
# Without auth token (should fail if AUTH_ENABLED=true)
curl http://localhost:3001/api/projects

# With auth token (should succeed)
TOKEN="your-jwt-token-from-login"
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/projects
```

---

## API Endpoints

### Authentication Endpoints

All auth endpoints are available at `/api/auth/*`:

#### 1. Register

**POST** `/api/auth/register`

Register a new user.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "message": "Username already exists"
}
```

#### 2. Login

**POST** `/api/auth/login`

Login with existing credentials.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

#### 3. Get Profile

**GET** `/api/auth/profile`

Get current user's profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

#### 4. Verify Token

**GET** `/api/auth/verify`

Verify if token is still valid (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### Protected Endpoints

When `AUTH_ENABLED=true`, all these endpoints require authentication:

- **GET** `/api/projects`
- **POST** `/api/projects`
- **DELETE** `/api/projects/:name`
- **GET** `/api/:project/epics`
- **POST** `/api/:project/epics`
- **PUT** `/api/:project/epics/:id`
- **DELETE** `/api/:project/epics/:id`
- (and all other epic/feature/task/tree endpoints)

**Required Header:**
```
Authorization: Bearer <token>
```

**Example:**
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
     http://localhost:3001/api/projects
```

---

## Frontend Integration

### How It Works

1. **AuthContext**: Manages authentication state globally
2. **Token Storage**: JWT token stored in localStorage
3. **Auto-Detection**: Frontend checks if auth is enabled via `/health` endpoint
4. **Auto-Redirect**: Shows login screen if auth enabled and not authenticated
5. **Token Injection**: All API calls automatically include auth token
6. **Logout**: Clears token and redirects to login

### Code Structure

```
frontend/src/
├── context/
│   ├── AuthContext.jsx      # Auth state management
│   └── AppContext.jsx        # App state (existing)
├── components/
│   └── Auth/
│       ├── LoginForm.jsx     # Login form component
│       └── RegisterForm.jsx  # Registration form component
├── pages/
│   └── AuthPage.jsx          # Auth page container
├── services/
│   ├── auth.js               # Auth API calls & token management
│   └── api.js                # Modified to include auth headers
└── App.jsx                   # Modified to include auth routing
```

### Using Auth in Components

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, authEnabled, logout } = useAuth();

  if (!authEnabled) {
    return <div>Auth is disabled</div>;
  }

  if (!isAuthenticated) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Token Management

Tokens are automatically managed:

```javascript
// Token is automatically included in all API calls
import { projectsApi } from './services/api';

// This will include "Authorization: Bearer <token>" header
const projects = await projectsApi.getAll();
```

---

## Security Considerations

### Best Practices

1. **JWT Secret**
   - Use a strong, random secret (at least 32 characters)
   - Never commit to version control
   - Different secret for each environment

2. **Password Requirements**
   - Minimum 6 characters (configurable in `backend/src/utils/auth.js`)
   - Consider adding complexity requirements in production

3. **Token Expiration**
   - Default: 7 days
   - Adjust `JWT_EXPIRES_IN` based on your security needs
   - Shorter expiration = more secure but less convenient

4. **HTTPS**
   - Always use HTTPS in production
   - Tokens transmitted in plain text over HTTP can be intercepted

5. **CORS**
   - Configure `CORS_ORIGIN` to match your frontend domain
   - Don't use `*` in production

### Database Security

**Users Collection:**
- Collection name: `users`
- Password field: `password` (bcrypt hash, never plain text)
- Indexes recommended:
  ```javascript
  db.users.createIndex({ username: 1 }, { unique: true })
  db.users.createIndex({ email: 1 }, { unique: true })
  ```

### Token Storage

- **Frontend**: localStorage (persistent across tabs, but vulnerable to XSS)
- **Alternative**: Consider httpOnly cookies for enhanced security (requires backend changes)

---

## Troubleshooting

### Issue: "No authorization token provided"

**Cause**: Frontend is not sending auth token

**Solution:**
```javascript
// Check if token exists
import { getToken } from './services/auth';
console.log('Token:', getToken());

// If no token, user needs to login again
```

### Issue: "Invalid or expired token"

**Cause**: Token has expired or is invalid

**Solution:**
1. Logout and login again
2. Or adjust `JWT_EXPIRES_IN` to longer duration

### Issue: Login works but page won't load

**Cause**: Token not being sent with API requests

**Solution:**
- Check browser console for errors
- Verify `Authorization` header is present in network tab
- Ensure `api.js` is importing `getAuthHeaders()`

### Issue: Can't access app after enabling auth

**Cause**: No users registered yet

**Solution:**
1. Navigate to `http://localhost:3000`
2. Click "Register here"
3. Create an account
4. You should be logged in automatically

### Issue: Auth always shows as disabled

**Cause**: Backend not running or `AUTH_ENABLED` not set

**Solution:**
```bash
# Check backend is running
curl http://localhost:3001/health

# Should show:
# "authEnabled": true

# If false, check backend .env file
cat backend/.env | grep AUTH_ENABLED
```

### Issue: Can't logout

**Cause**: JavaScript error in logout function

**Solution:**
```javascript
// Manual logout from browser console
localStorage.removeItem('vibe_todo_auth_token');
window.location.reload();
```

---

## Example Usage

### Complete Test Flow

```bash
# 1. Start MongoDB
mongod

# 2. Enable auth in backend
cd backend
echo "AUTH_ENABLED=true" >> .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
npm start

# 3. Start frontend
cd frontend
npm run dev

# 4. Test in browser:
# - Visit http://localhost:3000
# - Register a new account
# - Verify you can create projects
# - Logout
# - Login again
# - Verify token persists across refresh

# 5. Test via API:
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testapi","email":"test@api.com","password":"password123"}'

# Extract token from response
TOKEN="<token-from-response>"

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/projects

# 6. Disable auth
cd backend
# Remove or set AUTH_ENABLED=false in .env
npm start

# Verify you can access without token
curl http://localhost:3001/api/projects
```

---

## Production Deployment

### Environment Variables

```bash
# Backend .env
AUTH_ENABLED=true
JWT_SECRET=$(openssl rand -hex 32)  # Generate strong secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

### Security Checklist

- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS_ORIGIN
- [ ] Set appropriate JWT_EXPIRES_IN
- [ ] Never commit .env file
- [ ] Use environment-specific secrets
- [ ] Implement rate limiting on auth endpoints
- [ ] Add account lockout after failed attempts (optional)
- [ ] Implement password reset flow (optional)

---

**Authentication system is now fully integrated and configurable!** 🔐✨

Enable it when you need security, disable it for open access or development.
