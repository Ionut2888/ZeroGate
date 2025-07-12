import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import Joi from 'joi';
import { ZoKratesService } from '../utils/zokrates';
import { createLogger } from '../utils/logger';
import { loginHistoryService } from '../services/LoginHistoryService';
import { ProofMetrics } from '../models/LoginHistory';

const logger = createLogger();
const zoKratesService = new ZoKratesService();

/**
 * Validation schema for proof verification request
 */
const verifyProofSchema = Joi.object({
  proof: Joi.object().required(),
  publicInputs: Joi.array().items(Joi.string()).required(),
  username: Joi.string().min(1).max(1000).required()
});

/**
 * Validation schema for test proof generation
 */
const testProofSchema = Joi.object({
  secret: Joi.string().min(1).max(1000).required()
});

/**
 * Verify zk-SNARK proof and issue JWT token
 */
export const verifyProof = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  let username = '';
  
  try {
    logger.info('🔐 Proof verification request received');
    
    // Validate request body
    const { error, value } = verifyProofSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request format',
          details: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
      return;
    }

    const { proof, publicInputs, username: validatedUsername } = value;
    username = validatedUsername;

    // Check if circuit is properly set up
    const isSetup = await zoKratesService.isCircuitSetup();
    if (!isSetup) {
      // Record failed login
      await loginHistoryService.addLoginEntry({
        username,
        success: false,
        errorMessage: 'Circuit not properly set up',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(503).json({
        success: false,
        error: {
          message: 'Circuit not properly set up. Run setup first.',
          code: 'CIRCUIT_NOT_SETUP'
        }
      });
      return;
    }

    // Measure verification time
    const verificationStartTime = Date.now();
    const isValidProof = await zoKratesService.verifyProof(proof, publicInputs);
    const verificationTime = Date.now() - verificationStartTime;
    
    if (!isValidProof) {
      logger.warn('❌ Proof verification failed');
      
      // Record failed login
      await loginHistoryService.addLoginEntry({
        username,
        success: false,
        errorMessage: 'Proof verification failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(401).json({
        success: false,
        error: {
          message: 'Proof verification failed',
          code: 'PROOF_INVALID'
        }
      });
      return;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('❌ JWT_SECRET not configured');
      res.status(500).json({
        success: false,
        error: {
          message: 'Server configuration error',
          code: 'CONFIG_ERROR'
        }
      });
      return;
    }

    const tokenPayload = {
      id: `user_${Date.now()}`, // In a real app, this would be a proper user ID
      proofVerified: true,
      username: username, // Display full username
      timestamp: new Date().toISOString()
    };

    const token = jwt.sign(tokenPayload, jwtSecret as string, { expiresIn: '1h' });

    // Calculate metrics
    const totalTime = Date.now() - startTime;
    const proofSize = JSON.stringify(proof).length;
    
    const metrics: ProofMetrics = {
      generationTime: 0, // Will be provided by client in future
      verificationTime,
      proofSize,
      publicInputsCount: publicInputs.length
    };

    // Record successful login with metrics
    await loginHistoryService.addLoginEntry({
      username,
      success: true,
      metrics,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logger.info('✅ Proof verified successfully, JWT issued');

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: tokenPayload,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      metrics: {
        verificationTime,
        proofSize,
        totalTime
      }
    });

  } catch (error: any) {
    logger.error('💥 Error in proof verification:', error);
    
    // Record failed login if we have username
    if (username) {
      await loginHistoryService.addLoginEntry({
        username,
        success: false,
        errorMessage: error.message || 'Internal server error',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};

/**
 * Generate test proof for development/testing
 */
export const generateTestProof = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('🧪 Test proof generation requested');

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Test proof generation not allowed in production',
          code: 'NOT_ALLOWED'
        }
      });
      return;
    }

    // Validate request
    const { error, value } = testProofSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request format',
          details: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
      return;
    }

    const { secret } = value;

    // Check circuit setup
    const isSetup = await zoKratesService.isCircuitSetup();
    if (!isSetup) {
      res.status(503).json({
        success: false,
        error: {
          message: 'Circuit not properly set up. Run setup first.',
          code: 'CIRCUIT_NOT_SETUP'
        }
      });
      return;
    }

    // Generate test proof
    const { proof, publicInputs } = await zoKratesService.generateTestProof(secret);

    logger.info('✅ Test proof generated successfully');

    res.status(200).json({
      success: true,
      message: 'Test proof generated',
      proof,
      publicInputs,
      secret: secret.substring(0, 3) + '***',
      note: 'Use this proof in the /verify endpoint'
    });

  } catch (error: any) {
    logger.error('💥 Error generating test proof:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to generate test proof',
        code: 'PROOF_GENERATION_ERROR'
      }
    });
  }
};

/**
 * Get circuit setup status and authentication info
 */
export const getStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('📊 Status check requested');

    const setupStatus = await zoKratesService.getSetupStatus();
    
    res.status(200).json({
      success: true,
      status: {
        server: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        circuit: setupStatus,
        features: {
          proofVerification: setupStatus.isSetup,
          jwtAuth: !!process.env.JWT_SECRET,
          testProofGeneration: process.env.NODE_ENV !== 'production'
        }
      }
    });

  } catch (error: any) {
    logger.error('💥 Error getting status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get status',
        code: 'STATUS_ERROR'
      }
    });
  }
};

/**
 * Get user login history
 */
export const getLoginHistory = async (req: any, res: Response): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Username not found in token',
          code: 'AUTH_ERROR'
        }
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await loginHistoryService.getUserHistory(username, limit);

    res.json({
      success: true,
      history,
      count: history.length
    });

  } catch (error: any) {
    logger.error('💥 Error getting login history:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get login history',
        code: 'HISTORY_ERROR'
      }
    });
  }
};

/**
 * Get user login statistics
 */
export const getLoginStats = async (req: any, res: Response): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Username not found in token',
          code: 'AUTH_ERROR'
        }
      });
      return;
    }

    const stats = await loginHistoryService.getUserStats(username);

    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    logger.error('💥 Error getting login stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get login statistics',
        code: 'STATS_ERROR'
      }
    });
  }
};

/**
 * Get metrics history for charts
 */
export const getMetricsHistory = async (req: any, res: Response): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Username not found in token',
          code: 'AUTH_ERROR'
        }
      });
      return;
    }

    const days = parseInt(req.query.days as string) || 30;
    const metricsHistory = await loginHistoryService.getMetricsHistory(username, days);

    res.json({
      success: true,
      metricsHistory,
      count: metricsHistory.length,
      period: `${days} days`
    });

  } catch (error: any) {
    logger.error('💥 Error getting metrics history:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get metrics history',
        code: 'METRICS_ERROR'
      }
    });
  }
};
