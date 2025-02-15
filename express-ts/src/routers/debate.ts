import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { judgeDebate, transcribeAudio } from '../controllers/debate';
import { predictDisease } from '../controllers/plant';

// Configure multer for audio files
const audioUpload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// Configure multer for image files
const imageUpload = multer({
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const predictionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const router = express.Router();

router.post('/judge', predictionLimiter, judgeDebate);
router.post(
  '/transcribe',
  predictionLimiter,
  audioUpload.single('audioFile'),
  transcribeAudio,
);
router.post(
  '/predict',
  predictionLimiter,
  imageUpload.single('imageFile'),
  predictDisease,
);

export default router;
