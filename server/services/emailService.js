const nodemailer = require('nodemailer');

/**
 * Optional email helper using Nodemailer.
 * Configured via EMAIL_HOST/USER/PASSWORD/PORT/FROM or SMTP_HOST/USER/PASS/PORT/MAIL_FROM.
 * If SMTP is not configured, emails are logged to the console safely without failing backend tasks.
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
 * Sends email notifications to registered users when a NEW announcement is published by admin.
 */
async function sendAnnouncementNotification(announcement, userEmails = []) {
  if (!userEmails || userEmails.length === 0) {
    return { sentCount: 0 };
  }

  const websiteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const formattedDate = new Date(announcement.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const subject = `New Announcement from Fragy: ${announcement.title}`;

  const textBody = `Hello,

There is a new announcement on Fragy.

Title:
${announcement.title}

Message:
${announcement.message}

Date: ${formattedDate}

Visit Fragy:
${websiteUrl}

Thank you,
Fragy Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #0f766e; margin-top: 0;">Fragy</h2>
      <p style="font-size: 15px; color: #334155;">Hello,</p>
      <p style="font-size: 15px; color: #334155;">There is a new announcement on Fragy.</p>
      
      <div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #0f5a54;">${announcement.title}</h3>
        <p style="margin: 0; color: #1e293b; white-space: pre-wrap; font-size: 14px;">${announcement.message}</p>
        <span style="display: block; margin-top: 10px; font-size: 12px; color: #64748b;">${formattedDate}</span>
      </div>

      <p style="margin-top: 25px;">
        <a href="${websiteUrl}" style="background-color: #0f766e; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Visit Fragy Website</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0 15px 0;" />
      <p style="font-size: 13px; color: #64748b; margin: 0;">Thank you,<br/><strong>Fragy Team</strong></p>
    </div>
  `;

  const transport = createTransport();
  if (!transport) {
    console.log(`[email:announcement-broadcast-mock] Notifying ${userEmails.length} users:`, {
      subject,
      title: announcement.title,
    });
    return { mocked: true, recipientCount: userEmails.length };
  }

  // Send to recipients (BCC to protect user privacy)
  const from = process.env.EMAIL_FROM || process.env.MAIL_FROM || 'Fragy Team <noreply@fragy.local>';
  return transport.sendMail({
    from,
    bcc: userEmails,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

module.exports = { sendMail, sendWelcomeEmail, sendAnnouncementNotification };
