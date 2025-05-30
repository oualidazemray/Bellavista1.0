// lib/mail.ts

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;

  const mailOptions = {
    from: `"Bellavista" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your email - Bellavista",
    html: `
      <h2>Welcome to Bellavista</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}" style="background:#E3C08D;padding:10px 20px;color:black;border-radius:5px;text-decoration:none;">Verify Email</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
