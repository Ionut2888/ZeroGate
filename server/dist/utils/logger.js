"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const createLogger = () => {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logger = winston_1.default.createLogger({
        level: logLevel,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
        defaultMeta: { service: 'zerogate-server' },
        transports: [
            new winston_1.default.transports.File({
                filename: 'logs/error.log',
                level: 'error'
            }),
            new winston_1.default.transports.File({
                filename: 'logs/combined.log'
            })
        ]
    });
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple(), winston_1.default.format.printf(({ timestamp, level, message, service }) => {
                return `${timestamp} [${service}] ${level}: ${message}`;
            }))
        }));
    }
    return logger;
};
exports.createLogger = createLogger;
//# sourceMappingURL=logger.js.map