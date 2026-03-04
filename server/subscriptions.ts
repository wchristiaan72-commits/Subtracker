import express from 'express';
import db from './db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

const TIER_LIMITS: Record<string, number> = {
  free: 3,
  basic: 10,
  pro: Infinity,
  premium: Infinity
};

// Get all subscriptions for the logged-in user (and their family if premium)
router.get('/', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  
  // If user is premium, they might want to see family subscriptions too
  // For now, just get their own and anyone who has them as a parent
  const subs = db.prepare(`
    SELECT user_subscriptions.*, users.email as user_email 
    FROM user_subscriptions 
    JOIN users ON user_subscriptions.user_id = users.id
    WHERE user_subscriptions.user_id = ? OR users.parent_user_id = ?
    ORDER BY renewal_date ASC
  `).all(userId, userId);
  
  res.json(subs);
});

// The Gatekeeper: Add a new subscription
router.post('/', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const userTier = req.user.tier;
  const { service_name, monthly_cost, renewal_date, cancel_url } = req.body;

  // 1. Check current active subscription count
  const activeCount = db.prepare(
    "SELECT COUNT(*) as count FROM user_subscriptions WHERE user_id = ? AND status = 'active'"
  ).get(userId) as { count: number };

  // 2. Gatekeeper Logic
  const limit = TIER_LIMITS[userTier] || 3;
  if (activeCount.count >= limit) {
    return res.status(403).json({ 
      error: 'Tier limit reached', 
      message: `Your ${userTier} tier is limited to ${limit} active subscriptions. Please upgrade to add more.`
    });
  }

  // 3. Insert if allowed
  try {
    const result = db.prepare(`
      INSERT INTO user_subscriptions (user_id, service_name, monthly_cost, renewal_date, cancel_url)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, service_name, monthly_cost, renewal_date, cancel_url || null);

    const newSub = db.prepare('SELECT * FROM user_subscriptions WHERE id = ?').get(result.lastInsertRowid);
    res.json(newSub);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add subscription' });
  }
});

// Cancel a subscription
router.put('/:id/cancel', authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const subId = req.params.id;

  // Verify ownership
  const sub = db.prepare('SELECT * FROM user_subscriptions WHERE id = ? AND user_id = ?').get(subId, userId);
  if (!sub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  db.prepare("UPDATE user_subscriptions SET status = 'canceled' WHERE id = ?").run(subId);
  res.json({ success: true, message: 'Subscription canceled' });
});

export default router;
