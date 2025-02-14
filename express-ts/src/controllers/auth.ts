import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
import asyncHandler from '../middlewares/asyncHandler';
import User, { UserDocument } from '../models/user';
import authService from '../services/auth';
import ErrorResponse from '../utils/errorResponse';

interface RegisterBody {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface AuthenticatedRequest extends Request {
  user?: { id: string }; // Define the user property with an id
}

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(
  async (
    req: Request<{}, {}, RegisterBody>,
    res: Response,
    next: NextFunction,
  ) => {
    let { first_name, last_name, email, password, role } = req.body;
    // Trim and sanitize inputs
    first_name = validator.trim(first_name || '');
    last_name = validator.trim(last_name || '');
    email = validator.trim(email || '').toLowerCase();
    password = validator.trim(password || '');

    // Input validation
    if (!first_name || !last_name || !email || !password) {
      return next(new ErrorResponse('All fields are required', 400));
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return next(new ErrorResponse('Invalid email format', 400));
    }

    // Check if user already exists (case insensitive)
    const existingUser = await User.findOne({ email }).collation({
      locale: 'en',
      strength: 2,
    });

    if (existingUser) {
      return next(new ErrorResponse('Email already registered', 400));
    }

    // Create user with sanitized inputs
    const user: UserDocument = await User.create({
      first_name,
      last_name,
      email,
      password, // Password will be hashed by the model's pre-save hook
      role: role || 'user',
    });

    const token = await authService.generateToken(user);

    // Remove sensitive data from response
    const userWithoutPassword = user.toObject();

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });

    res.status(201).json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  },
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login a user
 * @access  Public
 */
export const login = asyncHandler(
  async (
    req: Request<{}, {}, LoginBody>,
    res: Response,
    next: NextFunction,
  ) => {
    let { email, password } = req.body;
    // Trim and sanitize inputs
    email = validator.trim(email || '').toLowerCase();
    password = validator.trim(password || '');

    // Input validation
    if (!email || !password) {
      return next(
        new ErrorResponse('Please provide an email and password', 400),
      );
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return next(new ErrorResponse('Invalid email format', 400));
    }

    // Find user with case-insensitive email match
    const user = await User.findOne({ email })
      .collation({ locale: 'en', strength: 2 })
      .select('+password');

    if (!user) {
      // Use consistent error message for security
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check password
    const isMatched = await authService.matchPassword(password, user);

    if (!isMatched) {
      // Use consistent error message for security
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Generate token
    const token = await authService.generateToken(user);

    // Remove sensitive data from response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      data: { user: userWithoutPassword, token },
    });
  },
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout current user
 * @access  Public
 */

export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), // set the cookie to expire immediately
      //secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  },
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ErrorResponse('User not authenticated', 401));
    }

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  },
);
