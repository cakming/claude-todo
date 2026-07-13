import { getActivity } from '../utils/activity.js';

/**
 * Get recent activity for a project.
 */
export async function getProjectActivity(req, res) {
  try {
    const { project } = req.params;
    const data = await getActivity(project);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity'
    });
  }
}
