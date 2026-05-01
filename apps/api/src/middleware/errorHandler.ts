import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware.
 * Distinguishes between operational errors (4xx) and unexpected errors (5xx).
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
  } else {
    logger.warn('Client error', { statusCode, message: err.message });
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Creates an operational error with an HTTP status code
 */
export function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}
