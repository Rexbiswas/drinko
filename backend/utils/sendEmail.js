const nodemailer = require('nodemailer');
const sendEmail = async (options) => {
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER;
  const hasGmailConfig = process.env.GMAIL_USER && process.env.GMAIL_PASS;

  let transporter;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else if (hasGmailConfig) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  } else {
    // If no SMTP configured, try to create an Ethereal test account or log to console
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (e) {
      console.warn('[sendEmail] Ethereal account creation failed, fallback to console logger.');
      transporter = null;
    }
  }

  const mailOptions = {
    from: `${process.env.FROM_NAME || 'Drinko Artisan Café'} <${process.env.FROM_EMAIL || 'support@drinkocafe.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || `<div style="font-family: sans-serif; padding: 20px;">${options.message}</div>`
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[sendEmail] Message sent to ${options.email}: %s`, info.messageId);
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[sendEmail] Preview URL: ${previewUrl}`);
      }
      return { success: true, messageId: info.messageId, previewUrl };
    } catch (sendErr) {
      console.error('[sendEmail] Transporter failed:', sendErr.message);
      // Don't crash; let caller know
      return { success: false, error: sendErr.message };
    }
  } else {
    console.log(`[sendEmail Simulated] To: ${options.email} | Subject: ${options.subject}`);
    return { success: true, simulated: true };
  }
};

module.exports = sendEmail;
