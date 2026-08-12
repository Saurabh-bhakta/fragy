const nodemailer = require('nodemailer');

/**
 * Optional email helper using Nodemailer.
 * Configured via EMAIL_HOST/USER/PASSWORD/PORT/FROM or SMTP_HOST/USER/PASS/PORT/MAIL_FROM.
 * If SMTP is not configured, emails are logged to console safely without failing backend tasks.
 */
function createTransport() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);

  if (!host || !user) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, text, html }) {
  const from =
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM ||
    'Fragy Team <noreply@fragy.local>';

  const transport = createTransport();

  if (!transport) {
    console.log('[email:dev-mock]', { to, subject, text });
    return { mocked: true };
  }

  return transport.sendMail({ from, to, subject, text, html });
}

async function sendWelcomeEmail(user) {
  return sendMail({
    to: user.email,
    subject: 'Welcome to Fragy',
    text: `Hi ${user.name},\n\nWelcome to Fragy! You can now browse semester study materials.\n\n— Fragy Team`,
    html: `<p>Hi <strong>${user.name}</strong>,</p><p>Welcome to Fragy! You can now browse semester study materials.</p><p>— Fragy Team</p>`,
  });
}

/**
 * Sends a 6-digit OTP code to the user's email address.
 * Never logs the OTP in production.
 */
async function sendOtpEmail(email, otp) {
  const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = 'Your Fragy Verification Code';

  const textBody = `Hello,

Your verification code for Fragy is: ${otp}

This code will expire in 10 minutes. Please do not share this code with anyone.

Visit Fragy:
${websiteUrl}

Regards,
Fragy Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0f766e; margin-top: 0; font-size: 24px;">Fragy Verification Code</h2>
      <p style="font-size: 15px; color: #334155;">Hello,</p>
      <p style="font-size: 15px; color: #334155;">Use the following code to sign in or complete your account verification on Fragy:</p>
      
      <div style="background-color: #f0fdfa; border: 2px dashed #0f766e; padding: 18px; margin: 24px 0; border-radius: 8px; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f766e;">${otp}</span>
      </div>

      <p style="font-size: 14px; color: #64748b;">This code is valid for <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="font-size: 13px; color: #64748b; margin: 0;">Regards,<br/><strong>Fragy Team</strong></p>
    </div>
  `;

  const transport = createTransport();
  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email:otp-dev-mock] OTP for ${email}: ${otp}`);
    } else {
      console.log(`[email:otp-dev-mock] OTP sent to ${email}`);
    }
    return { mocked: true };
  }

  return sendMail({ to: email, subject, text: textBody, html: htmlBody });
}

/**
 * Sends email notifications to registered users when an announcement is published.
 * Batched and asynchronous so one failing recipient does not stop other users.
 */
async function sendAnnouncementNotification(announcement, userEmails = []) {
  if (!userEmails || userEmails.length === 0) {
    return { sentCount: 0, failedCount: 0 };
  }

  // De-duplicate and validate emails
  const cleanEmails = Array.from(
    new Set(userEmails.map((e) => String(e).toLowerCase().trim()).filter(Boolean))
  );

  const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `New Announcement from Fragy: ${announcement.title}`;

  const textBody = `Hello,

A new announcement has been posted on Fragy.

Title: ${announcement.title}

${announcement.message}

Visit Fragy to view the announcement:
${websiteUrl}

Regards,
Fragy Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #0f766e; margin-top: 0;">Fragy</h2>
      <p style="font-size: 15px; color: #334155;">Hello,</p>
      <p style="font-size: 15px; color: #334155;">A new announcement has been posted on Fragy.</p>
      
      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #0f5a54;">${announcement.title}</h3>
        <p style="margin: 0; color: #1e293b; white-space: pre-wrap; font-size: 14px;">${announcement.message}</p>
      </div>

      <p style="margin-top: 25px;">
        <a href="${websiteUrl}" style="background-color: #0f766e; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Visit Fragy</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0 15px 0;" />
      <p style="font-size: 13px; color: #64748b; margin: 0;">Regards,<br/><strong>Fragy Team</strong></p>
    </div>
  `;

  const transport = createTransport();
  if (!transport) {
    console.log(`[email:announcement-broadcast-mock] Dispatched announcement to ${cleanEmails.length} recipients.`);
    return { mocked: true, recipientCount: cleanEmails.length };
  }

  const from = process.env.EMAIL_FROM || process.env.MAIL_FROM || 'Fragy Team <noreply@fragy.local>';
  let sentCount = 0;
  let failedCount = 0;

  // Process in chunks of 50 using BCC to preserve recipient privacy
  const CHUNK_SIZE = 50;
  for (let i = 0; i < cleanEmails.length; i += CHUNK_SIZE) {
    const chunk = cleanEmails.slice(i, i + CHUNK_SIZE);
    try {
      await transport.sendMail({
        from,
        bcc: chunk,
        subject,
        text: textBody,
        html: htmlBody,
      });
      sentCount += chunk.length;
    } catch (err) {
      console.error(`[email:announcement-error] Chunk starting at ${i} failed:`, err.message);
      failedCount += chunk.length;
    }
  }

  return { sentCount, failedCount };
}

module.exports = { sendMail, sendWelcomeEmail, sendOtpEmail, sendAnnouncementNotification };
