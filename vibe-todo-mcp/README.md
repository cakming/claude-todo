# Vibe Todo MCP Server

Custom Model Context Protocol (MCP) server for the Vibe Coding Todo Manager. This enables Claude Desktop and Claude Code to directly interact with your MongoDB-based todo management system.

## 🌟 Features

**30+ MCP Tools** providing complete control over your todo hierarchy:

### Project Management
- `list_projects` - List all projects
- `create_project` - Create new project
- `delete_project` - Delete project (with confirmation)
- `get_project_stats` - Get project statistics

### Epic Management
- `list_epics` - List all epics in a project
- `get_epic` - Get epic details
- `create_epic` - Create new epic
- `update_epic` - Update epic details
- `delete_epic` - Delete epic (cascades to features and tasks)

### Feature Management
- `list_features` - List features (optionally filter by epic)
- `get_feature` - Get feature details
- `create_feature` - Create feature under epic
- `update_feature` - Update feature (auto-updates parent epic)
- `delete_feature` - Delete feature (cascades to tasks)

### Task Management
- `list_tasks` - List tasks (optionally filter by feature)
- `get_task` - Get task details
- `create_task` - Create task under feature
- `update_task` - Update task (auto-updates parent feature/epic)
- `delete_task` - Delete task
- `mark_task_done` - Quick mark as done
- `mark_task_in_progress` - Quick mark as in progress
- `mark_task_blocked` - Quick mark as blocked

### Tree View
- `get_project_tree` - Get complete hierarchical tree
- `get_epic_tree` - Get epic with all features and tasks

### Search & Filter
- `search_items` - Search across all fields
- `get_blocked_items` - Find all blocked items
- `get_in_progress_items` - Find all in-progress items
- `get_recently_updated` - Get recently updated items

## 🚀 Installation

### Prerequisites

- Node.js v16 or higher
- MongoDB running (local or Atlas)
- Claude Desktop or Claude Code

### Install

```bash
cd vibe-todo-mcp
npm install
npm run build
```

## ⚙️ Configuration

### 1. Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=vibe_todo_manager
```

### 2. Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS/Linux**: `~/.config/claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the MCP server:

```json
{
  "mcpServers": {
    "vibe-todo": {
      "command": "node",
      "args": [
        "/absolute/path/to/vibe-todo-mcp/build/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017",
        "DB_NAME": "vibe_todo_manager"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/` with the actual path to your MCP server!

### 3. Configure Claude Code

For Claude Code, you can also add it to your MCP configuration:

```json
{
  "mcpServers": {
    "vibe-todo": {
      "command": "node",
      "args": ["/absolute/path/to/vibe-todo-mcp/build/index.js"]
    }
  }
}
```

### 4. Restart Claude

Restart Claude Desktop or Claude Code to load the MCP server.

## 💬 Usage Examples

Once configured, you can interact with your todos naturally in Claude:

### Project Management

```
You: "List all my projects"
Claude: [Uses list_projects tool]

You: "Create a new project called My Awesome App"
Claude: [Uses create_project tool]

You: "Show me stats for my_awesome_app"
Claude: [Uses get_project_stats tool]
```

### Creating Hierarchy

```
You: "Create an epic called User Authentication in my_awesome_app"
Claude: [Uses create_epic tool]

You: "Add a feature for Login Form under the User Authentication epic"
Claude: [Uses create_feature tool - needs epic ID]

You: "Create a task to implement JWT token validation under the Login Form feature"
Claude: [Uses create_task tool - needs feature ID]
```

### Updating Status

```
You: "Mark task [task-id] as done"
Claude: [Uses mark_task_done tool]
// This automatically updates parent feature and epic status!

You: "Update the Login Form feature status to in_progress"
Claude: [Uses update_feature tool]
```

### Searching & Filtering

```
You: "Show me all blocked items in my_awesome_app"
Claude: [Uses get_blocked_items tool]

You: "Search for anything related to authentication"
Claude: [Uses search_items with query "authentication"]

You: "What was recently updated in my project?"
Claude: [Uses get_recently_updated tool]
```

### Tree View

```
You: "Show me the full tree structure of my_awesome_app"
Claude: [Uses get_project_tree tool]

You: "Show me all features and tasks under the User Authentication epic"
Claude: [Uses get_epic_tree tool]
```

## 🎯 Auto-Status Updates

One of the most powerful features is **automatic parent status updates**:

✅ When all tasks in a feature are marked `done` → Feature becomes `done`
✅ When all features in an epic are `done` → Epic becomes `done`
✅ When a parent is `done` but a child becomes not done → Parent reverts to `in_progress`

This happens automatically through the MCP tools!

## 🔧 Development

### Build

```bash
npm run build
```

### Watch Mode (for development)

```bash
npm run watch
```

### Project Structure

```
vibe-todo-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── mongodb.ts            # MongoDB connection
│   ├── schemas.ts            # TypeScript types
│   ├── tools/
│   │   ├── projectTools.ts   # Project operations
│   │   ├── epicTools.ts      # Epic operations
│   │   ├── featureTools.ts   # Feature operations
│   │   ├── taskTools.ts      # Task operations
│   │   ├── treeTools.ts      # Tree view
│   │   └── searchTools.ts    # Search operations
│   └── utils/
│       ├── validation.ts     # Input validation
│       └── statusUpdates.ts  # Auto-status logic
├── build/                    # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Troubleshooting

### MCP Server Not Showing Up

1. Check Claude Desktop/Code logs
2. Verify the path in `claude_desktop_config.json` is absolute
3. Ensure you ran `npm run build`
4. Restart Claude completely

### Connection Errors

```
Error: Failed to connect to MongoDB
```

**Solution**:
- Verify MongoDB is running: `mongosh`
- Check `MONGODB_URI` in `.env` or config
- Test connection: `mongosh "mongodb://localhost:27017"`

### Tool Execution Errors

```
Error: Project 'my_app' not found
```

**Solution**:
- Create project first: `create_project`
- Check project name (case-sensitive, uses sanitized names)

### Build Errors

```
Cannot find module...
```

**Solution**:
```bash
rm -rf node_modules build
npm install
npm run build
```

## 📚 API Reference

### Tool Response Format

All tools return JSON responses:

```json
{
  "_id": "ObjectId",
  "type": "task",
  "title": "Implement JWT validation",
  "desc": "Add middleware for token validation",
  "status": "in_progress",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T12:00:00.000Z"
}
```

### Status Values

**Epics**: `planning`, `in_progress`, `done`, `blocked`
**Features/Tasks**: `todo`, `in_progress`, `done`, `blocked`

### ObjectId Format

MongoDB ObjectIds are 24-character hex strings:
```
507f1f77bcf86cd799439011
```

You can copy these from tool responses to use in subsequent operations.

## 🔐 Security

- MCP server runs locally on your machine
- Direct connection to MongoDB (no external APIs)
- All data stays on your local database
- Environment variables for sensitive config

## 🤝 Integration with Web UI

The MCP server works alongside the web UI:

- **MCP**: For Claude-driven interactions and automation
- **Web UI**: For visual management and bulk operations
- **Backend API**: Shared MongoDB database

All three can be used simultaneously!

## 📖 Example Workflow

Here's a complete workflow using the MCP server:

```
1. "List my projects"
   → Shows: ["my_app", "website_redesign"]

2. "Show me the tree structure of my_app"
   → Returns full hierarchical view

3. "What tasks are currently blocked in my_app?"
   → Uses get_blocked_items

4. "Create an epic called API Redesign in my_app"
   → Returns epic with ID: 507f1f77bcf86cd799439011

5. "Add a feature for REST endpoints under epic 507f1f77bcf86cd799439011"
   → Returns feature with ID: 507f191e810c19729de860ea

6. "Create a task to implement GET users endpoint under feature 507f191e810c19729de860ea"
   → Creates task

7. "Mark that task as done"
   → Updates task status, auto-updates feature/epic if all children done

8. "Show me what was recently updated"
   → Uses get_recently_updated
```

## 💡 Tips for Best Results

1. **Use natural language** - Claude understands context:
   - ✅ "Add a task for login validation"
   - ✅ "Mark the JWT task as done"
   - ✅ "What's blocked in my project?"

2. **Keep IDs handy** - Save ObjectIds for multi-step operations:
   - Claude will remember IDs within a conversation
   - You can ask "Create a task under that feature" (referring to previous)

3. **Use tree view first** - When starting work:
   - "Show me the project tree" gives full context
   - Helps identify where to add new items

4. **Leverage auto-status** - Don't manually update parent statuses:
   - Just mark child items done
   - Parents update automatically!

## 📝 License

MIT License - same as Vibe Todo Manager

---

**Ready to vibe code with AI-powered todo management!** 🎯✨
