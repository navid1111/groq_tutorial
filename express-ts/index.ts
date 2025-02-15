import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import connectDB from './src/config/db';
import GroqService from './src/config/groq';
import errorHandler from './src/middlewares/error';
import authRouter from './src/routers/auth';
import debateRouter from './src/routers/debate';

const port = 8000;
const app: Express = express();
const server = http.createServer(app);
// what is this server. whats it function whats the difference between app and server
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Your Next.js frontend origin
    methods: ['GET', 'POST'],
  },
});
// what is this io? explain the class Server what is can do
app.use(express.json());
app.use(cookieParser());
connectDB();
io.on('connection', (socket: Socket) => {
  console.log('A connection was made');
  socket.on('chat-message', message => {
    console.log(message);
  });
});
// Verify API key is present
if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

const groqService = new GroqService();
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/debate', debateRouter);
app.use(errorHandler);
app.listen(port, () => {
  console.log(`now listening on port ${port}`);
});
server.listen(3001, () => {
  console.log('listening on *:3001');
});
