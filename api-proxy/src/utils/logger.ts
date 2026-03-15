import winston from 'winston';
import 'winston-daily-rotate-file';
import fs from 'fs';
import { config } from '../config.js';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Build transports — file rotation only when the log directory is writable
const transports: winston.transport[] = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    })
];

try {
    const logDir = config.auditLogDir;
    // Ensure directory exists (may fail outside Docker — that's fine)
    fs.mkdirSync(logDir, { recursive: true });
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: `${logDir}/hormuzpt_audit_%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            options: {
                mode: 0o600
            }
        })
    );
} catch {
    // File transport unavailable (e.g., dev without Docker volume) — console only
    console.warn('[logger] File audit transport unavailable — using console only');
}

export const auditLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports,
});

export interface AuditPayload {
    ip: string;
    route: string;
    method: string;
    action: string;
    userAgent: string;
    provider?: string;
    model?: string;
    tier?: string;
    tokens_in?: number;
    tokens_out?: number;
    cost_usd?: number;
    status_code: number;
    chat_content?: string;
}

export function logAudit(payload: AuditPayload) {
    auditLogger.info({
        ...payload,
        event_type: 'audit'
    });
}
