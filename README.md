# 🎯 Vibe Coding Todo Manager

A powerful todo management system designed for tracking coding tasks across different projects with hierarchical organization (Epics > Features > Tasks). Built with MongoDB, Express, React, and Tailwind CSS.

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

## 📁 Project Structure

```
claude-todo/
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
├── MCP_SETUP.md               # MongoDB MCP setup guide
└── README.md                  # This file
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

## 🔗 MongoDB MCP Setup

See [MCP_SETUP.md](./MCP_SETUP.md) for detailed MongoDB MCP configuration for Claude Code integration.

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

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

Built files will be in `frontend/dist/`

## 📈 Future Enhancements

Potential features for future versions:

- [ ] Drag-and-drop for task reordering
- [ ] Real-time collaboration (WebSocket)
- [ ] User authentication & multi-user support
- [ ] Due dates and reminders
- [ ] Tags and labels
- [ ] Search and filter functionality
- [ ] Export to Markdown/PDF
- [ ] Activity log/history
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Mobile app (React Native)

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
