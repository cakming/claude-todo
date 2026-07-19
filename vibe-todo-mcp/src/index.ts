#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { connectDB, closeDB } from './mongodb.js';
import * as projectTools from './tools/projectTools.js';
import * as epicTools from './tools/epicTools.js';
import * as featureTools from './tools/featureTools.js';
import * as taskTools from './tools/taskTools.js';
import * as treeTools from './tools/treeTools.js';
import * as searchTools from './tools/searchTools.js';
import * as pagesTools from './tools/pagesTools.js';
import * as commentsTools from './tools/commentsTools.js';
import * as trashTools from './tools/trashTools.js';
import * as sharesTools from './tools/sharesTools.js';

const server = new Server(
  {
    name: 'vibe-todo-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Project tools
      {
        name: 'list_projects',
        description: 'List all projects in the database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_project',
        description: 'Create a new project',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name (will be sanitized to lowercase with underscores)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'delete_project',
        description: 'Delete a project and all its data (WARNING: This is permanent!)',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Project name to delete',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'get_project_stats',
        description: 'Get statistics for a project (counts of epics, features, tasks)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
          },
          required: ['project'],
        },
      },

      // Epic tools
      {
        name: 'list_epics',
        description: 'List all epics in a project',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_epic',
        description: 'Get details of a specific epic',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            epicId: {
              type: 'string',
              description: 'Epic ID (MongoDB ObjectId)',
            },
          },
          required: ['project', 'epicId'],
        },
      },
      {
        name: 'create_epic',
        description: 'Create a new epic in a project',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            title: {
              type: 'string',
              description: 'Epic title',
            },
            desc: {
              type: 'string',
              description: 'Epic description (optional)',
            },
            status: {
              type: 'string',
              enum: ['planning', 'in_progress', 'done', 'blocked'],
              description: 'Epic status (default: planning)',
            },
          },
          required: ['project', 'title'],
        },
      },
      {
        name: 'update_epic',
        description: 'Update an epic',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            epicId: {
              type: 'string',
              description: 'Epic ID',
            },
            title: {
              type: 'string',
              description: 'New title (optional)',
            },
            desc: {
              type: 'string',
              description: 'New description (optional)',
            },
            status: {
              type: 'string',
              enum: ['planning', 'in_progress', 'done', 'blocked'],
              description: 'New status (optional)',
            },
          },
          required: ['project', 'epicId'],
        },
      },
      {
        name: 'delete_epic',
        description: 'Delete an epic and all its features and tasks (cascade delete)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            epicId: {
              type: 'string',
              description: 'Epic ID',
            },
          },
          required: ['project', 'epicId'],
        },
      },

      // Feature tools
      {
        name: 'list_features',
        description: 'List features in a project (optionally filter by epic)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            epicId: {
              type: 'string',
              description: 'Filter by epic ID (optional)',
            },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_feature',
        description: 'Get details of a specific feature',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            featureId: {
              type: 'string',
              description: 'Feature ID',
            },
          },
          required: ['project', 'featureId'],
        },
      },
      {
        name: 'create_feature',
        description: 'Create a new feature under an epic',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            epicId: {
              type: 'string',
              description: 'Parent epic ID',
            },
            title: {
              type: 'string',
              description: 'Feature title',
            },
            desc: {
              type: 'string',
              description: 'Feature description (optional)',
            },
            uat: {
              type: 'string',
              description: 'User acceptance testing criteria (optional)',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done', 'blocked'],
              description: 'Feature status (default: todo)',
            },
            referenceFile: {
              type: 'string',
              description: 'Reference file path (optional)',
            },
          },
          required: ['project', 'epicId', 'title'],
        },
      },
      {
        name: 'update_feature',
        description: 'Update a feature (auto-updates parent epic status if all features are done)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            featureId: {
              type: 'string',
              description: 'Feature ID',
            },
            title: {
              type: 'string',
              description: 'New title (optional)',
            },
            desc: {
              type: 'string',
              description: 'New description (optional)',
            },
            uat: {
              type: 'string',
              description: 'New UAT (optional)',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done', 'blocked'],
              description: 'New status (optional)',
            },
            reference_file: {
              type: 'string',
              description: 'New reference file (optional)',
            },
          },
          required: ['project', 'featureId'],
        },
      },
      {
        name: 'delete_feature',
        description: 'Delete a feature and all its tasks (auto-updates parent epic)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            featureId: {
              type: 'string',
              description: 'Feature ID',
            },
          },
          required: ['project', 'featureId'],
        },
      },

      // Task tools
      {
        name: 'list_tasks',
        description: 'List tasks in a project (optionally filter by feature)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            featureId: {
              type: 'string',
              description: 'Filter by feature ID (optional)',
            },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_task',
        description: 'Get details of a specific task',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
          },
          required: ['project', 'taskId'],
        },
      },
      {
        name: 'create_task',
        description: 'Create a new task under a feature',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            featureId: {
              type: 'string',
              description: 'Parent feature ID',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            desc: {
              type: 'string',
              description: 'Task description (optional)',
            },
            uat: {
              type: 'string',
              description: 'Definition of done (optional)',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done', 'blocked'],
              description: 'Task status (default: todo)',
            },
            referenceFile: {
              type: 'string',
              description: 'Reference file path (optional)',
            },
          },
          required: ['project', 'featureId', 'title'],
        },
      },
      {
        name: 'update_task',
        description: 'Update a task (auto-updates parent feature and epic status)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
            title: {
              type: 'string',
              description: 'New title (optional)',
            },
            desc: {
              type: 'string',
              description: 'New description (optional)',
            },
            uat: {
              type: 'string',
              description: 'New UAT (optional)',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in_progress', 'done', 'blocked'],
              description: 'New status (optional)',
            },
            reference_file: {
              type: 'string',
              description: 'New reference file (optional)',
            },
          },
          required: ['project', 'taskId'],
        },
      },
      {
        name: 'delete_task',
        description: 'Delete a task (auto-updates parent feature and epic)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
          },
          required: ['project', 'taskId'],
        },
      },
      {
        name: 'mark_task_done',
        description: 'Quick helper to mark a task as done',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
          },
          required: ['project', 'taskId'],
        },
      },
      {
        name: 'mark_task_in_progress',
        description: 'Quick helper to mark a task as in progress',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
          },
          required: ['project', 'taskId'],
        },
      },
      {
        name: 'mark_task_blocked',
        description: 'Quick helper to mark a task as blocked',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            taskId: {
              type: 'string',
              description: 'Task ID',
            },
          },
          required: ['project', 'taskId'],
        },
      },

      // Tree tools
      {
        name: 'get_project_tree',
        description: 'Get full hierarchical tree of a project with all epics, features, and tasks',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_epic_tree',
        description: 'Get hierarchical tree of a specific epic with its features and tasks',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            epicId: {
              type: 'string',
              description: 'Epic ID',
            },
          },
          required: ['project', 'epicId'],
        },
      },

      // Search tools
      {
        name: 'search_items',
        description: 'Search for items by text query across title, description, UAT, and reference files',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            query: {
              type: 'string',
              description: 'Search query (optional)',
            },
            type: {
              type: 'string',
              enum: ['epic', 'feature', 'task'],
              description: 'Filter by type (optional)',
            },
            status: {
              type: 'string',
              enum: ['planning', 'todo', 'in_progress', 'done', 'blocked'],
              description: 'Filter by status (optional)',
            },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_blocked_items',
        description: 'Get all blocked items in a project',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_in_progress_items',
        description: 'Get all in-progress items in a project',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_recently_updated',
        description: 'Get recently updated items (sorted by update time)',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Project name',
            },
            limit: {
              type: 'number',
              description: 'Number of items to return (default: 10)',
            },
          },
          required: ['project'],
        },
      },

      // Docs / page tools
      {
        name: 'list_pages',
        description: 'List a project\'s doc pages (newest updated first). Optional text search over title/body.',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            search: { type: 'string', description: 'Optional text search over title and body' },
          },
          required: ['project'],
        },
      },
      {
        name: 'get_page',
        description: 'Get a single doc page by id',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            pageId: { type: 'string', description: 'Page ID (MongoDB ObjectId)' },
          },
          required: ['project', 'pageId'],
        },
      },
      {
        name: 'create_page',
        description: 'Create a doc page (free-form note). Body accepts markdown/HTML text.',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            title: { type: 'string', description: 'Page title' },
            body: { type: 'string', description: 'Page body (optional)' },
          },
          required: ['project', 'title'],
        },
      },
      {
        name: 'update_page',
        description: 'Update a doc page\'s title and/or body',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            pageId: { type: 'string', description: 'Page ID' },
            title: { type: 'string', description: 'New title (optional)' },
            body: { type: 'string', description: 'New body (optional)' },
          },
          required: ['project', 'pageId'],
        },
      },
      {
        name: 'delete_page',
        description: 'Soft-delete a doc page (moves it to the trash; restorable via restore_trash). Returns the batch id.',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            pageId: { type: 'string', description: 'Page ID' },
          },
          required: ['project', 'pageId'],
        },
      },

      // Comment tools
      {
        name: 'list_comments',
        description: 'List comments on an epic, feature, or task (oldest first)',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            targetType: { type: 'string', enum: ['epic', 'feature', 'task'], description: 'Type of item the comments are attached to' },
            targetId: { type: 'string', description: 'ID of the epic/feature/task' },
          },
          required: ['project', 'targetType', 'targetId'],
        },
      },
      {
        name: 'add_comment',
        description: 'Add a comment to an epic, feature, or task. @mentions in the body are parsed and recorded.',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            targetType: { type: 'string', enum: ['epic', 'feature', 'task'], description: 'Type of item to comment on' },
            targetId: { type: 'string', description: 'ID of the epic/feature/task' },
            body: { type: 'string', description: 'Comment text (supports @username mentions)' },
            author: { type: 'string', description: 'Comment author username (default: mcp)' },
          },
          required: ['project', 'targetType', 'targetId', 'body'],
        },
      },
      {
        name: 'delete_comment',
        description: 'Delete a comment by id',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            commentId: { type: 'string', description: 'Comment ID' },
          },
          required: ['project', 'commentId'],
        },
      },

      // Trash tools
      {
        name: 'list_trash',
        description: 'List trashed (soft-deleted) items grouped by delete batch. Also lazily purges items past the retention window.',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
          },
          required: ['project'],
        },
      },
      {
        name: 'restore_trash',
        description: 'Restore a whole delete batch from the trash and recompute affected parent statuses',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            batch: { type: 'string', description: 'Batch id (from list_trash)' },
          },
          required: ['project', 'batch'],
        },
      },
      {
        name: 'purge_trash',
        description: 'Permanently delete a trashed batch, or all trash when batch is "all" (WARNING: not reversible)',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            batch: { type: 'string', description: 'Batch id to purge, or "all" for the entire trash' },
          },
          required: ['project', 'batch'],
        },
      },

      // Share tools
      {
        name: 'list_shares',
        description: 'List public read-only share links for a project',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
          },
          required: ['project'],
        },
      },
      {
        name: 'create_share',
        description: 'Create a public read-only share link for a whole project tree or a single doc page. Returns the token and path (/s/<token>).',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            scope: { type: 'string', enum: ['project', 'page'], description: 'Share the whole project tree (default) or a single page' },
            pageId: { type: 'string', description: 'Page ID (required when scope is "page")' },
            expiresInDays: { type: 'number', description: 'Optional expiry in days (positive number); omit for no expiry' },
          },
          required: ['project'],
        },
      },
      {
        name: 'revoke_share',
        description: 'Revoke (delete) a share link by token',
        inputSchema: {
          type: 'object',
          properties: {
            project: { type: 'string', description: 'Project name' },
            token: { type: 'string', description: 'Share token to revoke' },
          },
          required: ['project', 'token'],
        },
      },
    ],
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      return {
        content: [
          {
            type: 'text',
            text: 'Missing required arguments',
          },
        ],
        isError: true,
      };
    }

    switch (name) {
      // Project tools
      case 'list_projects':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await projectTools.listProjects(), null, 2),
            },
          ],
        };

      case 'create_project':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await projectTools.createProject(args.name as string), null, 2),
            },
          ],
        };

      case 'delete_project':
        await projectTools.deleteProject(args.name as string);
        return {
          content: [
            {
              type: 'text',
              text: `Project '${args.name}' deleted successfully`,
            },
          ],
        };

      case 'get_project_stats':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await projectTools.getProjectStats(args.project as string), null, 2),
            },
          ],
        };

      // Epic tools
      case 'list_epics':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await epicTools.listEpics(args.project as string), null, 2),
            },
          ],
        };

      case 'get_epic':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await epicTools.getEpic(args.project as string, args.epicId as string), null, 2),
            },
          ],
        };

      case 'create_epic':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await epicTools.createEpic(
                  args.project as string,
                  args.title as string,
                  args.desc as string | undefined,
                  args.status as any
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'update_epic':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await epicTools.updateEpic(args.project as string, args.epicId as string, {
                  title: args.title as string | undefined,
                  desc: args.desc as string | undefined,
                  status: args.status as any,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'delete_epic':
        await epicTools.deleteEpic(args.project as string, args.epicId as string);
        return {
          content: [
            {
              type: 'text',
              text: `Epic deleted successfully`,
            },
          ],
        };

      // Feature tools
      case 'list_features':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await featureTools.listFeatures(args.project as string, args.epicId as string | undefined),
                null,
                2
              ),
            },
          ],
        };

      case 'get_feature':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await featureTools.getFeature(args.project as string, args.featureId as string),
                null,
                2
              ),
            },
          ],
        };

      case 'create_feature':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await featureTools.createFeature(
                  args.project as string,
                  args.epicId as string,
                  args.title as string,
                  args.desc as string | undefined,
                  args.uat as string | undefined,
                  args.status as any,
                  args.referenceFile as string | undefined
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'update_feature':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await featureTools.updateFeature(args.project as string, args.featureId as string, {
                  title: args.title as string | undefined,
                  desc: args.desc as string | undefined,
                  uat: args.uat as string | undefined,
                  status: args.status as any,
                  reference_file: args.reference_file as string | undefined,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'delete_feature':
        await featureTools.deleteFeature(args.project as string, args.featureId as string);
        return {
          content: [
            {
              type: 'text',
              text: `Feature deleted successfully`,
            },
          ],
        };

      // Task tools
      case 'list_tasks':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await taskTools.listTasks(args.project as string, args.featureId as string | undefined),
                null,
                2
              ),
            },
          ],
        };

      case 'get_task':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await taskTools.getTask(args.project as string, args.taskId as string), null, 2),
            },
          ],
        };

      case 'create_task':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await taskTools.createTask(
                  args.project as string,
                  args.featureId as string,
                  args.title as string,
                  args.desc as string | undefined,
                  args.uat as string | undefined,
                  args.status as any,
                  args.referenceFile as string | undefined
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'update_task':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await taskTools.updateTask(args.project as string, args.taskId as string, {
                  title: args.title as string | undefined,
                  desc: args.desc as string | undefined,
                  uat: args.uat as string | undefined,
                  status: args.status as any,
                  reference_file: args.reference_file as string | undefined,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'delete_task':
        await taskTools.deleteTask(args.project as string, args.taskId as string);
        return {
          content: [
            {
              type: 'text',
              text: `Task deleted successfully`,
            },
          ],
        };

      case 'mark_task_done':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await taskTools.markTaskDone(args.project as string, args.taskId as string),
                null,
                2
              ),
            },
          ],
        };

      case 'mark_task_in_progress':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await taskTools.markTaskInProgress(args.project as string, args.taskId as string),
                null,
                2
              ),
            },
          ],
        };

      case 'mark_task_blocked':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await taskTools.markTaskBlocked(args.project as string, args.taskId as string),
                null,
                2
              ),
            },
          ],
        };

      // Tree tools
      case 'get_project_tree':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await treeTools.getProjectTree(args.project as string), null, 2),
            },
          ],
        };

      case 'get_epic_tree':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await treeTools.getEpicTree(args.project as string, args.epicId as string),
                null,
                2
              ),
            },
          ],
        };

      // Search tools
      case 'search_items':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await searchTools.searchItems(
                  args.project as string,
                  args.query as string | undefined,
                  args.type as any,
                  args.status as any
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'get_blocked_items':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await searchTools.getBlockedItems(args.project as string), null, 2),
            },
          ],
        };

      case 'get_in_progress_items':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await searchTools.getInProgressItems(args.project as string), null, 2),
            },
          ],
        };

      case 'get_recently_updated':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await searchTools.getRecentlyUpdated(args.project as string, args.limit as number | undefined),
                null,
                2
              ),
            },
          ],
        };

      // Docs / page tools
      case 'list_pages':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await pagesTools.listPages(args.project as string, args.search as string | undefined),
                null,
                2
              ),
            },
          ],
        };

      case 'get_page':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await pagesTools.getPage(args.project as string, args.pageId as string),
                null,
                2
              ),
            },
          ],
        };

      case 'create_page':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await pagesTools.createPage(
                  args.project as string,
                  args.title as string,
                  args.body as string | undefined
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'update_page':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await pagesTools.updatePage(args.project as string, args.pageId as string, {
                  title: args.title as string | undefined,
                  body: args.body as string | undefined,
                }),
                null,
                2
              ),
            },
          ],
        };

      case 'delete_page':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await pagesTools.deletePage(args.project as string, args.pageId as string),
                null,
                2
              ),
            },
          ],
        };

      // Comment tools
      case 'list_comments':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await commentsTools.listComments(
                  args.project as string,
                  args.targetType as string,
                  args.targetId as string
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'add_comment':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await commentsTools.addComment(
                  args.project as string,
                  args.targetType as string,
                  args.targetId as string,
                  args.body as string,
                  args.author as string | undefined
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'delete_comment':
        await commentsTools.deleteComment(args.project as string, args.commentId as string);
        return {
          content: [
            {
              type: 'text',
              text: `Comment deleted successfully`,
            },
          ],
        };

      // Trash tools
      case 'list_trash':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await trashTools.listTrash(args.project as string), null, 2),
            },
          ],
        };

      case 'restore_trash':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await trashTools.restoreTrash(args.project as string, args.batch as string),
                null,
                2
              ),
            },
          ],
        };

      case 'purge_trash':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await trashTools.purgeTrash(args.project as string, args.batch as string),
                null,
                2
              ),
            },
          ],
        };

      // Share tools
      case 'list_shares':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await sharesTools.listShares(args.project as string), null, 2),
            },
          ],
        };

      case 'create_share':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                await sharesTools.createShare(
                  args.project as string,
                  args.scope as any,
                  args.pageId as string | undefined,
                  args.expiresInDays as number | undefined
                ),
                null,
                2
              ),
            },
          ],
        };

      case 'revoke_share':
        await sharesTools.revokeShare(args.project as string, args.token as string);
        return {
          content: [
            {
              type: 'text',
              text: `Share revoked successfully`,
            },
          ],
        };

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('✅ Vibe Todo MCP server running');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Cleanup on exit
process.on('SIGINT', async () => {
  console.error('\n⏹️  Shutting down...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n⏹️  Shutting down...');
  await closeDB();
  process.exit(0);
});

main();
