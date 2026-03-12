import winston from 'winston';
import 'winston-daily-rotate-file';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Create daily rotation transport targeting the private docker volume
const transport = new winston.transports.DailyRotateFile({
    filename: '/var/log/hormuzpt/private/hormuzpt_audit_%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    options: {
        mode: 0o600 // Restrict file permissions
    }
});

export const auditLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        transport,
        // Also log to console for development visibility
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
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
