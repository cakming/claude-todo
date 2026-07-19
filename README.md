# 🎯 Vibe Coding Todo Manager

A powerful todo management system designed for tracking coding tasks across different projects with hierarchical organization (Epics > Features > Tasks). Built with MongoDB, Express, React, and Tailwind CSS.

**✨ Now with Custom MCP Server!** Interact with your todos directly through Claude Desktop/Code using natural language.

**🔐 Optional Authentication!** Secure your todos with JWT-based authentication - enable/disable via environment variable.

## ✨ Features

- **Project Management**: Create and manage multiple projects with separate collections
- **Hierarchical Organization**: Organize work into Epics → Features → Tasks
- **Multiple Views**:
  - 📊 **Epics View**: Card-based layout for large bodies of work
  - ✨ **Features View**: Feature management with progress tracking
  - ✅ **Tasks View**: Kanban board or list view for individual tasks
  - 🌲 **Tree View**: Collapsible hierarchical view of everything
- **Auto-Status Updates**: Parent items automatically update when all children complete
- **Progress Tracking**: Visual progress bars and completion percentages
- **Status Management**: Planning, In Progress, Done, and Blocked states
- **Real-time Updates**: Toast notifications for all actions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **MCP Server**: Custom Model Context Protocol server for Claude integration (30+ tools)
  > **Update (2026-07):** No longer valid — the MCP server now exposes **42 tools** (verified in `vibe-todo-mcp/src/index.ts`). It was 28 for the epic/feature/task tree; pages, comments, trash, and sharing tools were added later.
- **Optional Authentication**: JWT-based authentication with bcrypt password hashing (configurable)
- **Docs / Pages**: Per-project rich documents authored with a TipTap block editor
  > **Update (2026-07):** ✅ Shipped — TipTap block editor at `frontend/src/components/Common/RichEditor.jsx`; backend at `backend/src/routes/pages.js` + `pagesController.js`. Legacy markdown pages auto-convert on open.
- **Persistent Trash Bin**: Deletes are soft; a Trash view restores or purges items
  > **Update (2026-07):** ✅ Shipped — `backend/src/routes/trash.js` + `trashController.js` (soft-delete via `deleted_at`).
- **Public Sharing Links**: Read-only share links (whole project tree or a single doc page), with optional expiry (TTL)
  > **Update (2026-07):** ✅ Shipped — `backend/src/routes/shares.js` + `sharesController.js`; 128-bit unguessable tokens, optional `expiresInDays` TTL.
- **Comments & @mentions**: Threaded comments with @mentions and notifications
  > **Update (2026-07):** ✅ Shipped — `backend/src/routes/comments.js` + `commentsController.js`; notifications via email (`utils/mailer.js`) and Telegram (`utils/telegram.js`).
- **Image Upload**: Pluggable image storage — GridFS (MongoDB) or Google Cloud Storage
  > **Update (2026-07):** ✅ Shipped — `backend/src/utils/storage.js`; set `GCS_BUCKET` to use GCS, otherwise GridFS. Images addressed by 128-bit token URLs.
- **Roles / RBAC**: Role-based access control — `admin`, `editor`, `member`, `viewer` (viewers are read-only)
  > **Update (2026-07):** ✅ Shipped — `VALID_ROLES` in `backend/src/controllers/userController.js`; enforced by `requireRole` / `blockWritesForViewer` in `backend/src/app.js`.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  - Vite + React + Tailwind CSS          │
│  - Context API for state management     │
│  - Responsive UI with multiple views    │
└──────────────┬──────────────────────────┘
               │ REST API
┌──────────────┴──────────────────────────┐
│           Backend (Express)             │
│  - RESTful API endpoints                │
│  - Auto-status update logic             │
│  - Input validation & error handling    │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│         MongoDB Database                │
│  - Dynamic collections per project      │
│  - Hierarchical document structure      │
│  - Indexed for performance              │
└─────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Node.js** v16 or higher
  > **Update (2026-07):** No longer valid — **Node.js v18+** is the supported/tested version (deployment targets Node 18 and the MCP server declares `@types/node ^20`). Use v18 or higher.
- **MongoDB** 4.4 or higher (local or Atlas)
- **npm** or **yarn**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd claude-todo
```

### 2. Setup MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows - Start MongoDB service from Services app
```

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env` with your connection string

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection details
npm start
```

Backend will run on `http://localhost:3001`

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

### 5. Open Your Browser

Navigate to `http://localhost:5173`

## 🔐 Authentication (Optional)

Authentication is **disabled by default**. To enable it:

### Enable Authentication

Edit `backend/.env`:

```env
# Enable authentication
AUTH_ENABLED=true

# Set a strong JWT secret (required when auth is enabled)
JWT_SECRET=your-super-secret-key-change-this-in-production

# Token expiration (optional, default: 7d)
JWT_EXPIRES_IN=7d
```

Restart the backend server. The frontend will automatically detect auth is enabled and show a login screen.

### First User Registration

1. Visit `http://localhost:5173`
2. Click "Register here"
3. Create your account
4. You'll be automatically logged in

**For complete authentication documentation, see [AUTH_GUIDE.md](./AUTH_GUIDE.md)**

### Disable Authentication

Remove or set `AUTH_ENABLED=false` in `backend/.env` and restart the backend.

## 📁 Project Structure

```
claude-todo/
├── vibe-todo-mcp/             # Custom MCP server for Claude
│   ├── src/
│   │   ├── index.ts          # MCP server entry point
│   │   ├── tools/            # MCP tools   (Update 2026-07: 42 tools)
│   │   └── utils/            # Validation & auto-status
│   └── README.md
│
├── backend/                    # Express API server
│   ├── src/
│   │   ├── config/            # MongoDB configuration
│   │   ├── controllers/       # Business logic
│   │   ├── models/            # Data schemas & validation
│   │   ├── routes/            # API route definitions
│   │   ├── middleware/        # Express middleware
│   │   └── app.js            # Main application file
│   ├── package.json
│   └── .env
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Common/       # Reusable components
│   │   │   ├── Epic/         # Epic-related components
│   │   │   ├── Feature/      # Feature-related components
│   │   │   ├── Task/         # Task-related components
│   │   │   ├── Tree/         # Tree view components
│   │   │   └── Layout/       # Layout components
│   │   ├── pages/            # Main page components
│   │   ├── context/          # React Context (state)
│   │   ├── services/         # API service layer
│   │   ├── utils/            # Helper functions
│   │   └── App.jsx           # Root component
│   ├── package.json
│   └── .env
│
├── API_DOCUMENTATION.md        # Complete API documentation
├── AUTH_GUIDE.md              # Authentication system guide
├── MCP_SETUP.md               # MongoDB MCP setup guide (legacy)
└── README.md                  # This file

Note: Use the custom MCP server in vibe-todo-mcp/ for best Claude integration!
```

## 🎮 Usage Guide

### Creating Your First Project

1. Open the app in your browser
2. Click **"+ New Project"** button
3. Enter project name (e.g., "My E-Commerce App")
4. Project will be created and selected automatically

### Creating an Epic

1. Make sure a project is selected
2. Navigate to **Epics** view (already selected by default)
3. Click **"+ Add Epic"** button
4. Fill in:
   - **Title**: e.g., "E-Commerce Platform v2"
   - **Description**: Brief overview of the epic
   - **Status**: Choose from Planning, In Progress, Done, or Blocked
5. Click **"Create Epic"**

### Creating a Feature

1. Navigate to **Features** view
2. Click **"+ Add Feature"** button
3. Fill in:
   - **Epic**: Select parent epic
   - **Title**: e.g., "Shopping Cart"
   - **Description**: What this feature does
   - **UAT**: User acceptance testing criteria
   - **Reference File**: Optional file path
   - **Status**: Todo, In Progress, Done, or Blocked
4. Click **"Create Feature"**

### Creating a Task

1. Navigate to **Tasks** view
2. Click **"+ Add Task"** button
3. Fill in:
   - **Feature**: Select parent feature
   - **Title**: e.g., "Add item to cart API"
   - **Description**: Implementation details
   - **UAT**: Definition of done
   - **Reference File**: Optional file path
   - **Status**: Todo, In Progress, Done, or Blocked
4. Click **"Create Task"**

### Using the Kanban Board

1. Navigate to **Tasks** view
2. Ensure **"Kanban"** mode is selected (default)
3. Tasks are organized in columns: **To Do**, **In Progress**, **Done**, **Blocked**
4. Change task status using the dropdown in each card
5. Tasks will move to the appropriate column

### Using the Tree View

1. Navigate to **Tree View**
2. See all epics, features, and tasks in hierarchical structure
3. Click **▶** to expand, **▼** to collapse
4. Progress bars show completion status at each level

### Auto-Status Updates

The system automatically updates parent statuses:

- ✅ When all tasks in a feature are **Done** → Feature becomes **Done**
- ✅ When all features in an epic are **Done** → Epic becomes **Done**
- 🔄 When a parent is **Done** but a child changes to not done → Parent reverts to **In Progress**

This keeps your project status accurate without manual updates!

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=vibe_todo_manager

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend Configuration

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference including:

- All available endpoints
- Request/response formats
- Status codes
- Example API calls
- Error handling

## 🔗 MCP Server Setup (Claude Integration)

We provide a **custom MCP server** specifically designed for Vibe Todo Manager!

### Quick Setup

1. **Build the MCP server**:
```bash
cd vibe-todo-mcp
npm install
npm run build
```

2. **Configure Claude Desktop** — config file location: macOS `~/Library/Application Support/Claude/claude_desktop_config.json`, Linux `~/.config/Claude/claude_desktop_config.json`, Windows `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "vibe-todo": {
      "command": "node",
      "args": ["/absolute/path/to/claude-todo/vibe-todo-mcp/build/index.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017",
        "DB_NAME": "vibe_todo_manager"
      }
    }
  }
}
```

   Or, with **Claude Code (CLI)**:
```bash
claude mcp add vibe-todo \
  --env MONGODB_URI=mongodb://localhost:27017 \
  --env DB_NAME=vibe_todo_manager \
  -- node /absolute/path/to/claude-todo/vibe-todo-mcp/build/index.js
```

3. **Restart Claude Desktop** (not needed for Claude Code)

   > For the full walkthrough — prerequisites, troubleshooting, and verifying the setup — see [`vibe-todo-mcp/SETUP_GUIDE.md`](./vibe-todo-mcp/SETUP_GUIDE.md).

### Usage Examples

Now you can interact naturally with Claude:

```
"Create an epic called User Authentication in my_app"
"Add a feature for Login Form under that epic"
"Create a task to implement JWT validation"
"Mark that task as done" (auto-updates parent feature/epic!)
"Show me all blocked items"
"What was recently updated?"
```

**See [vibe-todo-mcp/README.md](./vibe-todo-mcp/README.md) for complete documentation.**

The MCP server provides 30+ tools including:

> **Update (2026-07):** No longer valid — the server exposes **42 tools** (see `vibe-todo-mcp/src/index.ts`).

- Project management
- Epic/Feature/Task CRUD operations
- Auto-status updates (when children complete, parents update!)
- Tree view with progress
- Search and filtering

## 🎨 Customization

### Status Colors

Edit `frontend/src/index.css` to customize status colors:

```css
.status-planning { @apply bg-gray-100 text-gray-700; }
.status-todo { @apply bg-blue-100 text-blue-700; }
.status-in-progress { @apply bg-yellow-100 text-yellow-700; }
.status-done { @apply bg-green-100 text-green-700; }
.status-blocked { @apply bg-red-100 text-red-700; }
```

### Adding New Fields

1. Update schemas in `backend/src/models/schemas.js`
2. Update controllers to handle new fields
3. Update frontend forms and display components

## 🐛 Troubleshooting

### Backend won't start

**Error: "Failed to connect to MongoDB"**
- Check if MongoDB is running: `mongosh`
- Verify `MONGODB_URI` in `.env`
- Check firewall settings

**Error: "Port 3001 already in use"**
- Change `PORT` in `backend/.env`
- Kill process using port: `lsof -ti:3001 | xargs kill`

### Frontend won't connect to backend

**Error: Network request failed**
- Verify backend is running on `http://localhost:3001`
- Check `VITE_API_URL` in `frontend/.env`
- Check browser console for CORS errors

### Data not loading

- Open browser DevTools → Network tab
- Check API responses for errors
- Verify project is selected in dropdown

## 🧪 Development

### Running in Development Mode

**Backend (with auto-reload):**
```bash
cd backend
npm run dev
```

**Frontend (with HMR):**
```bash
cd frontend
npm run dev
```

### Running Tests

**Backend:**
```bash
cd backend
npm test
```

The backend suite uses Node's built-in test runner and runs fully offline —
no MongoDB instance is required (the data layer is faked in-memory). It covers
the auto-status/progress algorithm, authentication (register/login), and
cascade deletes.

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`

## 🌐 Deployment

### Google Cloud Platform (GCP) ⭐ RECOMMENDED

**Complete deployment guide:** **[DEPLOYMENT_GCP.md](./DEPLOYMENT_GCP.md)**

Perfect if you have:
- ✅ GCP Compute Engine VM
- ✅ MongoDB (Cloud SQL, Atlas, or self-hosted)
- ✅ Domain name (optional)

**Covers:**
- Step-by-step VM setup
- Nginx reverse proxy configuration
- PM2 process management
- SSL/HTTPS with Let's Encrypt
- Cloud Logging & Monitoring
- Automated backups
- CI/CD with Cloud Build

**Quick Deploy:**
```bash
# SSH into your GCP VM
gcloud compute ssh your-vm-name --zone=your-zone

# Clone repository
git clone <repo-url>
cd claude-todo

# Follow DEPLOYMENT_GCP.md
```

### Other Deployment Options

**Docker:**
- See `HANDOVER.md` → Deployment Guide → Docker Deployment
- Includes docker-compose.yml for all services

**Traditional VPS/EC2:**
- See `HANDOVER.md` → Deployment Guide → Traditional Deployment
- Ubuntu/Debian setup with nginx + PM2

**Cloud Platforms:**
- Vercel (Frontend) + Railway (Backend) + MongoDB Atlas
- See `HANDOVER.md` for configuration

## 📈 Future Enhancements

Potential features for future versions:

- [ ] Drag-and-drop for task reordering
- [ ] Real-time collaboration (WebSocket) — ✅ shipped (Socket.IO real-time updates)
- [ ] User authentication & multi-user support — ✅ shipped (JWT auth + roles; `backend/src/routes/auth.js`, `admin.js`)
- [ ] Due dates and reminders
- [ ] Tags and labels
- [ ] Search and filter functionality — ✅ shipped (server-side search & filter on list endpoints)
- [ ] Export to Markdown/PDF — ✅ shipped (JSON export/import round-trip; `POST /api/:project/import` + export controller)
- [ ] Activity log/history — ✅ shipped (`backend/src/routes/activity.js` + activity feed)
- [ ] Dark mode — ✅ shipped (light/dark theme)
- [ ] Keyboard shortcuts — ✅ shipped
- [ ] Mobile app (React Native)

> **Update (2026-07):** Several items above have shipped and are marked "✅ shipped" in place. Additional shipped capabilities not originally listed here: Docs/pages (TipTap block editor), persistent trash bin, public sharing links with TTL, comments/@mentions, image upload (GridFS or GCS), and role-based access control (admin/editor/member/viewer). Still open: drag-and-drop reordering, due dates/reminders, tags/labels, and a React Native mobile app.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Check existing documentation
- Review API documentation for backend issues

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Express](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Happy Coding! 🚀**

Made for vibe coding sessions with AI assistants.
