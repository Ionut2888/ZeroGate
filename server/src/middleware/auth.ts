import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';

const logger = createLogger();

/**
 * Extended Request interface with user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    proofVerified: boolean;
    iat: number;
    exp: number;
  };
}

/**
 * JWT Authentication middleware
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      }
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('❌ JWT_SECRET environment variable not set');
    res.status(500).json({
      success: false,
      error: {
        message: 'Server configuration error',
        code: 'CONFIG_ERROR'
      }
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.user = decoded;
    
    logger.info(`✅ User authenticated: ${decoded.id}`);
    next();
  } catch (error: any) {
    logger.warn(`⚠️ Invalid token: ${error.message}`);
    
    let message = 'Invalid token';
    let code = 'TOKEN_INVALID';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Token expired';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Malformed token';
      code = 'TOKEN_MALFORMED';
    }
    
    res.status(403).json({
      success: false,
      error: {
        message,
        code
      }
    });
  }
};
