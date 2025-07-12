import { Router } from 'express';
import { verifyProof, getStatus, generateTestProof, getLoginHistory, getLoginStats, getMetricsHistory } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/verify
 * Verify zk-SNARK proof and issue JWT token
 */
router.post('/verify', verifyProof);

/**
 * POST /api/auth/test-proof
 * Generate a test proof for development/testing
 */
router.post('/test-proof', generateTestProof);

/**
 * GET /api/auth/status
 * Get authentication status and circuit setup info
 */
router.get('/status', getStatus);

/**
 * GET /api/auth/me
 * Get current user info (protected route)
 */
router.get('/me', authenticateToken, (req: any, res) => {
  res.json({
    success: true,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/auth/history
 * Get user login history (protected route)
 */
router.get('/history', authenticateToken, getLoginHistory);

/**
 * GET /api/auth/stats
 * Get user login statistics (protected route)
 */
router.get('/stats', authenticateToken, getLoginStats);

/**
 * GET /api/auth/metrics
 * Get user metrics history for charts (protected route)
 */
router.get('/metrics', authenticateToken, getMetricsHistory);

export default router;
