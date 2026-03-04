import express from 'express';
import db from './db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Middleware to check admin status
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  // Tier breakdown
  const users = db.prepare('SELECT tier, COUNT(*) as count FROM users GROUP BY tier').all() as any[];
  const breakdown: Record<string, number> = { free: 0, basic: 0, pro: 0, premium: 0 };
  users.forEach(row => {
    breakdown[row.tier] = row.count;
  });

  // Calculate Gross Revenue from payments table
  const paymentsStats = db.prepare('SELECT SUM(amount) as grossRevenue, COUNT(*) as transactionCount FROM payments WHERE status = "succeeded"').get() as { grossRevenue: number | null, transactionCount: number };
  
  const grossRevenue = paymentsStats.grossRevenue || 0;
  const transactionCount = paymentsStats.transactionCount || 0;

  // Stripe fees: 2.9% + $0.30 per transaction
  const stripeFees = (grossRevenue * 0.029) + (transactionCount * 0.30);
  const netProfit = grossRevenue - stripeFees;

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const totalSubs = db.prepare('SELECT COUNT(*) as count FROM user_subscriptions').get() as { count: number };

  res.json({
    grossRevenue,
    netProfit,
    stripeFees,
    transactionCount,
    usersByTier: breakdown,
    totalUsers: totalUsers.count,
    totalSubscriptions: totalSubs.count
  });
});

router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT id, email, tier, is_admin, created_at,
    (SELECT COUNT(*) FROM user_subscriptions WHERE user_id = users.id) as sub_count
    FROM users
    ORDER BY created_at DESC
  `).all();
  res.json(users);
});

router.put('/users/:id/tier', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { tier } = req.body;
  
  if (!['free', 'basic', 'pro', 'premium'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  try {
    db.prepare('UPDATE users SET tier = ? WHERE id = ?').run(tier, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user tier' });
  }
});

router.delete('/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  
  try {
    const deleteUser = db.transaction(() => {
      // Unlink family members (set parent_user_id to NULL)
      db.prepare('UPDATE users SET parent_user_id = NULL WHERE parent_user_id = ?').run(id);
      // Delete user (cascade deletes subscriptions and payments)
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });
    
    deleteUser();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/family-groups', authenticateToken, requireAdmin, (req, res) => {
  try {
    const parents = db.prepare(`
      SELECT id, email, tier, created_at
      FROM users
      WHERE tier = 'premium'
    `).all() as any[];

    const groups = parents.map(parent => {
      const children = db.prepare(`
        SELECT id, email, created_at
        FROM users
        WHERE parent_user_id = ?
      `).all(parent.id);
      
      return {
        ...parent,
        children
      };
    });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch family groups' });
  }
});

export default router;
