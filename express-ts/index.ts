import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express, { Express } from 'express';
import GroqService from './src/config/groq';
import errorHandler from './src/middlewares/error';
import debateRouter from './src/routers/debate';

const port = 8000;
const app: Express = express();
app.use(express.json());

// Verify API key is present
if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

const groqService = new GroqService();

app.use('/debate', debateRouter);
app.use(errorHandler);
app.listen(port, () => {
  console.log(`now listening on port ${port}`);
});
