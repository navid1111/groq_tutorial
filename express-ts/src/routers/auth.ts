import express from 'express';
import { getMe, login, logout, register } from '../controllers/auth';
import { protect } from '../middlewares/auth';

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post('/logout', logout);

router.get('/me', protect, getMe);

export default router;
