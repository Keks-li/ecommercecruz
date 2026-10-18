import nodemailer from 'nodemailer';

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = port === 465;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return transporter;
  }

  // Fallback for development if SMTP not configured:
  // Try Ethereal or provide resilient console logger
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return transporter;
  } catch (err) {
    transporter = {
      sendMail: async (options) => {
        console.log('\n======================================================');
        console.log('📧 [MOCK EMAIL DELIVERED]');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Link:\n${options.text}`);
        console.log('======================================================\n');
        return { messageId: 'mock-' + Date.now() };
      },
    };
    return transporter;
  }
}

export async function sendEmailConfirmation({ to, confirmationUrl, adminName = 'Administrator' }) {
  const t = await getTransporter();
  const from = process.env.SMTP_FROM || '"Cruzaro Admin" <security@cruzaro.com>';

  const subject = 'Action Required: Confirm Your New Cruzaro Admin Email';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirm Your Admin Email</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 24px; }
        .logo span { color: #2563eb; }
        h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; }
        .btn-container { margin: 28px 0; text-align: center; }
        .btn { display: inline-block; background-color: #0f172a; color: #ffffff !important; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .alt-link { font-size: 12px; color: #64748b; word-break: break-all; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; margin-top: 20px; }
        .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">CRUZARO<span>.</span> ADMIN</div>
        <h1>Confirm Your New Email Address</h1>
        <p>Hello ${adminName},</p>
        <p>A request was received to update the email address for your Cruzaro Administrator account to <strong>${to}</strong>.</p>
        <p>To confirm this change and activate your new email, please click the button below:</p>
        <div class="btn-container">
          <a href="${confirmationUrl}" class="btn" style="color: #ffffff;">Confirm Email Address</a>
        </div>
        <p>This verification link is valid for <strong>24 hours</strong>. If you did not request this change, please ignore this email and verify your security settings.</p>
        <div class="alt-link">
          Direct verification link:<br/>
          <a href="${confirmationUrl}" style="color: #2563eb;">${confirmationUrl}</a>
        </div>
        <div class="footer">
          Cruzaro E-Commerce Platform • Security & Authentication Service
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${adminName},

A request was made to update your Cruzaro Admin email address to ${to}.

Please confirm this change by opening the following link in your browser:
${confirmationUrl}

This link will expire in 24 hours. If you did not request this, please secure your account immediately.
  `.trim();

  const info = await t.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL CONFIRMATION DISPATCHED]`);
  console.log(`Recipient: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Confirmation URL: ${confirmationUrl}`);
  if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
    console.log(`Ethereal Web Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
  console.log(`======================================================\n`);

  return info;
}
