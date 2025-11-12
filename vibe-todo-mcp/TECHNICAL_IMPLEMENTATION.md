# Technical Implementation

Deep dive into the architecture and implementation details of the Vibe Todo MCP Server.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Auto-Status Algorithm](#auto-status-algorithm)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Claude Desktop/Code             │
│    (Natural Language Interface)         │
└──────────────┬──────────────────────────┘
               │ MCP Protocol (stdio)
┌──────────────┴──────────────────────────┐
│      Vibe Todo MCP Server               │
│  ┌────────────────────────────────────┐ │
│  │  Tool Registry (30+ tools)         │ │
│  └─────────────┬──────────────────────┘ │
│                │                         │
│  ┌─────────────┴──────────────────────┐ │
│  │  Business Logic Layer              │ │
│  │  • Validation                      │ │
│  │  • Auto-status updates             │ │
│  │  • Progress calculation            │ │
│  └─────────────┬──────────────────────┘ │
│                │                         │
│  ┌─────────────┴──────────────────────┐ │
│  │  MongoDB Driver                    │ │
│  └─────────────┬──────────────────────┘ │
└────────────────┼──────────────────────────┘
                 │
┌────────────────┴──────────────────────────┐
│         MongoDB Database                  │
│  ┌──────────────────────────────────────┐│
│  │ vibe_todo_manager DB                 ││
│  │  ├── project_app1 (collection)      ││
│  │  ├── project_app2 (collection)      ││
│  │  └── project_app3 (collection)      ││
│  └──────────────────────────────────────┘│
└───────────────────────────────────────────┘
```

### Communication Protocol

**MCP (Model Context Protocol):**
- Bidirectional communication over stdio
- JSON-RPC 2.0 message format
- Request/response pattern
- Streamed output support

**Message Flow:**
```
Claude → MCP Request → Server
Server → MongoDB Query
MongoDB → Results → Server
Server → MCP Response → Claude
```

---

## Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",  // MCP SDK
    "mongodb": "^6.3.0",                     // MongoDB driver
    "dotenv": "^16.3.1"                      // Environment config
  },
  "devDependencies": {
    "typescript": "^5.3.0",                  // TypeScript compiler
    "@types/node": "^20.10.0"                // Node.js types
  }
}
```

### Language & Runtime

- **TypeScript** 5.3+ (compiled to ES2022)
- **Node.js** 16+ (ES Modules)
- **MongoDB** 4.4+ (native driver, no ODM)

### Build System

- **TypeScript Compiler** (`tsc`)
- **ES Module** resolution (Node16)
- **Source Maps** for debugging

---

## Project Structure

### Directory Layout

```
vibe-todo-mcp/
├── src/                          # TypeScript source
│   ├── index.ts                 # MCP server entry point (1000+ lines)
│   ├── mongodb.ts               # MongoDB connection utilities
│   ├── schemas.ts               # TypeScript type definitions
│   │
│   ├── tools/                   # Tool implementations
│   │   ├── projectTools.ts     # Project CRUD operations
│   │   ├── epicTools.ts        # Epic CRUD operations
│   │   ├── featureTools.ts     # Feature CRUD operations
│   │   ├── taskTools.ts        # Task CRUD operations
│   │   ├── treeTools.ts        # Tree view generation
│   │   └── searchTools.ts      # Search & filter operations
│   │
│   └── utils/                   # Utility modules
│       ├── validation.ts       # Input validation functions
│       └── statusUpdates.ts    # Auto-status update logic
│
├── build/                       # Compiled JavaScript (generated)
│   ├── index.js
│   ├── mongodb.js
│   ├── schemas.js
│   ├── tools/
│   └── utils/
│
├── node_modules/                # Dependencies
├── package.json                 # Project manifest
├── tsconfig.json               # TypeScript config
├── .env                        # Environment variables
└── README.md                   # Documentation
```

### File Purposes

| File | Purpose | Lines |
|------|---------|-------|
| `index.ts` | MCP server, tool registry, request handlers | ~1000 |
| `mongodb.ts` | Database connection, collection access | ~100 |
| `schemas.ts` | TypeScript types, constants | ~100 |
| `projectTools.ts` | Project operations | ~100 |
| `epicTools.ts` | Epic CRUD operations | ~150 |
| `featureTools.ts` | Feature CRUD operations | ~150 |
| `taskTools.ts` | Task CRUD + quick helpers | ~200 |
| `treeTools.ts` | Hierarchical tree generation | ~100 |
| `searchTools.ts` | Search and filtering | ~100 |
| `validation.ts` | Input validation logic | ~80 |
| `statusUpdates.ts` | Auto-status algorithms | ~120 |

---

## Core Components

### 1. MCP Server (`index.ts`)

**Responsibilities:**
- Initialize MCP server with SDK
- Register 30+ tool definitions
- Handle tool execution requests
- Route to appropriate tool functions
- Return formatted responses

**Key Code:**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'vibe-todo-mcp',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Register tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_epic',
        description: 'Create a new epic in a project',
        inputSchema: { /* ... */ }
      },
      // ... 29 more tools
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'create_epic':
      return await epicTools.createEpic(/* ... */);
    // ... handle 29 more tools
  }
});
```

### 2. MongoDB Connection (`mongodb.ts`)

**Responsibilities:**
- Establish database connection
- Manage connection lifecycle
- Provide collection access
- Create indexes

**Key Functions:**

```typescript
export async function connectDB(): Promise<Db> {
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

export function getProjectCollection(projectName: string): Collection {
  const collectionName = `project_${projectName}`;
  return getDB().collection(collectionName);
}

export async function listProjectCollections(): Promise<string[]> {
  const collections = await getDB().listCollections().toArray();
  return collections
    .filter(col => col.name.startsWith('project_'))
    .map(col => col.name.replace('project_', ''));
}
```

### 3. Type System (`schemas.ts`)

**Responsibilities:**
- Define TypeScript interfaces
- Type safety across codebase
- Constants for status values

**Key Types:**

```typescript
export interface Epic {
  _id?: ObjectId;
  type: 'epic';
  title: string;
  desc?: string;
  status: EpicStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Feature {
  _id?: ObjectId;
  type: 'feature';
  epic_id: ObjectId;
  title: string;
  desc?: string;
  uat?: string;
  status: ItemStatus;
  reference_file?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Progress {
  total: number;
  completed: number;
  percentage: number;
}
```

### 4. Tool Modules (`tools/*.ts`)

Each tool module exports async functions that:
1. Validate input
2. Perform MongoDB operations
3. Trigger side effects (auto-status updates)
4. Return results

**Example Structure:**

```typescript
// epicTools.ts
export async function createEpic(
  project: string,
  title: string,
  desc?: string,
  status: EpicStatus = 'planning'
): Promise<Epic> {
  // 1. Validate input
  validateTitle(title);
  validateEpicStatus(status);

  // 2. Create document
  const epicDoc = {
    type: 'epic',
    title: title.trim(),
    desc: desc || '',
    status,
    created_at: new Date(),
    updated_at: new Date()
  };

  // 3. Insert to MongoDB
  const collection = getProjectCollection(project);
  const result = await collection.insertOne(epicDoc);

  // 4. Return with ID
  return {
    _id: result.insertedId,
    ...epicDoc
  };
}
```

### 5. Validation (`utils/validation.ts`)

**Responsibilities:**
- Input validation
- ObjectId validation
- Status value validation
- Name sanitization

**Example:**

```typescript
export function validateObjectId(id: string, fieldName: string = 'id'): void {
  if (!ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}: must be a valid MongoDB ObjectId`);
  }
}

export function validateTitle(title: string): void {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Title is required and must be a non-empty string');
  }
}

export function validateProjectName(name: string): string {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Project name is required');
  }

  // Sanitize: lowercase, underscores, no special chars
  const sanitized = name.toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  return sanitized;
}
```

### 6. Auto-Status Logic (`utils/statusUpdates.ts`)

The heart of the system - see [Auto-Status Algorithm](#auto-status-algorithm) section.

---

## Data Flow

### Creating a Task (Full Flow)

```
1. User: "Create a task called X under feature Y"
   ↓
2. Claude: Parses intent, calls MCP tool
   ↓
3. MCP Server: Receives create_task request
   {
     name: "create_task",
     arguments: {
       project: "my_app",
       featureId: "507f191e810c19729de860ea",
       title: "X"
     }
   }
   ↓
4. Server: Routes to taskTools.createTask()
   ↓
5. Validation:
   - validateObjectId(featureId) ✓
   - validateTitle(title) ✓
   ↓
6. Check Feature Exists:
   collection.findOne({ _id: featureId, type: 'feature' })
   ✓ Feature found
   ↓
7. Create Task Document:
   {
     type: 'task',
     feature_id: ObjectId("507f191e810c19729de860ea"),
     title: "X",
     status: "todo",
     created_at: new Date(),
     updated_at: new Date()
   }
   ↓
8. Insert to MongoDB:
   collection.insertOne(taskDoc)
   → Returns insertedId: "507f1f77bcf86cd799439012"
   ↓
9. Return to MCP Server:
   {
     _id: "507f1f77bcf86cd799439012",
     type: "task",
     title: "X",
     ...
   }
   ↓
10. Server: Formats MCP Response
    {
      content: [{
        type: "text",
        text: JSON.stringify(task)
      }]
    }
    ↓
11. Claude: Receives response, formats for user
    ↓
12. User sees: "✅ Task created!"
```

### Updating Task Status (With Auto-Update)

```
1. User: "Mark task X as done"
   ↓
2. MCP Request: mark_task_done
   ↓
3. taskTools.markTaskDone()
   ↓
4. Get Current Task:
   → task = { _id, feature_id, ... }
   ↓
5. Update Task Status:
   collection.updateOne(
     { _id: taskId },
     { $set: { status: 'done', updated_at: new Date() } }
   )
   ↓
6. **Auto-Status Update Triggered**
   updateParentStatus(collection, task.feature_id, 'feature')
   ↓
   → Get all tasks in feature
   → Check: All tasks done? YES
   → Update feature status to 'done'
   ↓
   → Get feature's epic_id
   → updateParentStatus(collection, epic_id, 'epic')
   ↓
   → Get all features in epic
   → Check: All features done? YES
   → Update epic status to 'done'
   ↓
7. Return updated task to Claude
   ↓
8. User sees:
   "✅ Task marked as done"
   "✅ Feature auto-updated to done"
   "✅ Epic auto-updated to done"
```

---

## Auto-Status Algorithm

### The Core Algorithm

Located in `utils/statusUpdates.ts`:

```typescript
export async function updateParentStatus(
  collection: Collection,
  parentId: ObjectId,
  parentType: ItemType
): Promise<void> {
  // Determine child type and key
  let childType: ItemType;
  let childKey: string;

  if (parentType === 'epic') {
    childType = 'feature';
    childKey = 'epic_id';
  } else if (parentType === 'feature') {
    childType = 'task';
    childKey = 'feature_id';
  } else {
    return; // Tasks don't have children
  }

  // Get all children
  const children = await collection.find({
    type: childType,
    [childKey]: parentId
  }).toArray();

  // If no children, don't auto-update
  if (children.length === 0) {
    return;
  }

  // Check if all children are done
  const allDone = children.every(child => child.status === 'done');

  // Get current parent
  const parent = await collection.findOne({
    _id: parentId,
    type: parentType
  });

  if (!parent) {
    return;
  }

  let newStatus = parent.status;

  // Auto-update logic
  if (allDone && parent.status !== 'done') {
    newStatus = 'done';
  } else if (!allDone && parent.status === 'done') {
    // Revert to in_progress if parent was done
    newStatus = 'in_progress';
  }

  // Update parent if status changed
  if (newStatus !== parent.status) {
    await collection.updateOne(
      { _id: parentId, type: parentType },
      {
        $set: {
          status: newStatus,
          updated_at: new Date()
        }
      }
    );

    // Recursively update grandparent
    if (parentType === 'feature' && parent.epic_id) {
      await updateParentStatus(collection, parent.epic_id, 'epic');
    }
  }
}
```

### Recursion Flow

```
updateParentStatus(featureId, 'feature')
  ↓
  Check all tasks in feature
  ↓
  All tasks done? → Update feature to 'done'
  ↓
  Recursively call:
  updateParentStatus(epicId, 'epic')
    ↓
    Check all features in epic
    ↓
    All features done? → Update epic to 'done'
    ↓
    No grandparent, stop recursion
```

### Performance

- **Time Complexity**: O(n) where n = number of children
- **Database Queries**: 2-4 queries per level (find children, get parent, update parent, recursive call)
- **Optimizations**:
  - Early return if no children
  - Early return if status unchanged
  - Single update query per level

---

## Error Handling

### Error Types

1. **Validation Errors** (400-level)
   ```typescript
   throw new Error('Title is required and must be a non-empty string');
   throw new Error('Invalid ObjectId');
   throw new Error('Status must be one of: todo, in_progress, done, blocked');
   ```

2. **Not Found Errors** (404-level)
   ```typescript
   throw new Error('Epic not found with id: xxx');
   throw new Error('Project "xyz" not found');
   ```

3. **Database Errors** (500-level)
   ```typescript
   catch (error) {
     throw new Error('Failed to connect to MongoDB');
   }
   ```

### Error Propagation

```
Tool Function → Validation Error
  ↓
Caught in MCP Request Handler
  ↓
Formatted as MCP Error Response:
{
  content: [{
    type: "text",
    text: "Error: Invalid ObjectId"
  }],
  isError: true
}
  ↓
Claude receives error
  ↓
User sees: "Error: Invalid ObjectId"
```

### Global Error Handler

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // ... execute tool
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});
```

---

## Performance Considerations

### Database Indexing

Indexes created on project collections:

```typescript
await collection.createIndex({ type: 1 });
await collection.createIndex({ epic_id: 1 });
await collection.createIndex({ feature_id: 1 });
await collection.createIndex({ status: 1 });
await collection.createIndex({ type: 1, status: 1 }); // Compound
```

**Benefits:**
- Fast lookups by type
- Fast parent-child queries
- Fast status filtering
- Efficient compound queries

### Query Optimization

1. **Filtered Queries**
   ```typescript
   // Specific type and parent
   collection.find({ type: 'task', feature_id: xxx })
   // Uses compound index
   ```

2. **Projection** (not currently used, but could be)
   ```typescript
   collection.find({ type: 'epic' }, { projection: { title: 1, status: 1 } })
   ```

3. **Limit Results**
   ```typescript
   collection.find({}).sort({ updated_at: -1 }).limit(10)
   ```

### Scalability

**Current Design:**
- ✅ Good for: 1-100 projects, 1000s of items per project
- ⚠️ Bottleneck: Tree view with 1000s of items (loads all in memory)
- 🔧 Future: Add pagination, lazy loading

**Optimization Opportunities:**
1. Add query result caching
2. Implement pagination for large lists
3. Use aggregation pipeline for complex queries
4. Add connection pooling configuration

### Memory Management

- **Connection Reuse**: Single MongoDB connection for all requests
- **No In-Memory Cache**: All data fetched from MongoDB (ensures consistency)
- **Streaming**: Could add streaming for large result sets

---

## Security Considerations

### Current Implementation

1. **Input Validation**
   - All inputs validated before use
   - ObjectId format checked
   - String sanitization for project names

2. **No SQL Injection**
   - Using MongoDB driver with parameterized queries
   - No string concatenation in queries

3. **No Authentication**
   - MCP server runs locally
   - Trusts all requests from Claude
   - No multi-user support

### Production Considerations

For production use, add:

1. **Authentication**
   ```typescript
   // Validate MCP request origin
   // Add user authentication
   ```

2. **Authorization**
   ```typescript
   // Check user permissions
   // Restrict project access
   ```

3. **Rate Limiting**
   ```typescript
   // Prevent abuse
   // Throttle requests
   ```

4. **Audit Logging**
   ```typescript
   // Log all operations
   // Track who did what
   ```

---

## Summary

### Architecture Highlights

| Component | Technology | Purpose |
|-----------|-----------|---------|
| MCP Server | TypeScript + SDK | Claude integration |
| Database | MongoDB | Data persistence |
| Communication | Stdio (JSON-RPC) | Claude ↔ Server |
| Type Safety | TypeScript | Compile-time checks |
| Validation | Custom validators | Runtime checks |

### Code Statistics

- **Total Files**: 17 TypeScript files
- **Total Lines**: ~2,500 lines
- **Tools**: 30+ MCP tools
- **Dependencies**: 3 runtime, 2 dev

### Key Algorithms

1. **Auto-Status Update**: Recursive parent status propagation
2. **Progress Calculation**: Child completion percentage
3. **Tree Building**: Recursive hierarchy construction
4. **Cascade Delete**: Recursive child deletion

### Design Principles

1. **Type Safety**: TypeScript throughout
2. **Validation First**: Validate all inputs
3. **Separation of Concerns**: Tool modules isolated
4. **Error Propagation**: Consistent error handling
5. **Auto-Update**: Status propagates automatically

---

**The implementation balances simplicity with powerful features, making it perfect for AI-driven vibe coding!** 🎯✨
