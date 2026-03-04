import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Middleware to authenticate JWT
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, tier = 'free' } = req.body;
    
    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First user is admin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const isAdmin = userCount.count === 0 ? 1 : 0;

    const result = db.prepare(
      'INSERT INTO users (email, password_hash, tier, is_admin) VALUES (?, ?, ?, ?)'
    ).run(email, hashedPassword, tier, isAdmin);

    const token = jwt.sign({ id: result.lastInsertRowid, email, tier, isAdmin }, JWT_SECRET);
    
    res.json({ token, user: { id: result.lastInsertRowid, email, tier, isAdmin } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, tier: user.tier, isAdmin: user.is_admin }, 
      JWT_SECRET
    );
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, tier: user.tier, isAdmin: user.is_admin } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT id, email, tier, is_admin as isAdmin, parent_user_id FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

export default router;
