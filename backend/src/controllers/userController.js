import { ObjectId } from 'mongodb';
import { getDB } from '../config/mongodb.js';
import { hashPassword, validatePassword } from '../utils/auth.js';

const VALID_ROLES = ['admin', 'editor', 'member', 'viewer'];

function getUsersCollection() {
  return getDB().collection('users');
}

/** List all users (admin only). Passwords are excluded. */
export async function listUsers(req, res) {
  try {
    const users = await getUsersCollection()
      .find({}, { projection: { password: 0 } })
      .sort({ created_at: 1 })
      .toArray();
    res.json({
      success: true,
      data: users.map((u) => ({
        userId: u._id.toString(),
        username: u.username,
        email: u.email,
        role: u.role || 'member',
        created_at: u.created_at
      }))
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, message: 'Failed to list users' });
  }
}

/** Change a user's role (admin only). */
export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
    }
    const result = await getUsersCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { role, updated_at: new Date() } },
      { returnDocument: 'after', projection: { password: 0 } }
    );
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: { userId: result._id.toString(), role: result.role } });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
}

/** Delete a user (admin only). Admins cannot delete themselves. */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (req.user && req.user.userId === id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    const result = await getUsersCollection().deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
}

/** Admin-initiated password reset for a user. */
export async function resetUserPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: 'Password validation failed', errors: validation.errors });
    }
    const hashed = await hashPassword(newPassword);
    const result = await getUsersCollection().updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: hashed, updated_at: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'Password reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}
