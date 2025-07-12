"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.generateTestProof = exports.verifyProof = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const zokrates_1 = require("../utils/zokrates");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)();
const zoKratesService = new zokrates_1.ZoKratesService();
const verifyProofSchema = joi_1.default.object({
    proof: joi_1.default.object().required(),
    publicInputs: joi_1.default.array().items(joi_1.default.string()).required(),
    secret: joi_1.default.string().min(1).max(1000).required()
});
const testProofSchema = joi_1.default.object({
    secret: joi_1.default.string().min(1).max(1000).required()
});
const verifyProof = async (req, res) => {
    try {
        logger.info('🔐 Proof verification request received');
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
        const { proof, publicInputs, secret } = value;
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
        const isValidProof = await zoKratesService.verifyProof(proof, publicInputs);
        if (!isValidProof) {
            logger.warn('❌ Proof verification failed');
            res.status(401).json({
                success: false,
                error: {
                    message: 'Proof verification failed',
                    code: 'PROOF_INVALID'
                }
            });
            return;
        }
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
            id: `user_${Date.now()}`,
            proofVerified: true,
            secret: secret.substring(0, 3) + '***',
            timestamp: new Date().toISOString()
        };
        const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
        logger.info('✅ Proof verified successfully, JWT issued');
        res.status(200).json({
            success: true,
            message: 'Authentication successful',
            token,
            user: tokenPayload,
            expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        });
    }
    catch (error) {
        logger.error('💥 Error in proof verification:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
};
exports.verifyProof = verifyProof;
const generateTestProof = async (req, res) => {
    try {
        logger.info('🧪 Test proof generation requested');
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
    }
    catch (error) {
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
exports.generateTestProof = generateTestProof;
const getStatus = async (req, res) => {
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
    }
    catch (error) {
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
exports.getStatus = getStatus;
//# sourceMappingURL=authController.js.map