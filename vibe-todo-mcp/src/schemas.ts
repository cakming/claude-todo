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
