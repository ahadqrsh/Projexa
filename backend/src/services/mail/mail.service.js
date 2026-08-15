import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { renderTemplate } from './templates.js';

/**
 * Email delivery.
 *
 * When SMTP is not configured we log the message (including the verification link)
 * instead of throwing. A student cloning this repo can complete the entire signup
 * and password-reset flow with zero email setup — the link is right there in the
 * terminal. Registration must never fail because a mail server is unreachable.
 */
let transporter = null;

const getTransporter = () => {
  if (!env.smtpEnabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
};

const send = async ({ to, subject, html, text }) => {
  const tx = getTransporter();

  if (!tx) {
    logger.warn(`[mail:console] To: ${to} | Subject: ${subject}`);
    logger.warn(`[mail:console] ${text}`);
    return { delivered: false, reason: 'smtp-not-configured' };
  }

  try {
    const info = await tx.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
    });
    logger.info(`Email sent to ${to} (${info.messageId})`);
    return { delivered: true, messageId: info.messageId };
  } catch (error) {
    // Log and continue: a failed email must not fail the user's request.
    logger.error(`Email to ${to} failed: ${error.message}`);
    return { delivered: false, reason: error.message };
  }
};

export const sendVerificationEmail = ({ to, name, token }) => {
  const link = `${env.CLIENT_URL}/verify-email/${token}`;
  return send({
    to,
    subject: `Verify your ${env.APP_NAME} account`,
    ...renderTemplate('verifyEmail', { name, link, appName: env.APP_NAME }),
  });
};

export const sendPasswordResetEmail = ({ to, name, token }) => {
  const link = `${env.CLIENT_URL}/reset-password/${token}`;
  return send({
    to,
    subject: `Reset your ${env.APP_NAME} password`,
    ...renderTemplate('resetPassword', {
      name,
      link,
      appName: env.APP_NAME,
      minutes: env.PASSWORD_RESET_EXPIRES_MINUTES,
    }),
  });
};

export const sendMentorInviteEmail = ({ to, mentorName, studentName, projectTitle, projectId }) => {
  const link = `${env.CLIENT_URL}/mentor/projects/${projectId}`;
  return send({
    to,
    subject: `${studentName} invited you to mentor "${projectTitle}"`,
    ...renderTemplate('mentorInvite', {
      mentorName,
      studentName,
      projectTitle,
      link,
      appName: env.APP_NAME,
    }),
  });
};

export default { sendVerificationEmail, sendPasswordResetEmail, sendMentorInviteEmail };
