import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express, { Express, Request, Response } from 'express';
import GroqService from './src/config/groq';

const port = 8000;
const app: Express = express();
app.use(express.json());

// Verify API key is present
if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

const groqService = new GroqService();

app.get('/', (req: Request, res: Response) => {
  res.send('HELLO FROM EXPRESS + TS!!!!');
});

app.get('/hi', (req: Request, res: Response) => {
  res.send('BYEEE!!');
});
app.post('/chat', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    const response = await groqService.getCompletion(prompt);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.listen(port, () => {
  console.log(`now listening on port ${port}`);
});
