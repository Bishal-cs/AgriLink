import Notification from '../models/Notification.js';

/**
 * Create an in-app notification for a user
 */
export const createNotification = async (userId, type, message, relatedId = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      relatedId,
    });
    return notification;
  } catch (error) {
    console.error('❌ Notification creation failed:', error.message);
  }
};

/**
 * Send email notification (fire-and-forget, logs errors)
 * Actual email sending is disabled for MVP — just logs to console
 */
export const sendEmailNotification = async (to, subject, html) => {
  try {
    // MVP: Log email instead of sending
    console.log(`📧 Email notification (not sent in MVP):`);
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    // In production, use Nodemailer here
  } catch (error) {
    console.error('❌ Email notification failed:', error.message);
  }
};
