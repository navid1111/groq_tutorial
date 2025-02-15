import next from 'next';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

// Define types for environment variables
const dev: boolean = process.env.NODE_ENV !== 'production';
const hostname: string = 'localhost';
const port: number = 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Start server after Next.js is ready
app.prepare().then(() => {
  // Create HTTP server with Next.js handler
  const httpServer = createServer(handler);

  // Initialize Socket.IO
  const io = new Server(httpServer);

  // Handle socket connections
  io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Handle server errors and start listening
  httpServer
    .once('error', err => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
