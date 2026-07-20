# Key Features

Deep dive into the standout features of the Vibe Todo MCP Server.

## Table of Contents

1. [Auto-Status Updates](#auto-status-updates)
2. [Hierarchical Organization](#hierarchical-organization)
3. [Progress Tracking](#progress-tracking)
4. [Natural Language Integration](#natural-language-integration)
5. [Cascade Operations](#cascade-operations)
6. [Smart Search](#smart-search)
7. [Documentation Pages](#documentation-pages)
8. [Comments & Mentions](#comments--mentions)
9. [Trash Bin (Soft-Delete)](#trash-bin-soft-delete)
10. [Public Share Links](#public-share-links)

---

## Auto-Status Updates

### The Killer Feature

The most powerful feature is **automatic parent status updates**. When you mark child items as done, parent items automatically update their status.

### How It Works

```
Task status changes
    ↓
System checks all sibling tasks
    ↓
All tasks "done"? → Feature becomes "done"
    ↓
System checks all sibling features
    ↓
All features "done"? → Epic becomes "done"
```

### Example Flow

**Initial State:**
```
📊 User Authentication (planning)
  └── ✨ Login System (todo)
      ├── ✅ Create API endpoint (todo)
      ├── ✅ Add JWT validation (todo)
      └── ✅ Implement hashing (todo)
```

**Mark first task done:**
```
You: "Mark Create API endpoint as done"

📊 User Authentication (planning) ← No change
  └── ✨ Login System (todo) ← No change
      ├── ✅ Create API endpoint (done) ← Changed
      ├── ✅ Add JWT validation (todo)
      └── ✅ Implement hashing (todo)
```

**Mark second task done:**
```
You: "Mark Add JWT validation as done"

📊 User Authentication (planning) ← No change
  └── ✨ Login System (todo) ← No change
      ├── ✅ Create API endpoint (done)
      ├── ✅ Add JWT validation (done) ← Changed
      └── ✅ Implement hashing (todo)
```

**Mark third task done:**
```
You: "Mark Implement hashing as done"

📊 User Authentication (in_progress) ← AUTO-UPDATED! 🎉
  └── ✨ Login System (done) ← AUTO-UPDATED! 🎉
      ├── ✅ Create API endpoint (done)
      ├── ✅ Add JWT validation (done)
      ├── ✅ Implement hashing (done) ← Changed
```

**What Happened:**
1. Last task marked `done`
2. System checks: Are all tasks in "Login System" done? YES
3. Feature "Login System" → `done`
4. System checks: Are all features in "User Authentication" done? YES
5. Epic "User Authentication" → `in_progress` (or `done` if it was the last feature)

### Reverse Updates

If a parent is `done` but you mark a child as not done, the parent reverts:

```
📊 User Authentication (done)
  └── ✨ Login System (done)
      ├── ✅ Create API endpoint (done)
      ├── ✅ Add JWT validation (done)
      └── ✅ Implement hashing (done)

You: "Actually, the JWT validation needs more work. Mark it as in_progress"

📊 User Authentication (in_progress) ← Reverted!
  └── ✨ Login System (in_progress) ← Reverted!
      ├── ✅ Create API endpoint (done)
      ├── ✅ Add JWT validation (in_progress) ← Changed
      └── ✅ Implement hashing (done)
```

### Benefits

1. **No Manual Updates**: Never manually update epic/feature status
2. **Always Accurate**: Status reflects true completion state
3. **Reduces Cognitive Load**: Focus on tasks, not hierarchy management
4. **Natural Workflow**: Mark work done, status propagates automatically

### When It Triggers

Auto-status updates trigger on:
- `update_task` (when status changes)
- `mark_task_done`
- `mark_task_in_progress`
- `mark_task_blocked`
- `delete_task`
- `update_feature` (when status changes)
- `delete_feature`

### What Gets Updated

| Action | Updates |
|--------|---------|
| Update task status | Parent feature, grandparent epic |
| Update feature status | Parent epic |
| Delete task | Parent feature, grandparent epic |
| Delete feature | Parent epic |

---

## Hierarchical Organization

### Three-Level Structure

```
Epic (Large body of work)
  ├── Feature (User-facing functionality)
  │     ├── Task (Individual work item)
  │     ├── Task
  │     └── Task
  ├── Feature
  │     └── Task
  └── Feature
```

### Real-World Example

```
📊 E-Commerce Platform v2
  ├── ✨ Shopping Cart
  │     ├── ✅ Cart UI component
  │     ├── ✅ Add to cart API
  │     ├── ✅ Update quantity
  │     └── ✅ Remove item
  ├── ✨ Payment Processing
  │     ├── ✅ Stripe integration
  │     ├── ✅ Payment form UI
  │     └── ✅ Order confirmation
  └── ✨ Product Catalog
        ├── ✅ Product listing page
        ├── ✅ Search functionality
        └── ✅ Filter by category
```

### Why This Structure?

**Epic** = *"What big thing are we building?"*
- Examples: "User Authentication", "Shopping Cart", "Admin Dashboard"
- Duration: Weeks to months
- Multiple features

**Feature** = *"What user-facing functionality?"*
- Examples: "Login Form", "Password Reset", "OAuth Integration"
- Duration: Days to weeks
- Multiple tasks

**Task** = *"What specific work?"*
- Examples: "Create API endpoint", "Add validation", "Write tests"
- Duration: Hours to days
- Atomic work unit

### Benefits

1. **Natural Mental Model**: Matches how developers think
2. **Clear Scope**: Each level has defined boundaries
3. **Easy Navigation**: Tree structure is intuitive
4. **Progress Visibility**: See completion at every level

---

## Progress Tracking

### Automatic Calculation

Progress is calculated automatically at every level:

```json
{
  "progress": {
    "total": 5,        // Total children
    "completed": 3,    // Children with status "done"
    "percentage": 60   // (3/5) * 100
  }
}
```

### Visual Representation

```
📊 User Authentication - 67% complete
  Progress: 2/3 features done

  ✨ Login Form - 100% complete ✅
    Progress: 4/4 tasks done

  ✨ Password Reset - 50% complete
    Progress: 2/4 tasks done

  ✨ OAuth Integration - 50% complete
    Progress: 3/6 tasks done
```

### Where Progress Appears

1. **Epic Progress**: Shows feature completion
   ```json
   {
     "title": "User Authentication",
     "progress": {
       "total": 3,      // 3 features
       "completed": 1,  // 1 feature done
       "percentage": 33
     }
   }
   ```

2. **Feature Progress**: Shows task completion
   ```json
   {
     "title": "Login Form",
     "progress": {
       "total": 4,      // 4 tasks
       "completed": 4,  // All done!
       "percentage": 100
     }
   }
   ```

3. **Task Progress**: N/A (tasks don't have children)

### How to Access

Progress data is included in:
- `get_project_tree` - Full tree with all progress
- `get_epic_tree` - Epic tree with progress

**Example:**
```
You: "Show me the project tree"

Claude: [Uses get_project_tree]
Returns complete hierarchy with progress at each level
```

---

## Natural Language Integration

### Conversational Interface

Claude understands natural language, so you can be conversational:

```
You: "Add a feature for user login"
Claude: Creates feature "User Login"

You: "Actually, call it Login System"
Claude: Updates feature title

You: "Add three tasks: API endpoint, validation, and tests"
Claude: Creates 3 tasks

You: "The first one is done"
Claude: Marks "API endpoint" as done

You: "Show me what's left"
Claude: Lists remaining tasks
```

### Context Awareness

Claude remembers context within a conversation:

```
You: "Create an epic called Authentication in my_app"
Claude: Creates epic, remembers ID: 507f1f77bcf86cd799439011

You: "Add a feature for login under that epic"
Claude: Uses the epic ID from above context ✅

You: "Add JWT validation task to that feature"
Claude: Uses the feature ID from above context ✅

You: "Mark it as done"
Claude: Knows "it" refers to the JWT validation task ✅
```

### Flexible Commands

Many ways to say the same thing:

**Creating items:**
- "Create an epic called X"
- "Add an epic named X"
- "Make a new epic X"
- "I need an epic for X"

**Updating status:**
- "Mark task X as done"
- "Complete task X"
- "Task X is finished"
- "I finished task X"

**Viewing data:**
- "Show me the tree"
- "Display the hierarchy"
- "What's the project structure?"
- "Let me see the full tree"

### Batch Operations

Create multiple items at once:

```
You: "Create these tasks:
     - Task A
     - Task B
     - Task C"

Claude: Creates all 3 tasks in sequence
```

---

## Cascade Operations

### Cascade Delete

When you delete a parent, all children are deleted automatically.

**Delete Epic:**
```
📊 Epic A
  ├── ✨ Feature 1
  │     ├── ✅ Task A
  │     └── ✅ Task B
  └── ✨ Feature 2
        ├── ✅ Task C
        └── ✅ Task D

Action: Delete Epic A

Result: Epic A + 2 features + 4 tasks = 7 items deleted
```

**Delete Feature:**
```
✨ Feature 1
  ├── ✅ Task A
  ├── ✅ Task B
  └── ✅ Task C

Action: Delete Feature 1

Result: Feature 1 + 3 tasks = 4 items deleted
```

### Safety

- Cascade deletes are **permanent**
- No confirmation dialog (handle with care!)
- Good for: Removing obsolete work, cleaning up experiments
- Use carefully in production data

### Example

```
You: "Delete the OAuth Integration feature"

Claude: [Uses delete_feature]
⚠️ This will delete:
- Feature: OAuth Integration
- 6 associated tasks

Proceed?

You: "Yes"

Claude: ✅ Deleted OAuth Integration and 6 tasks
```

---

## Smart Search

### Full-Text Search

Search across all fields:
- Title
- Description
- UAT (User Acceptance Testing)
- Reference files

**Example:**
```
You: "Search for anything with authentication"

Claude: [Uses search_items with query: "authentication"]
Found 8 items:
- Epic: User Authentication
- Feature: OAuth Authentication
- Feature: Two-Factor Authentication
- Task: Implement JWT authentication
- Task: Add authentication middleware
- Task: Write authentication tests
- ...
```

### Filtered Search

Combine text search with filters:

**By Type:**
```
You: "Find all tasks related to API"

Claude: [Uses search_items with query: "API", type: "task"]
Found 15 tasks with "API" in title/description
```

**By Status:**
```
You: "Show me done items with JWT"

Claude: [Uses search_items with query: "JWT", status: "done"]
Found 3 completed items related to JWT
```

### Specialized Searches

**Blocked Items:**
```
You: "What's blocked?"

Claude: [Uses get_blocked_items]
🚫 3 blocked items found
```

**In Progress:**
```
You: "What am I working on?"

Claude: [Uses get_in_progress_items]
🔄 Currently in progress: 2 items
```

**Recent Activity:**
```
You: "What changed today?"

Claude: [Uses get_recently_updated]
📅 10 most recent updates
```

### Use Cases

1. **Daily Standup**: "What's in progress?"
2. **Blocker Review**: "Show me blocked items"
3. **Code Reference**: "Find items referencing auth.ts"
4. **Status Check**: "What's done in the login feature?"
5. **Sprint Planning**: "Show me all todo items"

---

## Documentation Pages

### Free-Form Docs Alongside Your Work

Beyond the epic/feature/task hierarchy, each project can hold **doc pages** — free-form notes, specs, and design docs. Bodies accept markdown/HTML text.

**Tools:** `list_pages`, `get_page`, `create_page`, `update_page`, `delete_page`

```
You: "Create a doc page called Architecture Overview in my_app"
Claude: [Uses create_page] ✅ Page created

You: "List the docs for my_app"
Claude: [Uses list_pages] Returns pages, newest updated first

You: "Search my pages for onboarding"
Claude: [Uses list_pages with search: "onboarding"]
```

### Key Points

1. **Newest first**: `list_pages` returns pages sorted by most recently updated.
2. **Text search**: The optional `search` argument matches over title and body.
3. **Safe delete**: `delete_page` is a *soft-delete* — the page goes to the trash and can be restored (see [Trash Bin](#trash-bin-soft-delete)).

---

## Comments & Mentions

### Discussion on Any Item

Attach threaded comments to any epic, feature, or task. `@mentions` in the comment body are automatically parsed into a `mentions[]` array.

**Tools:** `list_comments`, `add_comment`, `delete_comment`

```
You: "Comment on the Login Form feature: needs a retry, cc @bob"
Claude: [Uses add_comment] ✅ Comment added (mentions: ["bob"])

You: "Show me the discussion on that feature"
Claude: [Uses list_comments] Returns comments oldest-first
```

### Key Points

1. **Target anything**: `targetType` is `epic`, `feature`, or `task`; `targetId` is its ObjectId.
2. **Mentions parsed, not notified**: `@mentions` are recorded on the comment, but the MCP tool does **not** send email/Telegram notifications — those fire from the web app request path.
3. **Oldest first**: `list_comments` returns the thread in chronological order.

---

## Trash Bin (Soft-Delete)

### Deletes You Can Undo

Soft-deleted items (currently doc pages via `delete_page`) are moved to a **trash bin** instead of being removed immediately. Deletions are grouped into **batches** so a single action can be restored or purged as a unit.

**Tools:** `list_trash`, `restore_trash`, `purge_trash`

```
You: "Delete the old Meeting Notes page"
Claude: [Uses delete_page] ✅ Moved to trash (batch b_…099)

You: "What's in the trash?"
Claude: [Uses list_trash] Returns retentionDays + batches[]

You: "Restore that batch"
Claude: [Uses restore_trash] ✅ Restored, parent statuses recomputed
```

### Key Points

1. **Grouped by batch**: `list_trash` returns `{ retentionDays, batches[] }`.
2. **Auto-purge**: Listing the trash lazily purges items older than `TRASH_RETENTION_DAYS` (default 30).
3. **Restore recomputes status**: `restore_trash` restores a whole batch and recomputes affected parent statuses.
4. **Permanent purge**: `purge_trash` deletes a batch permanently, or use `batch: "all"` to empty the whole trash (not reversible).
5. **Clean listings**: The normal read tools (`list_*`, `get_*`, `search_items`, tree, stats) exclude trashed items, so nothing in the trash clutters your views until it is restored.

---

## Public Share Links

### Read-Only Links to Share Your Work

Generate public, read-only links to a whole project tree or a single doc page. Links are served at `/s/<token>` and can optionally expire.

**Tools:** `list_shares`, `create_share`, `revoke_share`

```
You: "Create a share link for my_app"
Claude: [Uses create_share] ✅ /s/s_…040 (scope: project)

You: "Share the Architecture Overview page for 7 days"
Claude: [Uses create_share with scope: "page", pageId, expiresInDays: 7]

You: "Revoke that link"
Claude: [Uses revoke_share] ✅ Share revoked
```

### Key Points

1. **Scope**: `create_share` defaults to `scope: "project"`; use `scope: "page"` (with `pageId`) to share a single doc page.
2. **Optional expiry**: Pass `expiresInDays` for a link that auto-expires; omit it for no expiry.
3. **Returns a path**: The response includes `token`, `scope`, `path` (`/s/<token>`), and `expires_at`.
4. **Read-only**: Shared links expose a read-only view; revoke any time with `revoke_share`.

---

## Summary

### Key Differentiators

| Feature | Benefit | Impact |
|---------|---------|--------|
| Auto-Status Updates | No manual status management | High |
| Hierarchical Organization | Natural mental model | High |
| Progress Tracking | Visibility at all levels | Medium |
| Natural Language | Conversational interface | High |
| Cascade Operations | Clean deletion | Medium |
| Smart Search | Find anything instantly | High |
| Documentation Pages | Notes & specs beside the work | Medium |
| Comments & Mentions | Discussion with @mentions | Medium |
| Trash Bin (Soft-Delete) | Undo deletes, auto-purge | Medium |
| Public Share Links | Read-only sharing at `/s/<token>` | Medium |

### What Makes This Special

1. **Zero Manual Status Management**
   - Most todo systems require manual updates
   - This one does it automatically
   - Saves hours of admin work

2. **AI-Native Design**
   - Built specifically for Claude interaction
   - Natural language first
   - Context-aware operations

3. **Developer-Focused**
   - Hierarchy matches real work
   - Reference files for code traceability
   - UAT for acceptance criteria

4. **Progress Transparency**
   - See completion at every level
   - Automatic calculation
   - No manual tracking needed

---

**These features combine to create the ultimate AI-powered todo system for vibe coding!** 🎯✨
