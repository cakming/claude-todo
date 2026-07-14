import { ObjectId } from 'mongodb';
import { getProjectCollection } from '../config/mongodb.js';
import { validatePage, createPageDoc, DOC_TYPES } from '../models/schemas.js';
import { logActivity } from '../utils/activity.js';
import { applyListFilters } from '../utils/query.js';

/**
 * List a project's doc pages (newest updated first). Supports ?search=.
 */
export async function getPages(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);
    const query = applyListFilters({ type: DOC_TYPES.PAGE }, req.query);
    const pages = await collection.find(query).sort({ updated_at: -1 }).toArray();
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pages' });
  }
}

/**
 * Get a single page by id.
 */
export async function getPageById(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);
    const page = await collection.findOne({ _id: new ObjectId(id), type: DOC_TYPES.PAGE });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch page' });
  }
}

/**
 * Create a page.
 */
export async function createPage(req, res) {
  try {
    const { project } = req.params;
    const collection = getProjectCollection(project);

    const errors = validatePage(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
    }

    const pageDoc = createPageDoc(req.body);
    const result = await collection.insertOne(pageDoc);
    await logActivity(project, { action: 'created', item_type: 'page', title: pageDoc.title });

    res.status(201).json({ success: true, data: { _id: result.insertedId, ...pageDoc } });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ success: false, error: 'Failed to create page' });
  }
}

/**
 * Update a page's title/body.
 */
export async function updatePage(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    // Only title/body are editable.
    const { title, body } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (body !== undefined) updateData.body = String(body);

    if (updateData.title !== undefined && updateData.title.length === 0) {
      return res.status(400).json({ success: false, error: 'Title cannot be empty' });
    }

    updateData.updated_at = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), type: DOC_TYPES.PAGE },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    await logActivity(project, { action: 'updated', item_type: 'page', title: result.title });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ success: false, error: 'Failed to update page' });
  }
}

/**
 * Delete a page.
 */
export async function deletePage(req, res) {
  try {
    const { project, id } = req.params;
    const collection = getProjectCollection(project);

    const page = await collection.findOne({ _id: new ObjectId(id), type: DOC_TYPES.PAGE });
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    await collection.deleteOne({ _id: new ObjectId(id), type: DOC_TYPES.PAGE });
    await logActivity(project, { action: 'deleted', item_type: 'page', title: page.title });

    // Return the removed doc so the client can offer an undo (restore).
    res.json({ success: true, message: 'Page deleted successfully', removed: [page] });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, error: 'Failed to delete page' });
  }
}
