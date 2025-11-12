# MongoDB MCP Setup Guide

This guide explains how to set up MongoDB MCP (Model Context Protocol) for Claude Code to interact with the Vibe Todo Manager database.

## What is MongoDB MCP?

MongoDB MCP is a server that allows Claude Code to communicate with MongoDB databases through the Model Context Protocol. It provides a standardized interface for database operations.

## Prerequisites

- MongoDB installed and running (locally or remote)
- Node.js installed (v16 or higher)
- Claude Code with MCP support

## Setup Steps

### 1. Install MongoDB

If you don't have MongoDB installed:

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
Download and install from: https://www.mongodb.com/try/download/community

**Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh --eval "db.version()"
```

You should see the MongoDB version printed.

### 3. Configure MongoDB MCP Server

MongoDB MCP servers can be installed via npm. Here are two popular options:

**Option A: @modelcontextprotocol/server-mongodb**
```bash
npm install -g @modelcontextprotocol/server-mongodb
```

**Option B: Direct MongoDB access from Claude Code**

Claude Code can connect directly to MongoDB if you provide the connection string in the backend configuration.

### 4. Configure Claude Code MCP

Create or edit your Claude Code MCP configuration file:

**Location:**
- macOS/Linux: `~/.config/claude-code/mcp_config.json`
- Windows: `%APPDATA%\claude-code\mcp_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "mongodb": {
      "command": "node",
      "args": [
        "/path/to/mcp-server-mongodb",
        "--uri",
        "mongodb://localhost:27017",
        "--database",
        "vibe_todo_manager"
      ]
    }
  }
}
```

### 5. Backend Configuration

The Vibe Todo Manager backend is already configured to connect to MongoDB. Update the `.env` file if needed:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=vibe_todo_manager

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 6. Start the Backend Server

```bash
cd backend
npm start
```

You should see:
```
✅ Connected to MongoDB: vibe_todo_manager
🚀 Vibe Todo API server running on port 3001
```

## Using MongoDB Atlas (Cloud Option)

If you prefer using MongoDB Atlas (free tier available):

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vibe_todo_manager?retryWrites=true&w=majority
```

## Testing the Connection

Test the API endpoints:

```bash
# Health check
curl http://localhost:3001/health

# List projects
curl http://localhost:3001/api/projects

# Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "my_first_project"}'
```

## Database Structure

The system automatically creates:
- Database: `vibe_todo_manager`
- Collections: One per project with naming pattern `project_<name>`
- Indexes: Automatically created for performance

## Troubleshooting

### Connection Issues

**Error: "Failed to connect to MongoDB"**
- Check if MongoDB is running: `mongosh`
- Verify connection string in `.env`
- Check firewall settings

**Error: "Authentication failed"**
- Verify username and password in connection string
- Check MongoDB user permissions

### MCP Issues

**Error: "MCP server not found"**
- Ensure MCP server is installed globally
- Check mcp_config.json path is correct
- Restart Claude Code

## Advanced Configuration

### Multiple Environments

Create separate `.env` files:
- `.env.development`
- `.env.production`
- `.env.test`

### Connection Options

Add MongoDB connection options:
```env
MONGODB_URI=mongodb://localhost:27017/vibe_todo_manager?maxPoolSize=10&retryWrites=true
```

### Security

For production:
1. Enable MongoDB authentication
2. Use strong passwords
3. Enable SSL/TLS
4. Use environment variables for credentials
5. Restrict network access

## Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB MCP Documentation](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)

## Support

If you encounter issues:
1. Check MongoDB logs: `tail -f /usr/local/var/log/mongodb/mongo.log` (macOS)
2. Check backend logs: `npm run dev` for detailed logging
3. Verify network connectivity
4. Check MongoDB permissions
