import express from 'express';
import db from './db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

router.get('/', authenticateToken, (req: any, res) => {
  if (req.user.tier !== 'premium' && req.user.isAdmin !== 1) {
    return res.status(403).json({ error: 'Family sharing requires Premium tier' });
  }

  const members = db.prepare('SELECT id, email, tier FROM users WHERE parent_user_id = ?').all(req.user.id);
  res.json(members);
});

router.post('/link', authenticateToken, (req: any, res) => {
  if (req.user.tier !== 'premium' && req.user.isAdmin !== 1) {
    return res.status(403).json({ error: 'Family sharing requires Premium tier' });
  }

  const { email } = req.body;
  
  // Check limit (max 3 sub-accounts)
  const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE parent_user_id = ?').get(req.user.id) as { count: number };
  if (count.count >= 3) {
    return res.status(400).json({ error: 'Maximum of 3 family members reached' });
  }

  // Find user
  const targetUser = db.prepare('SELECT id, parent_user_id FROM users WHERE email = ?').get(email) as any;
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found. They must register first.' });
  }

  if (targetUser.parent_user_id) {
    return res.status(400).json({ error: 'User is already in a family group.' });
  }

  // Link
  db.prepare('UPDATE users SET parent_user_id = ? WHERE id = ?').run(req.user.id, targetUser.id);
  res.json({ success: true, message: 'Family member linked successfully' });
});

router.delete('/:id', authenticateToken, (req: any, res) => {
  if (req.user.tier !== 'premium' && req.user.isAdmin !== 1) {
    return res.status(403).json({ error: 'Family sharing requires Premium tier' });
  }
  
  db.prepare('UPDATE users SET parent_user_id = NULL WHERE id = ? AND parent_user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

export default router;
