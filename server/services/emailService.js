const nodemailer = require('nodemailer');

/**
 * Optional email helper.
 * If SMTP is not configured, emails are logged to the console instead of sent.
 */
function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMail({ to, subject, text, html }) {
  const from = process.env.MAIL_FROM || 'NotesHub <noreply@noteshub.local>';
  const transport = createTransport();

  if (!transport) {
    console.log('[email:dev]', { to, subject, text });
    return { mocked: true };
  }

  return transport.sendMail({ from, to, subject, text, html });
}

async function sendWelcomeEmail(user) {
  return sendMail({
    to: user.email,
    subject: 'Welcome to NotesHub',
    text: `Hi ${user.name},\n\nWelcome to NotesHub! You can now browse semester materials.\n\n— NotesHub`,
    html: `<p>Hi <strong>${user.name}</strong>,</p><p>Welcome to NotesHub! You can now browse semester materials.</p><p>— NotesHub</p>`,
  });
}

module.exports = { sendMail, sendWelcomeEmail };
