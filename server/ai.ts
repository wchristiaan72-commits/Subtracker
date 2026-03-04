import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { authenticateToken } from './auth.js';
import db from './db.js';

const router = express.Router();

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

router.post('/scan-receipt', authenticateToken, async (req: any, res) => {
  if (!ai) {
    return res.status(500).json({ error: 'AI features are not configured.' });
  }

  // Ensure user is Premium
  if (req.user.tier !== 'premium' && req.user.isAdmin !== 1) {
    return res.status(403).json({ error: 'AI Receipt Scanning is a Premium feature.' });
  }

  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType
          }
        },
        "Examine this receipt. Return a JSON object with: 'service_name' (string), 'monthly_cost' (number), and 'renewal_date' (YYYY-MM-DD string). If you cannot find a date, estimate the next renewal based on today's date (e.g., one month from today)."
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            service_name: { type: Type.STRING },
            monthly_cost: { type: Type.NUMBER },
            renewal_date: { type: Type.STRING }
          },
          required: ['service_name', 'monthly_cost', 'renewal_date']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    // Auto-insert into database
    const service_name = data.service_name || 'Unknown Service';
    const monthly_cost = data.monthly_cost || 0;
    // Fallback to 1 month from now if AI fails to provide a date
    const fallbackDate = new Date();
    fallbackDate.setMonth(fallbackDate.getMonth() + 1);
    const renewal_date = data.renewal_date || fallbackDate.toISOString().split('T')[0];

    const result = db.prepare(`
      INSERT INTO user_subscriptions (user_id, service_name, monthly_cost, renewal_date)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, service_name, monthly_cost, renewal_date);

    const newSub = db.prepare('SELECT * FROM user_subscriptions WHERE id = ?').get(result.lastInsertRowid);
    
    res.json({ success: true, subscription: newSub });
  } catch (error) {
    console.error('AI Scan Error:', error);
    res.status(500).json({ error: 'Failed to scan receipt.' });
  }
});

export default router;
