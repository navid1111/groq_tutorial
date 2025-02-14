import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import User from '../models/user';

export const socketAuth = async (
  socket: Socket,
  next: (err?: ExtendedError | undefined) => void,
) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers['authorization'];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Remove 'Bearer ' if present
    const tokenString = token.startsWith('Bearer ')
      ? token.split(' ')[1]
      : token;

    // Verify token
    const decoded = jwt.verify(tokenString, process.env.JWT_SECRET!) as {
      id: string;
    };

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket
    socket.data.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};
