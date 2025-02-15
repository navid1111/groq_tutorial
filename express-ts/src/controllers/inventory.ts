import { Request, Response } from 'express';
import GroqService from '../config/groq';
import ErrorResponse from '../utils/errorResponse';

const groqService = new GroqService();

export const inventoryCheck = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      throw new ErrorResponse('Please provide a query', 400);
    }

    const response = await groqService.checkInventory(query);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
};
