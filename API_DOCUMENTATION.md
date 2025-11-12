# Vibe Todo Manager - API Documentation

Base URL: `http://localhost:3001/api`

## Response Format

All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional validation errors
}
```

## Endpoints

### Health Check

#### GET /health

Check if the API server is running.

**Response:**
```json
{
  "success": true,
  "message": "Vibe Todo API is running",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Projects

### GET /api/projects

Get all projects.

**Response:**
```json
{
  "success": true,
  "data": ["my_first_project", "ecommerce_app", "api_redesign"]
}
```

### POST /api/projects

Create a new project.

**Request Body:**
```json
{
  "name": "My New Project"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "my_new_project",
    "originalName": "My New Project"
  }
}
```

**Notes:**
- Project names are automatically sanitized (lowercase, underscores)
- Returns 409 if project already exists

### DELETE /api/projects/:name

Delete a project and all its data.

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Warning:** This permanently deletes all epics, features, and tasks in the project.

---

## Epics

All epic endpoints require a `project` parameter in the URL path.

### GET /api/:project/epics

Get all epics for a project.

**Example:** `GET /api/my_project/epics`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4e1a1",
      "type": "epic",
      "title": "E-Commerce Platform v2",
      "desc": "Complete rebuild of the e-commerce system",
      "status": "in_progress",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### GET /api/:project/epics/:id

Get a single epic by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4e1a1",
    "type": "epic",
    "title": "E-Commerce Platform v2",
    "desc": "Complete rebuild of the e-commerce system",
    "status": "in_progress",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

### POST /api/:project/epics

Create a new epic.

**Request Body:**
```json
{
  "title": "E-Commerce Platform v2",
  "desc": "Complete rebuild of the e-commerce system",
  "status": "planning"
}
```

**Fields:**
- `title` (required): Epic title
- `desc` (optional): Description
- `status` (optional): One of: `planning`, `in_progress`, `done`, `blocked` (default: `planning`)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4e1a1",
    "type": "epic",
    "title": "E-Commerce Platform v2",
    "desc": "Complete rebuild of the e-commerce system",
    "status": "planning",
    "created_at": "2025-01-15T10:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

### PUT /api/:project/epics/:id

Update an epic.

**Request Body:**
```json
{
  "title": "Updated Epic Title",
  "status": "in_progress"
}
```

**Notes:**
- Only include fields you want to update
- Cannot change `type`, `_id`, or `created_at`

### DELETE /api/:project/epics/:id

Delete an epic and all its features and tasks (cascade delete).

**Response:**
```json
{
  "success": true,
  "message": "Epic and all related features and tasks deleted successfully"
}
```

---

## Features

All feature endpoints require a `project` parameter in the URL path.

### GET /api/:project/features/by-epic/:epicId

Get all features for a specific epic.

**Example:** `GET /api/my_project/features/by-epic/60d5ec49f1b2c8b1f8e4e1a1`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "type": "feature",
      "epic_id": "60d5ec49f1b2c8b1f8e4e1a1",
      "title": "Shopping Cart",
      "desc": "Implement shopping cart functionality",
      "uat": "Users can add items, view cart, and proceed to checkout",
      "status": "todo",
      "reference_file": "src/features/cart/Cart.tsx",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### GET /api/:project/features/:id

Get a single feature by ID.

### POST /api/:project/features/by-epic/:epicId

Create a new feature under a specific epic.

**Request Body:**
```json
{
  "title": "Shopping Cart",
  "desc": "Implement shopping cart functionality",
  "uat": "Users can add items, view cart, and proceed to checkout",
  "status": "todo",
  "reference_file": "src/features/cart/Cart.tsx"
}
```

**Fields:**
- `title` (required): Feature title
- `desc` (optional): Description
- `uat` (optional): User Acceptance Testing criteria
- `status` (optional): One of: `todo`, `in_progress`, `done`, `blocked` (default: `todo`)
- `reference_file` (optional): Path to related files

### PUT /api/:project/features/:id

Update a feature.

**Notes:**
- Auto-updates parent epic status if all features are done
- Cannot change `epic_id`

### DELETE /api/:project/features/:id

Delete a feature and all its tasks (cascade delete).

**Notes:**
- Updates parent epic status after deletion

---

## Tasks

All task endpoints require a `project` parameter in the URL path.

### GET /api/:project/tasks/by-feature/:featureId

Get all tasks for a specific feature.

**Example:** `GET /api/my_project/tasks/by-feature/60d5ec49f1b2c8b1f8e4e1a2`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4e1a3",
      "type": "task",
      "feature_id": "60d5ec49f1b2c8b1f8e4e1a2",
      "title": "Add item to cart API",
      "desc": "Implement POST endpoint for adding items",
      "uat": "API accepts product ID and quantity, returns updated cart",
      "status": "in_progress",
      "reference_file": "src/api/cart.ts",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

### GET /api/:project/tasks/:id

Get a single task by ID.

### POST /api/:project/tasks/by-feature/:featureId

Create a new task under a specific feature.

**Request Body:**
```json
{
  "title": "Add item to cart API",
  "desc": "Implement POST endpoint for adding items",
  "uat": "API accepts product ID and quantity, returns updated cart",
  "status": "todo",
  "reference_file": "src/api/cart.ts"
}
```

**Fields:**
- `title` (required): Task title
- `desc` (optional): Description
- `uat` (optional): Definition of done
- `status` (optional): One of: `todo`, `in_progress`, `done`, `blocked` (default: `todo`)
- `reference_file` (optional): Path to related files

### PUT /api/:project/tasks/:id

Update a task.

**Notes:**
- Auto-updates parent feature status if all tasks are done
- Auto-updates grandparent epic status if needed

### DELETE /api/:project/tasks/:id

Delete a task.

**Notes:**
- Updates parent feature status after deletion

---

## Tree View

Get hierarchical tree structure with progress indicators.

### GET /api/:project/tree

Get complete project tree with all epics, features, and tasks.

**Example:** `GET /api/my_project/tree`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4e1a1",
      "type": "epic",
      "title": "E-Commerce Platform v2",
      "desc": "Complete rebuild",
      "status": "in_progress",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z",
      "progress": {
        "total": 3,
        "completed": 1,
        "percentage": 33
      },
      "features": [
        {
          "_id": "60d5ec49f1b2c8b1f8e4e1a2",
          "type": "feature",
          "epic_id": "60d5ec49f1b2c8b1f8e4e1a1",
          "title": "Shopping Cart",
          "desc": "Cart functionality",
          "uat": "Users can manage cart",
          "status": "in_progress",
          "reference_file": "src/features/cart/",
          "created_at": "2025-01-15T10:00:00.000Z",
          "updated_at": "2025-01-15T10:00:00.000Z",
          "progress": {
            "total": 5,
            "completed": 2,
            "percentage": 40
          },
          "tasks": [
            {
              "_id": "60d5ec49f1b2c8b1f8e4e1a3",
              "type": "task",
              "feature_id": "60d5ec49f1b2c8b1f8e4e1a2",
              "title": "Add item to cart API",
              "desc": "POST endpoint",
              "uat": "API works correctly",
              "status": "done",
              "reference_file": "src/api/cart.ts",
              "created_at": "2025-01-15T10:00:00.000Z",
              "updated_at": "2025-01-15T10:00:00.000Z"
            }
          ]
        }
      ]
    }
  ]
}
```

### GET /api/:project/tree/epics/:id

Get tree structure for a specific epic only.

**Example:** `GET /api/my_project/tree/epics/60d5ec49f1b2c8b1f8e4e1a1`

---

## Status Values

### Epic Status
- `planning`: Epic is being planned
- `in_progress`: Work has started
- `done`: All features completed
- `blocked`: Work is blocked

### Feature/Task Status
- `todo`: Not started yet
- `in_progress`: Currently being worked on
- `done`: Completed
- `blocked`: Work is blocked

## Auto-Status Updates

The system automatically updates parent statuses:

1. When all tasks in a feature are `done`, the feature status becomes `done`
2. When all features in an epic are `done`, the epic status becomes `done`
3. If a parent is `done` but a child becomes not done, the parent reverts to `in_progress`

## Progress Calculation

Progress is calculated automatically:
- `total`: Number of children
- `completed`: Number of children with status `done`
- `percentage`: (completed / total) * 100

## Error Codes

- `400` - Bad Request (validation errors)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

## Example Workflow

```bash
# 1. Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My App"}'

# 2. Create an epic
curl -X POST http://localhost:3001/api/my_app/epics \
  -H "Content-Type: application/json" \
  -d '{"title": "User Authentication", "status": "planning"}'

# 3. Create a feature (use epic _id from step 2)
curl -X POST http://localhost:3001/api/my_app/features/by-epic/EPIC_ID \
  -H "Content-Type: application/json" \
  -d '{"title": "Login Form", "desc": "Create login UI"}'

# 4. Create tasks (use feature _id from step 3)
curl -X POST http://localhost:3001/api/my_app/tasks/by-feature/FEATURE_ID \
  -H "Content-Type: application/json" \
  -d '{"title": "Create login component", "status": "todo"}'

# 5. View full tree
curl http://localhost:3001/api/my_app/tree

# 6. Update task status
curl -X PUT http://localhost:3001/api/my_app/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

## Testing with Postman

Import this collection to test all endpoints:

1. Set base URL as environment variable: `{{baseUrl}} = http://localhost:3001`
2. Create variables: `{{project}}`, `{{epicId}}`, `{{featureId}}`, `{{taskId}}`
3. Use the endpoints listed above

## Rate Limiting

Currently, there is no rate limiting. For production, consider implementing rate limiting middleware.

## Authentication

Currently, the API is open. For production, implement authentication using JWT or OAuth.
