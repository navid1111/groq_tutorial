import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import ErrorResponse from '../utils/errorResponse';

export interface AuthRequest extends Request {
  user?: any; // Extend Request to include user data
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  let token;

  // Get token from cookies
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Check Authorization header as fallback
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token is found, deny access
  if (!token) {
    return next(new ErrorResponse('Not authorized, no token found', 401));
  }

  try {
    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Fetch user and attach to request object excluding password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized, invalid token', 401));
  }
};
