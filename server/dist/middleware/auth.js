"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)();
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        logger.info(`✅ User authenticated: ${decoded.id}`);
        next();
    }
    catch (error) {
        logger.warn(`⚠️ Invalid token: ${error.message}`);
        let message = 'Invalid token';
        let code = 'TOKEN_INVALID';
        if (error.name === 'TokenExpiredError') {
            message = 'Token expired';
            code = 'TOKEN_EXPIRED';
        }
        else if (error.name === 'JsonWebTokenError') {
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
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map