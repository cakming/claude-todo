# MCP Tools Reference

Complete reference for all 30+ tools available in the Vibe Todo MCP Server.

## Table of Contents

1. [Project Management Tools](#project-management-tools) (4 tools)
2. [Epic Management Tools](#epic-management-tools) (5 tools)
3. [Feature Management Tools](#feature-management-tools) (5 tools)
4. [Task Management Tools](#task-management-tools) (8 tools)
5. [Tree View Tools](#tree-view-tools) (2 tools)
6. [Search & Filter Tools](#search--filter-tools) (4 tools)
7. [Quick Reference](#quick-reference)

---

## Project Management Tools

### 1. `list_projects`

List all projects in the database.

**Parameters:** None

**Returns:** Array of project names

**Example Usage:**
```
"List all my projects"
"Show me what projects I have"
"What projects exist?"
```

**Example Response:**
```json
[
  "my_app",
  "website_redesign",
  "api_project"
]
```

---

### 2. `create_project`

Create a new project.

**Parameters:**
- `name` (required): Project name (will be sanitized)

**Returns:** Project object with sanitized name

**Example Usage:**
```
"Create a project called My Awesome App"
"Create a new project named E-Commerce Site"
"Make a project called mobile-app"
```

**Example Response:**
```json
{
  "name": "my_awesome_app",
  "originalName": "My Awesome App"
}
```

**Notes:**
- Names are automatically sanitized (lowercase, underscores replace spaces)
- Special characters are removed
- Returns error if project already exists

---

### 3. `delete_project`

Delete a project and ALL its data (epics, features, tasks).

**Parameters:**
- `name` (required): Project name to delete

**Returns:** Success message

**Example Usage:**
```
"Delete the old_project"
"Remove the test_project"
```

**Example Response:**
```
Project 'old_project' deleted successfully
```

**⚠️ WARNING:** This permanently deletes all data. Cannot be undone!

---

### 4. `get_project_stats`

Get statistics about a project.

**Parameters:**
- `project` (required): Project name

**Returns:** Object with counts

**Example Usage:**
```
"Show me stats for my_app"
"How many items are in website_redesign?"
"Get project statistics for api_project"
```

**Example Response:**
```json
{
  "epics": 5,
  "features": 23,
  "tasks": 87,
  "totalItems": 115
}
```

---

## Epic Management Tools

### 5. `list_epics`

List all epics in a project.

**Parameters:**
- `project` (required): Project name

**Returns:** Array of epic objects

**Example Usage:**
```
"List all epics in my_app"
"Show me epics for website_redesign"
"What epics exist in api_project?"
```

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "type": "epic",
    "title": "User Authentication",
    "desc": "Complete user auth system with JWT",
    "status": "in_progress",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T12:00:00.000Z"
  }
]
```

---

### 6. `get_epic`

Get details of a specific epic.

**Parameters:**
- `project` (required): Project name
- `epicId` (required): Epic ObjectId

**Returns:** Epic object with details

**Example Usage:**
```
"Get details of epic 507f1f77bcf86cd799439011 in my_app"
"Show me epic 507f1f77bcf86cd799439011"
```

**Example Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "type": "epic",
  "title": "User Authentication",
  "desc": "Complete user authentication system",
  "status": "in_progress",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T12:00:00.000Z"
}
```

---

### 7. `create_epic`

Create a new epic in a project.

**Parameters:**
- `project` (required): Project name
- `title` (required): Epic title
- `desc` (optional): Epic description
- `status` (optional): One of: `planning`, `in_progress`, `done`, `blocked` (default: `planning`)

**Returns:** Created epic object

**Example Usage:**
```
"Create an epic called User Authentication in my_app"
"Add an epic for API Redesign with status planning"
"Create epic Payment Processing with description Handle all payment flows"
```

**Example Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "type": "epic",
  "title": "User Authentication",
  "desc": "",
  "status": "planning",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

---

### 8. `update_epic`

Update an existing epic.

**Parameters:**
- `project` (required): Project name
- `epicId` (required): Epic ObjectId
- `title` (optional): New title
- `desc` (optional): New description
- `status` (optional): New status

**Returns:** Updated epic object

**Example Usage:**
```
"Update epic 507f1f77bcf86cd799439011 to status in_progress"
"Change the title of epic 507f1f77bcf86cd799439011 to User Auth System"
"Update epic description to Include OAuth providers"
```

**Example Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "type": "epic",
  "title": "User Auth System",
  "desc": "Include OAuth providers",
  "status": "in_progress",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T14:00:00.000Z"
}
```

---

### 9. `delete_epic`

Delete an epic and ALL its features and tasks (cascade delete).

**Parameters:**
- `project` (required): Project name
- `epicId` (required): Epic ObjectId

**Returns:** Success message

**Example Usage:**
```
"Delete epic 507f1f77bcf86cd799439011 from my_app"
"Remove epic 507f1f77bcf86cd799439011"
```

**Example Response:**
```
Epic deleted successfully
```

**⚠️ WARNING:** This deletes the epic and all related features and tasks!

---

## Feature Management Tools

### 10. `list_features`

List features in a project (optionally filtered by epic).

**Parameters:**
- `project` (required): Project name
- `epicId` (optional): Filter by epic ID

**Returns:** Array of feature objects

**Example Usage:**
```
"List all features in my_app"
"Show features for epic 507f1f77bcf86cd799439011"
"What features exist in my_app?"
```

**Example Response:**
```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "type": "feature",
    "epic_id": "507f1f77bcf86cd799439011",
    "title": "Login Form",
    "desc": "User login interface",
    "uat": "Users can log in with email and password",
    "status": "todo",
    "reference_file": "src/auth/LoginForm.tsx",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
]
```

---

### 11. `get_feature`

Get details of a specific feature.

**Parameters:**
- `project` (required): Project name
- `featureId` (required): Feature ObjectId

**Returns:** Feature object

**Example Usage:**
```
"Get feature 507f191e810c19729de860ea from my_app"
"Show details of feature 507f191e810c19729de860ea"
```

---

### 12. `create_feature`

Create a new feature under an epic.

**Parameters:**
- `project` (required): Project name
- `epicId` (required): Parent epic ObjectId
- `title` (required): Feature title
- `desc` (optional): Feature description
- `uat` (optional): User acceptance testing criteria
- `status` (optional): One of: `todo`, `in_progress`, `done`, `blocked` (default: `todo`)
- `referenceFile` (optional): File path reference

**Returns:** Created feature object

**Example Usage:**
```
"Create a feature called Login Form under epic 507f1f77bcf86cd799439011"
"Add feature Password Reset with UAT Users can reset password via email"
"Create feature OAuth Integration with reference file src/auth/oauth.ts"
```

**Example Response:**
```json
{
  "_id": "507f191e810c19729de860ea",
  "type": "feature",
  "epic_id": "507f1f77bcf86cd799439011",
  "title": "Login Form",
  "desc": "",
  "uat": "",
  "status": "todo",
  "reference_file": "",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

---

### 13. `update_feature`

Update a feature (auto-updates parent epic status if all features are done).

**Parameters:**
- `project` (required): Project name
- `featureId` (required): Feature ObjectId
- `title` (optional): New title
- `desc` (optional): New description
- `uat` (optional): New UAT
- `status` (optional): New status
- `reference_file` (optional): New reference file

**Returns:** Updated feature object

**Example Usage:**
```
"Update feature 507f191e810c19729de860ea to status in_progress"
"Mark feature 507f191e810c19729de860ea as done"
"Update feature UAT to Users can login with OAuth providers"
```

**🌟 Auto-Status Update:** If all features in the epic are marked `done`, the epic automatically becomes `done`!

---

### 14. `delete_feature`

Delete a feature and all its tasks (auto-updates parent epic).

**Parameters:**
- `project` (required): Project name
- `featureId` (required): Feature ObjectId

**Returns:** Success message

**Example Usage:**
```
"Delete feature 507f191e810c19729de860ea from my_app"
"Remove feature 507f191e810c19729de860ea"
```

**🌟 Auto-Status Update:** Parent epic status is recalculated after deletion.

---

## Task Management Tools

### 15. `list_tasks`

List tasks in a project (optionally filtered by feature).

**Parameters:**
- `project` (required): Project name
- `featureId` (optional): Filter by feature ID

**Returns:** Array of task objects

**Example Usage:**
```
"List all tasks in my_app"
"Show tasks for feature 507f191e810c19729de860ea"
"What tasks exist in my_app?"
```

---

### 16. `get_task`

Get details of a specific task.

**Parameters:**
- `project` (required): Project name
- `taskId` (required): Task ObjectId

**Returns:** Task object

**Example Usage:**
```
"Get task 507f1f77bcf86cd799439012 from my_app"
"Show details of task 507f1f77bcf86cd799439012"
```

---

### 17. `create_task`

Create a new task under a feature.

**Parameters:**
- `project` (required): Project name
- `featureId` (required): Parent feature ObjectId
- `title` (required): Task title
- `desc` (optional): Task description
- `uat` (optional): Definition of done
- `status` (optional): One of: `todo`, `in_progress`, `done`, `blocked` (default: `todo`)
- `referenceFile` (optional): File path reference

**Returns:** Created task object

**Example Usage:**
```
"Create a task called Implement JWT validation under feature 507f191e810c19729de860ea"
"Add task Create login API endpoint with description POST /auth/login"
"Create task Add password hashing with reference file src/auth/password.ts"
```

**Example Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "type": "task",
  "feature_id": "507f191e810c19729de860ea",
  "title": "Implement JWT validation",
  "desc": "",
  "uat": "",
  "status": "todo",
  "reference_file": "",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

---

### 18. `update_task`

Update a task (auto-updates parent feature and epic status).

**Parameters:**
- `project` (required): Project name
- `taskId` (required): Task ObjectId
- `title` (optional): New title
- `desc` (optional): New description
- `uat` (optional): New UAT
- `status` (optional): New status
- `reference_file` (optional): New reference file

**Returns:** Updated task object

**Example Usage:**
```
"Update task 507f1f77bcf86cd799439012 to status in_progress"
"Mark task 507f1f77bcf86cd799439012 as done"
"Update task description to Use bcrypt for hashing"
```

**🌟 Auto-Status Update:**
- If all tasks in feature are `done` → Feature becomes `done`
- If all features in epic are `done` → Epic becomes `done`

---

### 19. `delete_task`

Delete a task (auto-updates parent feature and epic).

**Parameters:**
- `project` (required): Project name
- `taskId` (required): Task ObjectId

**Returns:** Success message

**Example Usage:**
```
"Delete task 507f1f77bcf86cd799439012 from my_app"
"Remove task 507f1f77bcf86cd799439012"
```

---

### 20. `mark_task_done`

Quick helper to mark a task as done.

**Parameters:**
- `project` (required): Project name
- `taskId` (required): Task ObjectId

**Returns:** Updated task object

**Example Usage:**
```
"Mark task 507f1f77bcf86cd799439012 as done"
"Complete task 507f1f77bcf86cd799439012"
"Task 507f1f77bcf86cd799439012 is finished"
```

**🌟 This is a convenience method - equivalent to `update_task` with `status: "done"`**

---

### 21. `mark_task_in_progress`

Quick helper to mark a task as in progress.

**Parameters:**
- `project` (required): Project name
- `taskId` (required): Task ObjectId

**Returns:** Updated task object

**Example Usage:**
```
"Start working on task 507f1f77bcf86cd799439012"
"Mark task 507f1f77bcf86cd799439012 as in progress"
"I'm working on task 507f1f77bcf86cd799439012"
```

---

### 22. `mark_task_blocked`

Quick helper to mark a task as blocked.

**Parameters:**
- `project` (required): Project name
- `taskId` (required): Task ObjectId

**Returns:** Updated task object

**Example Usage:**
```
"Mark task 507f1f77bcf86cd799439012 as blocked"
"Task 507f1f77bcf86cd799439012 is blocked"
"Block task 507f1f77bcf86cd799439012"
```

---

## Tree View Tools

### 23. `get_project_tree`

Get full hierarchical tree of a project with all epics, features, and tasks.

**Parameters:**
- `project` (required): Project name

**Returns:** Array of epics with nested features and tasks, including progress data

**Example Usage:**
```
"Show me the full tree of my_app"
"Get project tree for website_redesign"
"Display the hierarchy of api_project"
```

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "type": "epic",
    "title": "User Authentication",
    "desc": "Complete user auth system",
    "status": "in_progress",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T12:00:00.000Z",
    "progress": {
      "total": 3,
      "completed": 1,
      "percentage": 33
    },
    "features": [
      {
        "_id": "507f191e810c19729de860ea",
        "type": "feature",
        "epic_id": "507f1f77bcf86cd799439011",
        "title": "Login Form",
        "status": "done",
        "progress": {
          "total": 5,
          "completed": 5,
          "percentage": 100
        },
        "tasks": [
          {
            "_id": "507f1f77bcf86cd799439012",
            "type": "task",
            "feature_id": "507f191e810c19729de860ea",
            "title": "Implement JWT validation",
            "status": "done"
          }
        ]
      }
    ]
  }
]
```

**Perfect for:** Getting a complete overview of project structure and progress

---

### 24. `get_epic_tree`

Get hierarchical tree of a specific epic with its features and tasks.

**Parameters:**
- `project` (required): Project name
- `epicId` (required): Epic ObjectId

**Returns:** Epic object with nested features and tasks, including progress data

**Example Usage:**
```
"Show me epic 507f1f77bcf86cd799439011 tree"
"Get tree for epic 507f1f77bcf86cd799439011 in my_app"
"Display hierarchy of epic 507f1f77bcf86cd799439011"
```

**Perfect for:** Focusing on a specific epic and its children

---

## Search & Filter Tools

### 25. `search_items`

Search for items by text query across title, description, UAT, and reference files.

**Parameters:**
- `project` (required): Project name
- `query` (optional): Search text (case-insensitive)
- `type` (optional): Filter by type: `epic`, `feature`, or `task`
- `status` (optional): Filter by status

**Returns:** Array of matching items

**Example Usage:**
```
"Search for authentication in my_app"
"Find all items with JWT"
"Search for items containing login"
"Find all tasks with API in my_app"
"Search for blocked items with payment"
```

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "type": "epic",
    "title": "User Authentication",
    "desc": "Complete user authentication system with JWT"
  },
  {
    "_id": "507f191e810c19729de860ea",
    "type": "feature",
    "title": "Login Form",
    "desc": "User login interface with authentication"
  }
]
```

**Perfect for:** Finding items across the entire project

---

### 26. `get_blocked_items`

Get all blocked items in a project.

**Parameters:**
- `project` (required): Project name

**Returns:** Array of all items with status `blocked`

**Example Usage:**
```
"Show me all blocked items in my_app"
"What's blocked in website_redesign?"
"Find blocked items"
```

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "type": "task",
    "title": "Implement OAuth",
    "status": "blocked",
    "desc": "Waiting for third-party API keys"
  }
]
```

**Perfect for:** Daily standup, identifying bottlenecks

---

### 27. `get_in_progress_items`

Get all in-progress items in a project.

**Parameters:**
- `project` (required): Project name

**Returns:** Array of all items with status `in_progress`

**Example Usage:**
```
"What am I working on in my_app?"
"Show me in-progress items"
"What's currently being worked on?"
```

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "type": "task",
    "title": "Implement JWT validation",
    "status": "in_progress"
  }
]
```

**Perfect for:** Seeing current active work

---

### 28. `get_recently_updated`

Get recently updated items (sorted by update time).

**Parameters:**
- `project` (required): Project name
- `limit` (optional): Number of items to return (default: 10)

**Returns:** Array of recently updated items

**Example Usage:**
```
"What was recently updated in my_app?"
"Show me the last 20 changes"
"What changed recently?"
```

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "type": "task",
    "title": "Implement JWT validation",
    "status": "done",
    "updated_at": "2025-01-15T14:30:00.000Z"
  },
  {
    "_id": "507f191e810c19729de860ea",
    "type": "feature",
    "title": "Login Form",
    "status": "done",
    "updated_at": "2025-01-15T14:29:00.000Z"
  }
]
```

**Perfect for:** Reviewing recent activity, daily summaries

---

## Quick Reference

### Status Values

**Epics:**
- `planning` - Epic is being planned
- `in_progress` - Work has started
- `done` - All features completed
- `blocked` - Work is blocked

**Features & Tasks:**
- `todo` - Not started yet
- `in_progress` - Currently being worked on
- `done` - Completed
- `blocked` - Work is blocked

### ObjectId Format

MongoDB ObjectIds are 24-character hex strings:
```
507f1f77bcf86cd799439011
```

Copy these from tool responses to use in subsequent operations.

### Tool Categories Summary

| Category | Count | Key Feature |
|----------|-------|-------------|
| Project | 4 | Manage projects and get stats |
| Epic | 5 | Full CRUD with cascade delete |
| Feature | 5 | CRUD with auto-parent-update |
| Task | 8 | CRUD + quick status helpers |
| Tree View | 2 | Hierarchical views with progress |
| Search | 4 | Find items by text, status, recency |

### Auto-Status Update Flow

```
Task marked "done"
  ↓
Check all sibling tasks
  ↓
All tasks "done"? → Feature becomes "done"
  ↓
Check all sibling features
  ↓
All features "done"? → Epic becomes "done"
```

This happens automatically with every task/feature status update!

---

**Total: 28 MCP Tools** + auto-status logic + progress calculation = 30+ capabilities! 🎯
