import { listProjectCollections, getProjectCollection, createProjectIndexes, getDB } from '../config/mongodb.js';
import { emitProjectsUpdate } from '../realtime.js';

// Projects are Mongo collections (project_<name>); there's no projects table.
// Soft-deletion is tracked by a marker row here so the collection is retained
// and can be restored.
const TRASH = 'deleted_projects';

async function trashedProjectNames() {
  const rows = await getDB().collection(TRASH).find({}).toArray();
  return rows.map((r) => r.name);
}

/**
 * Get all (live, non-trashed) projects
 */
export async function getProjects(req, res) {
  try {
    const all = await listProjectCollections();
    const trashed = new Set(await trashedProjectNames());
    res.json({
      success: true,
      data: all.filter((name) => !trashed.has(name))
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
}

/**
 * Create a new project
 */
export async function createProject(req, res) {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required and must be a non-empty string'
      });
    }

    // Sanitize project name (lowercase, replace spaces with underscores, remove special chars)
    const sanitizedName = name.toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    if (sanitizedName.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Project name must contain at least one alphanumeric character'
      });
    }

    // Check if project already exists (live or in trash)
    const projects = await listProjectCollections();
    if (projects.includes(sanitizedName)) {
      const trashed = new Set(await trashedProjectNames());
      return res.status(409).json({
        success: false,
        error: trashed.has(sanitizedName)
          ? 'A project with this name is in the trash; restore it instead'
          : 'Project already exists'
      });
    }

    // Create collection by inserting a dummy document and removing it
    const collection = getProjectCollection(sanitizedName);
    const dummyDoc = { _dummy: true };
    await collection.insertOne(dummyDoc);
    await collection.deleteOne({ _dummy: true });

    // Create indexes
    await createProjectIndexes(sanitizedName);

    emitProjectsUpdate();

    res.status(201).json({
      success: true,
      data: {
        name: sanitizedName,
        originalName: name
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
}

/**
 * Soft-delete a project: mark it trashed (the collection is retained so it can
 * be restored).
 */
export async function deleteProject(req, res) {
  try {
    const { name } = req.params;

    const projects = await listProjectCollections();
    const trashed = new Set(await trashedProjectNames());
    if (!projects.includes(name) || trashed.has(name)) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    await getDB().collection(TRASH).updateOne(
      { name },
      { $set: { name, deleted_at: new Date() } },
      { upsert: true }
    );

    emitProjectsUpdate();
    res.json({ success: true, message: 'Project moved to trash' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
}

/**
 * List trashed projects.
 */
export async function getTrashedProjects(req, res) {
  try {
    const rows = await getDB().collection(TRASH).find({}).sort({ deleted_at: -1 }).toArray();
    res.json({ success: true, data: rows.map((r) => ({ name: r.name, deleted_at: r.deleted_at })) });
  } catch (error) {
    console.error('Error listing trashed projects:', error);
    res.status(500).json({ success: false, error: 'Failed to list trashed projects' });
  }
}

/**
 * Restore a trashed project.
 */
export async function restoreProject(req, res) {
  try {
    const { name } = req.params;
    const result = await getDB().collection(TRASH).deleteOne({ name });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Project not in trash' });
    }
    emitProjectsUpdate();
    res.json({ success: true, message: 'Project restored' });
  } catch (error) {
    console.error('Error restoring project:', error);
    res.status(500).json({ success: false, error: 'Failed to restore project' });
  }
}

/**
 * Permanently delete a trashed project (drops the collection).
 */
export async function purgeProject(req, res) {
  try {
    const { name } = req.params;
    const trashed = new Set(await trashedProjectNames());
    if (!trashed.has(name)) {
      return res.status(404).json({ success: false, error: 'Project not in trash' });
    }

    const projects = await listProjectCollections();
    if (projects.includes(name)) {
      await getDB().dropCollection(`project_${name}`);
    }
    await getDB().collection(TRASH).deleteOne({ name });

    emitProjectsUpdate();
    res.json({ success: true, message: 'Project permanently deleted' });
  } catch (error) {
    console.error('Error purging project:', error);
    res.status(500).json({ success: false, error: 'Failed to purge project' });
  }
}
