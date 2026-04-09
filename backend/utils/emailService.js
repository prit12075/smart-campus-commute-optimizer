const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
};

const sendOTPEmail = async (to, otp, name = 'Student') => {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.EMAIL_FROM || `"Smart Campus" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Smart Campus Login OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f0f4f8; padding: 20px;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Smart Campus</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">SRM AP University</p>
          </div>
          <div style="padding:32px;">
            <p style="color:#374151;font-size:16px;">Hello <strong>${name}</strong>,</p>
            <p style="color:#6b7280;">Use the OTP below to log in to Smart Campus. It expires in <strong>10 minutes</strong>.</p>
            <div style="background:#f5f3ff;border:2px dashed #8b5cf6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#6366f1;">${otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:13px;">If you didn't request this, please ignore this email. Do not share this OTP with anyone.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Smart Campus · SRM AP University · Amaravati</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

const sendWelcomeEmail = async (to, name) => {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.EMAIL_FROM || `"Smart Campus" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to Smart Campus!',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; background: #f0f4f8; padding: 20px;">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Welcome to Smart Campus!</h1>
          </div>
          <div style="padding:32px;">
            <p style="color:#374151;font-size:16px;">Hey <strong>${name}</strong> 👋</p>
            <p style="color:#6b7280;">You're now part of the Smart Campus community at SRM AP. Find ride-sharing partners, save time, and commute smarter!</p>
            <p style="color:#6b7280;">Complete your profile to get started and find your perfect commute match.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
};

module.exports = { sendOTPEmail, sendWelcomeEmail };
