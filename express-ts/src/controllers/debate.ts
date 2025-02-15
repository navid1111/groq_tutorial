import { NextFunction, Request, Response } from 'express';
import FileService from '../config/fileService';
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
      if (!req.file)
        return next(new ErrorResponse('No audio file provided', 400));

      FileService.validateFileType(req.file, ['audio/mpeg', 'audio/wav']);

      filePath = await FileService.saveTempFile(req.file);
      const transcription = await groqService.transcribeAudio(filePath);

      res.status(200).json({
        success: true,
        data: {
          originalName: req.file.originalname,
          transcription,
        },
      });
    } catch (error: any) {
      next(new ErrorResponse(`Transcription failed: ${error.message}`, 500));
    } finally {
      if (filePath) await FileService.cleanup(filePath);
    }
  },
);
