"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)();
const errorHandler = (error, req, res, next) => {
    logger.error('💥 Unhandled error:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(isDevelopment && {
                stack: error.stack,
                details: error
            })
        },
        timestamp: new Date().toISOString()
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map