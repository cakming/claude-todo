import { listProjectCollections, getProjectCollection, createProjectIndexes, getDB } from '../config/mongodb.js';

/**
 * Get all projects
 */
export async function getProjects(req, res) {
  try {
    const projects = await listProjectCollections();
    res.json({
      success: true,
      data: projects
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

    // Check if project already exists
    const projects = await listProjectCollections();
    if (projects.includes(sanitizedName)) {
      return res.status(409).json({
        success: false,
        error: 'Project already exists'
      });
    }

    // Create collection by inserting a dummy document and removing it
    const collection = getProjectCollection(sanitizedName);
    const dummyDoc = { _dummy: true };
    await collection.insertOne(dummyDoc);
    await collection.deleteOne({ _dummy: true });

    // Create indexes
    await createProjectIndexes(sanitizedName);

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
 * Delete a project
 */
export async function deleteProject(req, res) {
  try {
    const { name } = req.params;

    // Check if project exists
    const projects = await listProjectCollections();
    if (!projects.includes(name)) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Drop the collection
    const db = getDB();
    await db.dropCollection(`project_${name}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
}
