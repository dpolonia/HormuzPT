import cron from 'node-cron';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { auditLogger } from '../utils/logger.js';

// Job: Send yesterday's compressed audit log at 00:01 Lisbon time
export function startAuditScheduler() {
    cron.schedule('1 0 * * *', async () => {
        try {
            await sendDailyAuditLog();
        } catch (error) {
            auditLogger.error('Failed to send daily audit log', { error });
        }
    }, {
        scheduled: true,
        timezone: config.auditEmailTimezone
    } as any);
    auditLogger.info(`Audit scheduler initialized for 00:01 ${config.auditEmailTimezone}`);
}

async function sendDailyAuditLog() {
    if (!config.smtpHost || !config.auditEmailTo) {
        auditLogger.warn('SMTP or AUDIT_EMAIL_TO not configured. Skipping daily email.');
        return;
    }

    const today = new Date();
    // Get yesterday's date formatted as YYYY-MM-DD
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    
    // Pattern matches the DailyRotateFile zipped archive or raw unzipped
    const rawLogFile = path.join(config.auditLogDir, `hormuzpt_audit_${yStr}.log`);
    const zipLogFile = path.join(config.auditLogDir, `hormuzpt_audit_${yStr}.log.gz`);
    
    let targetFile = '';
    if (fs.existsSync(zipLogFile)) {
        targetFile = zipLogFile;
    } else if (fs.existsSync(rawLogFile)) {
        targetFile = rawLogFile;
    } else {
        auditLogger.info(`No audit log found for ${yStr}. Skipped email.`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, 
        auth: {
            user: config.smtpUser,
            pass: config.smtpPassword
        }
    });

    const mailOptions = {
        from: config.smtpFrom,
        to: config.auditEmailTo,
        subject: `[HormuzPT] Audit Log for ${yStr}`,
        text: `Attached is the HormuzPT private audit log for ${yStr}.\n\nThe file is securely generated from the isolated backend volume.`,
        attachments: [
            {
                filename: path.basename(targetFile),
                path: targetFile
            }
        ]
    };

    const info = await transporter.sendMail(mailOptions);
    auditLogger.info(`Successfully emailed audit log for ${yStr} to ${config.auditEmailTo}`, {
        messageId: info.messageId
    });
}
