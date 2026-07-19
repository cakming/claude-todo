import { ObjectId } from 'mongodb';

export type EpicStatus = 'planning' | 'in_progress' | 'done' | 'blocked';
export type ItemStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type ItemType = 'epic' | 'feature' | 'task';

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

export interface Task {
  _id?: ObjectId;
  type: 'task';
  feature_id: ObjectId;
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

export interface EpicWithProgress extends Epic {
  progress?: Progress;
  features?: FeatureWithProgress[];
}

export interface FeatureWithProgress extends Feature {
  progress?: Progress;
  tasks?: Task[];
}

export const EPIC_STATUSES: EpicStatus[] = ['planning', 'in_progress', 'done', 'blocked'];
export const ITEM_STATUSES: ItemStatus[] = ['todo', 'in_progress', 'done', 'blocked'];

// --- Docs pages, comments, and share links -------------------------------
// These mirror the web-app data model. Pages, comments, and the epic/feature/
// task tree all live in the same per-project `project_<name>` collection,
// discriminated by `type`. Share links live in a top-level `shares` collection.

export type CommentTarget = 'epic' | 'feature' | 'task';
export const COMMENT_TARGETS: CommentTarget[] = ['epic', 'feature', 'task'];

// What a share link exposes: a whole project tree, or a single doc page.
export type ShareScope = 'project' | 'page';
export const SHARE_SCOPES: ShareScope[] = ['project', 'page'];

export interface Page {
  _id?: ObjectId;
  type: 'page';
  title: string;
  body: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  deleted_batch?: ObjectId;
}

export interface Comment {
  _id?: ObjectId;
  type: 'comment';
  target_type: CommentTarget;
  target_id: ObjectId;
  body: string;
  author: string;
  mentions: string[];
  created_at: Date;
}

export interface Share {
  _id?: ObjectId;
  token: string;
  project: string;
  scope: ShareScope;
  page_id: string | null;
  created_at: Date;
  expires_at: Date | null;
}

/**
 * Extract unique @mentions from comment text (mirrors the backend parser).
 */
export function parseMentions(body: string): string[] {
  const found = new Set<string>();
  const re = /@([a-zA-Z0-9_.-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body || '')) !== null) found.add(m[1]);
  return [...found];
}
