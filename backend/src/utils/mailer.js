import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    });
  }
  return transporter;
}

/**
 * Send an email. Uses SMTP when configured (SMTP_HOST); otherwise logs the
 * message so flows like password reset still work in development.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`\n📧 [dev mailer] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false, logged: true };
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@vibe-todo.local',
    to,
    subject,
    text,
    html
  });
  return { delivered: true };
}
