import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // Return null transport — emails will be logged but not sent
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const from = opts.from ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@checkinn.app";
  const transport = createTransport();

  if (!transport) {
    logger.info({ to: opts.to, subject: opts.subject }, "Email (SMTP not configured — logged only)");
    return true;
  }

  try {
    await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.to }, "Failed to send email");
    return false;
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

export function bookingConfirmationHtml(data: {
  guestName: string; bookingRef: string; roomNumber: string;
  checkInDate: string; checkOutDate: string; checkinUrl: string; hotelName: string;
}) {
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b">
<h1 style="color:#6366f1;font-size:24px;margin-bottom:4px">${data.hotelName}</h1>
<h2 style="font-size:18px;margin-bottom:24px">Booking Confirmation</h2>
<p>Dear ${data.guestName},</p>
<p>Your reservation has been confirmed. Please complete your check-in using the link below.</p>
<table style="width:100%;border-collapse:collapse;margin:24px 0">
  <tr><td style="padding:8px;background:#f8fafc;border-radius:6px;font-weight:600">Booking Ref</td><td style="padding:8px">${data.bookingRef}</td></tr>
  <tr><td style="padding:8px;background:#f8fafc;border-radius:6px;font-weight:600">Room</td><td style="padding:8px">${data.roomNumber}</td></tr>
  <tr><td style="padding:8px;background:#f8fafc;border-radius:6px;font-weight:600">Check-in</td><td style="padding:8px">${new Date(data.checkInDate).toLocaleDateString()}</td></tr>
  <tr><td style="padding:8px;background:#f8fafc;border-radius:6px;font-weight:600">Check-out</td><td style="padding:8px">${new Date(data.checkOutDate).toLocaleDateString()}</td></tr>
</table>
<a href="${data.checkinUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Complete Check-in</a>
<p style="margin-top:24px;color:#64748b;font-size:14px">If you have any questions, please contact us.</p>
</body></html>`;
}

export function passwordResetHtml(data: { name: string; resetUrl: string; hotelName: string }) {
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b">
<h1 style="color:#6366f1">${data.hotelName}</h1>
<h2>Reset Your Password</h2>
<p>Hi ${data.name},</p>
<p>You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
<a href="${data.resetUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
<p style="margin-top:24px;color:#64748b;font-size:14px">If you didn't request this, ignore this email.</p>
</body></html>`;
}

export function staffInviteHtml(data: { inviterName: string; hotelName: string; setupUrl: string; role: string }) {
  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b">
<h1 style="color:#6366f1">${data.hotelName}</h1>
<h2>You've been added to ${data.hotelName}</h2>
<p>${data.inviterName} has added you as <strong>${data.role}</strong>.</p>
<a href="${data.setupUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Set Up Your Account</a>
</body></html>`;
}
