import { NextFunction, Request, Response } from 'express';
import FileService from '../config/fileService';
import GroqService from '../config/groq';
import asyncHandler from '../middlewares/asyncHandler';
import ErrorResponse from '../utils/errorResponse';

const groqService = new GroqService();

interface DiseasePredictionRequest {
  file: Express.Multer.File;
  body: {
    prompt?: string;
  };
}

export const predictDisease = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let filePath: string | null = null;

    try {
      if (!req.file) {
        return next(new ErrorResponse('No image file provided', 400));
      }

      FileService.validateFileType(req.file, ['image/jpeg', 'image/png']);

      console.log('Processing file:', {
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      });

      filePath = await FileService.saveTempFile(req.file);
      const dataUrl = await FileService.readAsBase64(
        filePath,
        req.file.mimetype,
      );
      const prediction = await groqService.getDiseaseOfPlant(dataUrl);

      res.status(200).json({
        success: true,
        data: {
          originalName: req.file.originalname,
          prediction,
          metadata: {
            size: req.file.size,
            type: req.file.mimetype,
          },
        },
      });
    } catch (error: any) {
      next(
        new ErrorResponse(`Disease prediction failed: ${error.message}`, 500),
      );
    } finally {
      if (filePath) await FileService.cleanup(filePath);
    }
  },
);
