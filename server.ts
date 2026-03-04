import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './server/db.js';
import authRouter from './server/auth.js';
import subscriptionsRouter from './server/subscriptions.js';
import adminRouter from './server/admin.js';
import aiRouter from './server/ai.js';
import familyRouter from './server/family.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Increase payload size for image uploads
  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/family', familyRouter);

  app.get('/api/health', (req, res) => {
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
      res.json({ status: 'ok', database: 'connected', users: userCount });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Database connection failed' });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    app.use(express.static('dist'));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
