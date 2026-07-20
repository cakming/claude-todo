# Usage Examples

Real-world examples of using the Vibe Todo MCP Server with Claude.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Workflow](#basic-workflow)
3. [Team Sprint Planning](#team-sprint-planning)
4. [Bug Tracking](#bug-tracking)
5. [Feature Development](#feature-development)
6. [Daily Standup](#daily-standup)
7. [Project Review](#project-review)
8. [Advanced Scenarios](#advanced-scenarios)
9. [Docs, Comments, Trash & Sharing](#docs-comments-trash--sharing)

---

## Getting Started

### Your First Project

**Conversation:**

```
You: "List my projects"

Claude: [Uses list_projects tool]
You currently have no projects. Would you like to create one?

You: "Yes, create a project called my_first_app"

Claude: [Uses create_project tool]
✅ Project created successfully!
- Name: my_first_app
- Original name: my_first_app

The project is now ready for use. What would you like to add to it?

You: "Show me the stats"

Claude: [Uses get_project_stats tool]
Project Statistics for my_first_app:
- Epics: 0
- Features: 0
- Tasks: 0
- Total Items: 0

The project is empty and ready for you to add epics, features, and tasks.
```

---

## Basic Workflow

### Creating a Complete Hierarchy

**Scenario:** Setting up a new authentication system

```
You: "Create an epic called User Authentication in my_first_app with status planning"

Claude: [Uses create_epic tool]
✅ Epic created!

Epic: "User Authentication"
ID: 507f1f77bcf86cd799439011
Status: planning
Description: (empty)

Would you like to add features to this epic?

You: "Yes, add a feature called Login System with UAT: Users can log in with email and password, and it should reference src/auth/login.ts"

Claude: [Uses create_feature tool with epicId: 507f1f77bcf86cd799439011]
✅ Feature created!

Feature: "Login System"
ID: 507f191e810c19729de860ea
Parent Epic: User Authentication
UAT: Users can log in with email and password
Reference File: src/auth/login.ts
Status: todo

You: "Add these tasks to that feature:
     - Create login API endpoint
     - Add JWT token generation
     - Implement password hashing
     - Add rate limiting"

Claude: [Uses create_task tool 4 times with featureId: 507f191e810c19729de860ea]
✅ Created 4 tasks:

1. "Create login API endpoint" (507f1f77bcf86cd799439012)
2. "Add JWT token generation" (507f1f77bcf86cd799439013)
3. "Implement password hashing" (507f1f77bcf86cd799439014)
4. "Add rate limiting" (507f1f77bcf86cd799439015)

All tasks are set to "todo" status under the "Login System" feature.

You: "Show me the full tree"

Claude: [Uses get_project_tree tool]
📊 User Authentication (planning) - 0% complete
  └── ✨ Login System (todo) - 0% complete
      ├── ✅ Create login API endpoint (todo)
      ├── ✅ Add JWT token generation (todo)
      ├── ✅ Implement password hashing (todo)
      └── ✅ Add rate limiting (todo)

Progress: 0/4 tasks completed
```

---

### Completing Work (Auto-Status Updates)

**Scenario:** Marking tasks as done and watching the magic happen

```
You: "I finished the password hashing task. Mark it as done."

Claude: [Uses mark_task_done tool on task 507f1f77bcf86cd799439014]
✅ Task "Implement password hashing" marked as done!

Current Progress:
- Login System feature: 1/4 tasks complete (25%)
- User Authentication epic: 0/1 features complete (0%)

You: "Also done with JWT generation and the API endpoint"

Claude: [Uses mark_task_done tool twice]
✅ Marked as done:
- "Add JWT token generation"
- "Create login API endpoint"

Current Progress:
- Login System feature: 3/4 tasks complete (75%)
- User Authentication epic: 0/1 features complete (0%)

You: "And the rate limiting is done too"

Claude: [Uses mark_task_done tool]
✅ Task "Add rate limiting" marked as done!

🎉 AUTOMATIC UPDATES:
✅ All tasks in "Login System" are complete!
✅ Feature "Login System" automatically updated to "done"
✅ All features in "User Authentication" are complete!
✅ Epic "User Authentication" automatically updated to "done"

Final Status:
📊 User Authentication (done) - 100% complete
  └── ✨ Login System (done) - 100% complete
      ├── ✅ Create login API endpoint (done)
      ├── ✅ Add JWT token generation (done)
      ├── ✅ Implement password hashing (done)
      └── ✅ Add rate limiting (done)

Congratulations! The entire User Authentication epic is complete!
```

---

## Team Sprint Planning

### Planning a 2-Week Sprint

**Scenario:** Setting up work for an e-commerce sprint

```
You: "Create a project called ecommerce_site"

Claude: ✅ Project "ecommerce_site" created!

You: "Create an epic called Sprint 12: Shopping Cart with status in_progress"

Claude: ✅ Epic created (ID: 60d5ec49f1b2c8b1f8e4e1a1)

You: "Add these features under that epic:
     1. Cart UI Components - UAT: Users can see and manage cart items
     2. Cart Backend API - UAT: API handles cart operations (add, remove, update)
     3. Persistent Cart Storage - UAT: Cart persists across sessions"

Claude: [Creates 3 features]
✅ Created 3 features:
1. Cart UI Components (60d5ec49f1b2c8b1f8e4e1a2)
2. Cart Backend API (60d5ec49f1b2c8b1f8e4e1a3)
3. Persistent Cart Storage (60d5ec49f1b2c8b1f8e4e1a4)

You: "For Cart UI Components, add these tasks:
     - CartPage component with reference src/pages/CartPage.tsx
     - CartItem component
     - Quantity selector
     - Remove item button
     - Calculate totals display"

Claude: [Creates 5 tasks under Cart UI Components]
✅ Created 5 tasks for "Cart UI Components"

You: "For Cart Backend API:
     - POST /cart/add endpoint
     - DELETE /cart/remove endpoint
     - PUT /cart/update endpoint
     - GET /cart endpoint"

Claude: [Creates 4 tasks]
✅ Created 4 tasks for "Cart Backend API"

You: "For Persistent Cart Storage:
     - MongoDB schema design
     - Save cart on update
     - Load cart on login
     - Merge anonymous cart with user cart"

Claude: [Creates 4 tasks]
✅ Created 4 tasks for "Persistent Cart Storage"

You: "Show me the sprint tree"

Claude: [Uses get_epic_tree tool]
📊 Sprint 12: Shopping Cart (in_progress) - 0% complete

  ✨ Cart UI Components (todo) - 0/5 tasks
    ├── ✅ CartPage component (todo)
    ├── ✅ CartItem component (todo)
    ├── ✅ Quantity selector (todo)
    ├── ✅ Remove item button (todo)
    └── ✅ Calculate totals display (todo)

  ✨ Cart Backend API (todo) - 0/4 tasks
    ├── ✅ POST /cart/add endpoint (todo)
    ├── ✅ DELETE /cart/remove endpoint (todo)
    ├── ✅ PUT /cart/update endpoint (todo)
    └── ✅ GET /cart endpoint (todo)

  ✨ Persistent Cart Storage (todo) - 0/4 tasks
    ├── ✅ MongoDB schema design (todo)
    ├── ✅ Save cart on update (todo)
    ├── ✅ Load cart on login (todo)
    └── ✅ Merge anonymous cart with user cart (todo)

Total Sprint: 13 tasks across 3 features

You: "Start working on the CartPage component"

Claude: [Uses mark_task_in_progress tool]
✅ Task "CartPage component" marked as in_progress
✅ Feature "Cart UI Components" automatically updated to in_progress
✅ Epic "Sprint 12: Shopping Cart" remains in_progress
```

---

## Bug Tracking

### Managing Critical Bugs

**Scenario:** Tracking production bugs

```
You: "Create an epic called Critical Bugs - Week 3 with status blocked in ecommerce_site"

Claude: ✅ Epic created (ID: 60d5ec49f1b2c8b1f8e4e1a5)

You: "Add a feature called Payment Processing Bug with status blocked and description: Stripe webhook failing intermittently"

Claude: ✅ Feature created (60d5ec49f1b2c8b1f8e4e1a6)

You: "Add tasks:
     - Investigate webhook logs
     - Reproduce error locally
     - Add retry logic
     - Deploy fix to staging
     - Monitor for 24 hours"

Claude: [Creates 5 tasks]
✅ 5 tasks created

You: "The investigation is done, mark it as complete"

Claude: [Uses mark_task_done]
✅ Task "Investigate webhook logs" marked as done
Progress: 1/5 tasks complete (20%)

You: "We reproduced it locally too"

Claude: ✅ Task "Reproduce error locally" marked as done
Progress: 2/5 tasks complete (40%)

You: "We're blocked on the retry logic - need to wait for Stripe support"

Claude: [Uses mark_task_blocked]
✅ Task "Add retry logic" marked as blocked

⚠️ Note: This task is blocking progress on the Payment Processing Bug feature.

You: "What's blocked in the project?"

Claude: [Uses get_blocked_items tool]
🚫 Blocked Items in ecommerce_site:

Epic:
- Critical Bugs - Week 3 (blocked)

Feature:
- Payment Processing Bug (blocked)

Task:
- Add retry logic (blocked)
  Reason: Waiting for Stripe support response
```

---

## Feature Development

### Building a Complex Feature

**Scenario:** Implementing OAuth authentication

```
You: "In my_first_app, add a feature called OAuth Integration under the User Authentication epic"

Claude: [Uses create_feature]
✅ Feature created!

You: "Break this down into tasks with these requirements:
     - Google OAuth provider setup
     - GitHub OAuth provider setup
     - OAuth callback handler with reference src/auth/oauth/callback.ts
     - Link existing accounts to OAuth
     - OAuth token storage in database
     - Add OAuth buttons to login page"

Claude: [Creates 6 tasks]
✅ Created 6 tasks for OAuth Integration

You: "I'm starting with Google OAuth setup"

Claude: [Uses mark_task_in_progress]
✅ Working on "Google OAuth provider setup"

You: "Google is done, now working on GitHub"

Claude: [Uses mark_task_done on Google, mark_task_in_progress on GitHub]
✅ Google OAuth provider setup completed
✅ Now working on GitHub OAuth provider setup
Progress: 1/6 tasks (17%)

You: "GitHub done, callback handler in progress"

Claude: [Updates statuses]
✅ Updated progress: 2/6 tasks (33%)
✅ Currently working on: OAuth callback handler

You: "Actually, I found an issue with the callback handler. Mark it as blocked"

Claude: [Uses mark_task_blocked]
✅ Task "OAuth callback handler" marked as blocked

Current status:
- Google OAuth provider setup (done)
- GitHub OAuth provider setup (done)
- OAuth callback handler (blocked) ⚠️
- Link existing accounts to OAuth (todo)
- OAuth token storage in database (todo)
- Add OAuth buttons to login page (todo)

You: "Unblock it - I fixed the issue. Mark it in progress again"

Claude: [Uses mark_task_in_progress]
✅ Task "OAuth callback handler" unblocked and marked as in_progress
```

---

## Daily Standup

### Quick Status Check

**Scenario:** Morning standup review

```
You: "Good morning! What was I working on yesterday in ecommerce_site?"

Claude: [Uses get_in_progress_items]
📋 In Progress Items:

Tasks:
1. "CartPage component" - Cart UI Components feature
   Started: Yesterday at 2:30 PM

2. "POST /cart/add endpoint" - Cart Backend API feature
   Started: Yesterday at 4:15 PM

You: "What's recently changed?"

Claude: [Uses get_recently_updated with limit: 10]
📅 Recently Updated (Last 10 items):

1. "POST /cart/add endpoint" - marked in_progress (2 hours ago)
2. "CartPage component" - marked in_progress (yesterday 2:30 PM)
3. "Cart UI Components" - status updated to in_progress (yesterday 2:30 PM)
4. "Quantity selector" - created (yesterday 10:00 AM)
5. "Remove item button" - created (yesterday 10:00 AM)
...

You: "Any blockers?"

Claude: [Uses get_blocked_items]
🚫 Blocked Items: None

All clear! No blocked items in ecommerce_site.

You: "I finished the CartPage component"

Claude: [Uses mark_task_done]
✅ Task completed!

Cart UI Components progress: 1/5 tasks done (20%)

You: "Show me what's left to do today"

Claude: [Uses list_tasks with feature filter]
📝 Remaining Tasks in Cart UI Components:
- CartItem component (todo)
- Quantity selector (todo)
- Remove item button (todo)
- Calculate totals display (todo)

4 tasks remaining
```

---

## Project Review

### End of Sprint Review

**Scenario:** Reviewing sprint completion

```
You: "Show me the full tree of ecommerce_site Sprint 12 epic"

Claude: [Uses get_epic_tree]
📊 Sprint 12: Shopping Cart - 85% complete

  ✨ Cart UI Components (done) - 5/5 tasks ✅
    ├── ✅ CartPage component (done)
    ├── ✅ CartItem component (done)
    ├── ✅ Quantity selector (done)
    ├── ✅ Remove item button (done)
    └── ✅ Calculate totals display (done)

  ✨ Cart Backend API (done) - 4/4 tasks ✅
    ├── ✅ POST /cart/add endpoint (done)
    ├── ✅ DELETE /cart/remove endpoint (done)
    ├── ✅ PUT /cart/update endpoint (done)
    └── ✅ GET /cart endpoint (done)

  ✨ Persistent Cart Storage (in_progress) - 2/4 tasks
    ├── ✅ MongoDB schema design (done)
    ├── ✅ Save cart on update (done)
    ├── 🔄 Load cart on login (in_progress)
    └── ⏸️ Merge anonymous cart with user cart (todo)

Sprint Progress: 11/13 tasks complete (85%)
2 tasks remaining

You: "What's the status breakdown?"

Claude: [Uses search_items with different status filters]
Status Summary:
- Done: 11 tasks ✅
- In Progress: 1 task 🔄
- Todo: 1 task ⏸️
- Blocked: 0 tasks

Outstanding work:
1. Load cart on login (in_progress)
2. Merge anonymous cart with user cart (todo)

You: "Search for anything related to merge"

Claude: [Uses search_items with query: "merge"]
🔍 Search Results for "merge":

1. Task: "Merge anonymous cart with user cart"
   Feature: Persistent Cart Storage
   Epic: Sprint 12: Shopping Cart
   Status: todo
   Description: Handle edge case when user logs in with items in anonymous cart

You: "Mark the in-progress task as done"

Claude: [Uses mark_task_done on "Load cart on login"]
✅ Task completed!

🎉 Feature "Persistent Cart Storage" progress: 3/4 tasks (75%)

Only 1 task remaining in Sprint 12!
```

---

## Advanced Scenarios

### Bulk Status Updates

**Scenario:** Marking multiple items at once

```
You: "I finished all the UI tasks. Mark CartItem component, Quantity selector, and Remove item button as done"

Claude: [Uses mark_task_done 3 times in sequence]
✅ Completed 3 tasks:
1. CartItem component
2. Quantity selector
3. Remove item button

Cart UI Components progress: 4/5 tasks (80%)
Only "Calculate totals display" remains!
```

---

### Cross-Project Search

**Scenario:** Finding related work across projects

```
You: "Search all my projects for anything related to authentication"

You: First, list all my projects

Claude: [Uses list_projects]
Projects:
- my_first_app
- ecommerce_site
- blog_platform

You: "Search for authentication in my_first_app"

Claude: [Uses search_items with query: "authentication"]
Found in my_first_app:
- Epic: User Authentication
- Feature: Login System
- Feature: OAuth Integration
- 10 related tasks

You: "Now search ecommerce_site"

Claude: [Uses search_items]
Found in ecommerce_site:
- Feature: User Authentication for Checkout
- 3 related tasks
```

---

### Reorganizing Work

**Scenario:** Moving tasks between features (requires deletion and recreation)

```
You: "I need to move the 'Add rate limiting' task from Login System to OAuth Integration. Get the task details first."

Claude: [Uses get_task]
Task Details:
- Title: Add rate limiting
- Description: Prevent brute force attacks
- Status: todo
- UAT: Rate limiting blocks suspicious activity

You: "Delete this task from Login System"

Claude: [Uses delete_task]
✅ Task deleted

You: "Create the same task under OAuth Integration"

Claude: [Uses create_task]
✅ Task recreated under OAuth Integration feature!
- Title: Add rate limiting
- Description: Prevent brute force attacks
- Status: todo
```

---

## Docs, Comments, Trash & Sharing

### Writing a Doc Page

**Scenario:** Capturing an architecture note alongside the work

```
You: "Create a doc page called Architecture Overview in my_first_app with a body describing the auth flow"

Claude: [Uses create_page tool]
✅ Doc page created!

Page: "Architecture Overview"
ID: 652f1f77bcf86cd799439021

You: "List the doc pages for my_first_app"

Claude: [Uses list_pages tool]
📄 Doc Pages (newest updated first):
1. Architecture Overview (updated just now)

You: "Search my pages for auth"

Claude: [Uses list_pages with search: "auth"]
🔍 Found 1 page: "Architecture Overview"

You: "Update that page - append the token refresh section"

Claude: [Uses update_page tool]
✅ Page "Architecture Overview" updated
```

---

### Commenting with a Mention

**Scenario:** Leaving a review note on a task

```
You: "Comment on task 507f1f77bcf86cd799439012: token expiry looks off, can @alice take a look?"

Claude: [Uses add_comment tool]
✅ Comment added to the task
- Author: mcp
- Mentions: ["alice"]

Note: @mentions are recorded on the comment, but notifications
(email/Telegram) are sent from the web app, not the MCP tool.

You: "Show me the comments on that task"

Claude: [Uses list_comments with targetType: "task", targetId: 507f1f77bcf86cd799439012]
💬 Comments (oldest first):
1. mcp: "token expiry looks off, can @alice take a look?" (just now)

You: "Delete that comment"

Claude: [Uses delete_comment tool]
✅ Comment deleted successfully
```

---

### Trash: Delete, Review & Restore

**Scenario:** Removing a stale page, then getting it back

```
You: "Delete the old Meeting Notes page in my_first_app"

Claude: [Uses delete_page tool]
✅ Page moved to trash (soft-delete)
Batch: b_652f2a1177bcf86cd799439099

It won't show up in your normal listings, but it's recoverable.

You: "What's in the trash?"

Claude: [Uses list_trash tool]
🗑️ Trash (retention: 30 days):
Batch b_652f2a1177bcf86cd799439099 (deleted just now)
  - Page: "Meeting Notes"

You: "Actually, restore that batch"

Claude: [Uses restore_trash tool]
✅ Batch restored, parent statuses recomputed
"Meeting Notes" is back in your pages.

You: "On second thought, delete it and empty the trash for good"

Claude: [Uses delete_page, then purge_trash with batch: "all"]
✅ Trash emptied permanently (not reversible)
```

---

### Sharing a Read-Only Link

**Scenario:** Sharing project progress and a single spec page

```
You: "Create a public share link for my_first_app"

Claude: [Uses create_share tool]
✅ Share link created!
- Scope: project
- Path: /s/s_9f3c2a77bcf86cd799439040
- Expires: never

You: "Share just the Architecture Overview page, and expire it in 7 days"

Claude: [Uses create_share with scope: "page", pageId: 652f1f77bcf86cd799439021, expiresInDays: 7]
✅ Page share created!
- Scope: page
- Path: /s/s_71b0aa77bcf86cd799439041
- Expires: in 7 days

You: "List all my share links"

Claude: [Uses list_shares tool]
🔗 Share links for my_first_app:
1. /s/s_9f3c2a77bcf86cd799439040 (project, no expiry)
2. /s/s_71b0aa77bcf86cd799439041 (page, expires in 7 days)

You: "Revoke the project-wide one"

Claude: [Uses revoke_share tool]
✅ Share revoked successfully
```

---

## Tips for Best Results

### 1. Use Natural Language

Claude understands context:
- ✅ "Add a feature for login"
- ✅ "Mark that task as done" (referring to previous)
- ✅ "Show me what's blocked"

### 2. Reference by Name or ID

- "Mark task 507f1f77bcf86cd799439012 as done" ← Using ID
- "Complete the JWT validation task" ← Using name

### 3. Batch Operations

Instead of one at a time:
```
"Create these tasks:
- Task 1
- Task 2
- Task 3"
```

### 4. Use Tree View for Overview

Start conversations with:
```
"Show me the project tree"
```

Gets you oriented quickly!

### 5. Leverage Auto-Status

Just mark tasks done - parents update automatically!

---

**Ready to vibe code!** 🎯✨
