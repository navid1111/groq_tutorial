import express from 'express';
import multer from 'multer';
import { judgeDebate, transcribeAudio } from '../controllers/debate';

// Configure multer for audio files
const upload = multer({
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

const router = express.Router();

router.post('/judge', judgeDebate);
router.post('/transcribe', upload.single('audioFile'), transcribeAudio);

export default router;
