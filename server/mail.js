/**
 * Envío de correos transaccionales.
 * Opción A: Resend (https://resend.com) — RESEND_API_KEY + MAIL_FROM
 * Opción B: SMTP — SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM (y opcional SMTP_SECURE=true)
 */
async function sendTransactionalMail({ to, subject, html, text }) {
  const toNorm = String(to || '').trim();
  if (!toNorm) throw new Error('Destinatario vacío');
  const from = String(process.env.MAIL_FROM || '').trim();
  if (!from) {
    throw new Error('Configura MAIL_FROM en .env (ej: Delivery <onboarding@tudominio.com> en Resend).');
  }

  const htmlBody = html || (text ? `<pre style="font-family:sans-serif">${escapeHtml(text)}</pre>` : '');
  const textBody = text || '';

  const resendKey = String(process.env.RESEND_API_KEY || '').trim();
  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [toNorm],
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      throw new Error(`Resend (${res.status}): ${raw}`);
    }
    return;
  }

  const smtpHost = String(process.env.SMTP_HOST || '').trim();
  if (smtpHost) {
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth:
        process.env.SMTP_USER || process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || '',
            }
          : undefined,
    });
    await transporter.sendMail({
      from,
      to: toNorm,
      subject,
      text: textBody || undefined,
      html: htmlBody || undefined,
    });
    return;
  }

  throw new Error(
    'No hay proveedor de correo: define RESEND_API_KEY + MAIL_FROM, o SMTP_HOST (+ SMTP_USER/SMTP_PASS) + MAIL_FROM en .env'
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendTransactionalMail };
