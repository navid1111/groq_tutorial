import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import GroqService from '../config/groq';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

const groqService = new GroqService();

interface DebateRequest {
  topic: string;
  argument1: string;
  argument2: string;
}

interface TranscribeRequest {
  audioUrl: string;
}

export const judgeDebate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('Received debate request');
    console.log('Request body:', req.body);

    const { topic, argument1, argument2 } = req.body as DebateRequest;

    if (!topic || !argument1 || !argument2) {
      console.log('Missing required fields');
      return next(
        new ErrorResponse('Please provide topic and both arguments', 400),
      );
    }

    console.log('Calling GroqService...');
    const scores = await groqService.judgeAndGiveDebateScore(
      topic,
      argument1,
      argument2,
    );

    if (!scores) {
      console.log('No scores returned');
      return next(new ErrorResponse('Failed to analyze debate arguments', 500));
    }

    console.log('Sending response:', scores);
    res.status(200).json({
      success: true,
      data: scores,
    });
  },
);

export const transcribeAudio = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let filePath: string | null = null;

    try {
      if (!req.file) {
        return next(new ErrorResponse('No audio file provided', 400));
      }

      console.log('Processing file:', {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      });

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Save file to disk
      filePath = path.join(
        uploadsDir,
        `${Date.now()}-${req.file.originalname}`,
      );
      await fs.promises.writeFile(filePath, req.file.buffer);

      // Extract options from request body
      const options = {
        language: req.body.language,
        prompt: req.body.prompt,
      };

      // Transcribe audio
      const transcription = await groqService.transcribeAudio(
        filePath,
        options,
      );

      res.status(200).json({
        success: true,
        data: {
          originalName: req.file.originalname,
          transcription,
          metadata: {
            size: req.file.size,
            type: req.file.mimetype,
            language: options.language || 'en',
          },
        },
      });
    } catch (error: any) {
      console.error('Transcription Error:', error);
      next(new ErrorResponse(`Transcription failed: ${error.message}`, 500));
    } finally {
      // Cleanup: Remove temporary file
      if (filePath && fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
          console.log('Cleaned up temporary file:', filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
    }
  },
);
