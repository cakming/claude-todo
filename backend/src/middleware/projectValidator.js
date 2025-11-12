import { listProjectCollections } from '../config/mongodb.js';

/**
 * Middleware to validate that a project exists
 */
export async function validateProject(req, res, next) {
  try {
    const { project } = req.params;

    if (!project) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const projects = await listProjectCollections();

    if (!projects.includes(project)) {
      return res.status(404).json({
        success: false,
        error: `Project '${project}' not found`
      });
    }

    next();
  } catch (error) {
    console.error('Error validating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate project'
    });
  }
}
