# Vibe Todo MCP Server - Complete Setup Guide

This guide walks you through installing, configuring, and using the Vibe Todo MCP Server with Claude Desktop.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Building the MCP Server](#building-the-mcp-server)
4. [Configuration](#configuration)
5. [Testing the Setup](#testing-the-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

### Required Software

- **Node.js** v16 or higher
  ```bash
  node --version  # Should show v16.x.x or higher
  ```

- **MongoDB** 4.4 or higher (running)
  ```bash
  mongosh  # Should connect successfully
  ```

- **Claude Desktop** (latest version)
  - Download from: https://claude.ai/download

### Verify MongoDB is Running

**macOS/Linux:**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB if not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

**Windows:**
```bash
# Check MongoDB service status
sc query MongoDB

# Start if not running
net start MongoDB
```

**Test Connection:**
```bash
mongosh "mongodb://localhost:27017"
# Should connect without errors
```

---

## Installation

### Step 1: Navigate to MCP Server Directory

```bash
cd /path/to/claude-todo/vibe-todo-mcp
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**
```
added 150 packages, and audited 151 packages in 8s

23 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**What Gets Installed:**
- `@modelcontextprotocol/sdk` - MCP SDK for Claude integration
- `mongodb` - MongoDB native driver
- `dotenv` - Environment variable management
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

---

## Building the MCP Server

### Step 1: Create Environment File

```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit `.env`:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017

# Database name (must match backend)
DB_NAME=vibe_todo_manager
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=vibe_todo_manager
```

### Step 3: Build TypeScript to JavaScript

```bash
npm run build
```

**Expected Output:**
```
> vibe-todo-mcp@1.0.0 build
> tsc

# No output means successful compilation
```

**What Happens:**
- TypeScript files in `src/` are compiled to JavaScript
- Output is placed in `build/` directory
- Source maps and type declarations are generated

**Verify Build:**
```bash
ls -la build/

# You should see:
# index.js
# mongodb.js
# schemas.js
# tools/
# utils/
```

### Step 4: Test the MCP Server (Optional)

```bash
# The MCP server communicates via stdio, so this won't do much
# But it verifies there are no startup errors
node build/index.js
```

Press `Ctrl+C` to stop.

---

## Configuration

### Claude Desktop Configuration

The MCP server needs to be registered with Claude Desktop so Claude can use the tools.

### Step 1: Locate Claude Desktop Config File

**macOS/Linux:**
```bash
~/.config/claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

### Step 2: Edit Configuration File

**If the file doesn't exist, create it:**
```bash
# macOS/Linux
mkdir -p ~/.config/claude
touch ~/.config/claude/claude_desktop_config.json

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"
New-Item -ItemType File -Force -Path "$env:APPDATA\Claude\claude_desktop_config.json"
```

### Step 3: Add MCP Server Configuration

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vibe-todo": {
      "command": "node",
      "args": [
        "/absolute/path/to/claude-todo/vibe-todo-mcp/build/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017",
        "DB_NAME": "vibe_todo_manager"
      }
    }
  }
}
```

**⚠️ IMPORTANT:** Replace `/absolute/path/to/` with your actual path!

**To find your absolute path:**

```bash
# Navigate to the MCP directory
cd /path/to/claude-todo/vibe-todo-mcp

# Get absolute path
pwd

# macOS/Linux example output:
# /Users/yourname/projects/claude-todo/vibe-todo-mcp

# Windows example output:
# C:\Users\yourname\projects\claude-todo\vibe-todo-mcp
```

**Full Example Configuration:**

```json
{
  "mcpServers": {
    "vibe-todo": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/claude-todo/vibe-todo-mcp/build/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017",
        "DB_NAME": "vibe_todo_manager"
      }
    }
  }
}
```

### Step 4: Configuration Options

**For MongoDB Atlas:**
```json
{
  "mcpServers": {
    "vibe-todo": {
      "command": "node",
      "args": [
        "/absolute/path/to/vibe-todo-mcp/build/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb+srv://user:pass@cluster.mongodb.net/",
        "DB_NAME": "vibe_todo_manager"
      }
    }
  }
}
```

**For Custom Port:**
```json
{
  "mcpServers": {
    "vibe-todo": {
      "command": "node",
      "args": [
        "/absolute/path/to/vibe-todo-mcp/build/index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27018",
        "DB_NAME": "vibe_todo_manager"
      }
    }
  }
}
```

### Step 5: Restart Claude Desktop

**Complete Restart Required:**

1. Quit Claude Desktop completely (not just close window)
   - macOS: `Cmd+Q`
   - Windows: Right-click taskbar icon → Quit
   - Linux: `killall claude` or close from system tray

2. Wait 5 seconds

3. Reopen Claude Desktop

4. The MCP server will start automatically when Claude launches

---

## Testing the Setup

### Verify MCP Server Loaded

1. Open Claude Desktop

2. Start a new conversation

3. Type: **"List my projects"**

4. Claude should respond using the `list_projects` tool

**Expected Response:**
```
I'll check what projects you have.

[Uses list_projects tool]

You currently have no projects. Would you like to create one?
```

or if you have projects:
```
[Uses list_projects tool]

You have the following projects:
- my_app
- website_redesign
- api_project
```

### Create Your First Project

Type: **"Create a project called test_app"**

**Expected Response:**
```
[Uses create_project tool]

Project created successfully!
- Name: test_app
- Original name: test_app

The project is now ready for use.
```

### Verify Auto-Status Updates

Let's test the killer feature:

```
You: "Create an epic called Testing in test_app with status planning"

Claude: [Creates epic]

You: "Add a feature called Basic Tests under that epic"

Claude: [Creates feature]

You: "Create two tasks under that feature:
     - Write unit tests
     - Write integration tests"

Claude: [Creates 2 tasks]

You: "Mark both tasks as done"

Claude: [Marks tasks done]
        [Auto-updates feature to done]
        [Auto-updates epic to done]

Both tasks marked as done!
The feature "Basic Tests" has been automatically updated to "done" since all its tasks are complete.
The epic "Testing" has also been updated to "done" since all its features are complete.
```

---

## Troubleshooting

### MCP Server Not Showing Up

**Symptom:** Claude doesn't respond to MCP commands

**Solutions:**

1. **Check Claude Desktop Logs:**

   **macOS:**
   ```bash
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```

   **Windows:**
   ```bash
   Get-Content "$env:APPDATA\Claude\logs\mcp*.log" -Wait -Tail 50
   ```

2. **Verify Configuration Path:**
   ```bash
   # The path in claude_desktop_config.json must be ABSOLUTE
   # ❌ Wrong: "./vibe-todo-mcp/build/index.js"
   # ✅ Correct: "/Users/name/claude-todo/vibe-todo-mcp/build/index.js"
   ```

3. **Test Build:**
   ```bash
   cd vibe-todo-mcp
   node build/index.js
   # Should show: ✅ Connected to MongoDB: vibe_todo_manager
   # Then hang (waiting for stdio input)
   # Press Ctrl+C to exit
   ```

4. **Rebuild:**
   ```bash
   cd vibe-todo-mcp
   rm -rf build node_modules
   npm install
   npm run build
   ```

5. **Restart Claude Completely:**
   - Quit (don't just close)
   - Wait 10 seconds
   - Reopen

### MongoDB Connection Errors

**Symptom:** Error: "Failed to connect to MongoDB"

**Solutions:**

1. **Verify MongoDB is Running:**
   ```bash
   mongosh
   # Should connect successfully
   ```

2. **Check Connection String:**
   ```bash
   # In .env file, ensure:
   MONGODB_URI=mongodb://localhost:27017

   # Not:
   MONGODB_URI=mongodb://localhost:27017/
   # (trailing slash can cause issues)
   ```

3. **Test Connection:**
   ```bash
   mongosh "mongodb://localhost:27017/vibe_todo_manager"
   ```

4. **Check Firewall:**
   ```bash
   # Ensure port 27017 is not blocked
   telnet localhost 27017
   # Should connect
   ```

### Build Errors

**Symptom:** TypeScript compilation fails

**Solutions:**

1. **Check Node Version:**
   ```bash
   node --version
   # Must be v16 or higher
   ```

2. **Reinstall Dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check TypeScript:**
   ```bash
   npx tsc --version
   # Should show version 5.x.x
   ```

### Permission Errors

**Symptom:** "EACCES: permission denied"

**Solutions:**

```bash
# Fix node_modules permissions
sudo chown -R $(whoami) node_modules

# Fix npm cache
npm cache clean --force

# Reinstall
npm install
```

### Tool Execution Errors

**Symptom:** Tools return errors when used

**Common Errors:**

1. **"Project 'xyz' not found"**
   ```
   Solution: Create project first
   "Create a project called xyz"
   ```

2. **"Epic not found with id: xxx"**
   ```
   Solution: Get valid epic ID first
   "List epics in my_project"
   Then use the returned ID
   ```

3. **"Invalid ObjectId"**
   ```
   Solution: Use the full 24-character hex ID
   ✅ Correct: "507f1f77bcf86cd799439011"
   ❌ Wrong: "507f"
   ```

### Debugging Mode

Enable detailed logging:

**1. Edit `claude_desktop_config.json`:**
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
        "DB_NAME": "vibe_todo_manager",
        "DEBUG": "true"
      }
    }
  }
}
```

**2. View logs:**
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp-vibe-todo.log

# Linux
tail -f ~/.config/claude/logs/mcp-vibe-todo.log

# Windows
Get-Content "$env:APPDATA\Claude\logs\mcp-vibe-todo.log" -Wait
```

---

## Verification Checklist

Use this checklist to verify everything is working:

- [ ] Node.js v16+ installed (`node --version`)
- [ ] MongoDB running (`mongosh` connects)
- [ ] Dependencies installed (`npm install` successful)
- [ ] Build successful (`npm run build` no errors)
- [ ] `.env` file created with correct MongoDB URI
- [ ] `claude_desktop_config.json` updated with absolute path
- [ ] Claude Desktop completely restarted
- [ ] Can list projects (`list_projects` tool works)
- [ ] Can create project (project creation works)
- [ ] Auto-status updates work (test with epic→feature→task hierarchy)

---

## Next Steps

Once setup is complete:

1. **Read the Tools Reference**: See `TOOLS_REFERENCE.md` for all 30+ available tools
2. **Try Example Sessions**: See `USAGE_EXAMPLES.md` for real-world scenarios
3. **Understand Key Features**: See `KEY_FEATURES.md` for auto-status updates and more
4. **Review Technical Details**: See main `README.md` for architecture

---

## Quick Reference

**Rebuild after changes:**
```bash
cd vibe-todo-mcp
npm run build
# Restart Claude Desktop
```

**View MongoDB data:**
```bash
mongosh vibe_todo_manager
db.project_my_app.find().pretty()
```

**Reset everything:**
```bash
# Drop all data (WARNING: Deletes everything!)
mongosh vibe_todo_manager --eval "db.dropDatabase()"

# Rebuild MCP server
cd vibe-todo-mcp
rm -rf build
npm run build
```

**Config file location:**
- macOS: `~/.config/claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

---

**Setup complete! You're ready to vibe code with AI-powered todo management.** 🎯✨
