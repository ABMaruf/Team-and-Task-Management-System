import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email notification
export const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `TaskFlow <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

// Send task assignment notification
export const sendTaskAssignmentEmail = async (userEmail, userName, taskTitle) => {
  const html = `
    <h2>New Task Assigned</h2>
    <p>Hi ${userName},</p>
    <p>You have been assigned a new task:</p>
    <h3>${taskTitle}</h3>
    <p>Please log in to TaskFlow to view the details.</p>
    <a href="${process.env.CLIENT_URL}/tasks">View Task</a>
  `;

  await sendEmail(userEmail, 'New Task Assignment', html);
};

// Send deadline reminder
export const sendDeadlineReminder = async (userEmail, userName, taskTitle, deadline) => {
  const html = `
    <h2>Task Deadline Reminder</h2>
    <p>Hi ${userName},</p>
    <p>This is a reminder that your task deadline is approaching:</p>
    <h3>${taskTitle}</h3>
    <p>Deadline: ${new Date(deadline).toLocaleDateString()}</p>
    <a href="${process.env.CLIENT_URL}/tasks">View Task</a>
  `;

  await sendEmail(userEmail, 'Task Deadline Reminder', html);
};