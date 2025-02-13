import express from 'express';
import { judgeDebate } from '../controllers/debate';

const router = express.Router();

router.post('/judge', judgeDebate);

export default router;
