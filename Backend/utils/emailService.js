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

const renderLinks = (links, label) => {
  if (!Array.isArray(links) || links.length === 0) return '';
  const buttonStyle =
    'display:inline-block;padding:10px 16px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;';
  return links
    .map((link) => {
      let host = '';
      try {
        host = new URL(link).host;
      } catch (error) {
        host = '';
      }
      return `
        <p><a href="${link}" style="${buttonStyle}">${label}</a></p>
        ${host ? `<p style="font-size:12px;color:#6b7280;margin-top:-6px;">${host}</p>` : ''}
      `;
    })
    .join('');
};

export const sendVerificationEmail = async (userEmail, userName, verifyLinks) => {
  const html = `
    <h2>Verify your email</h2>
    <p>Hi ${userName || 'there'},</p>
    <p>Thanks for signing up for TaskFlow. Please verify your email to activate your account.</p>
    ${renderLinks(verifyLinks, 'Verify Email')}
    <p>If the button doesn't work, copy and paste the link into your browser.</p>
  `;

  await sendEmail(userEmail, 'Verify your TaskFlow email', html);
};

export const sendProjectInviteEmail = async (userEmail, projectName, inviterName, inviteLinks, role) => {
  const html = `
    <h2>You're invited to a project</h2>
    <p>${inviterName || 'Someone'} invited you to join <strong>${projectName}</strong> as ${role}.</p>
    ${renderLinks(inviteLinks, 'Accept')}
    <p>If you haven't created an account yet, sign up with this email first.</p>
  `;

  await sendEmail(userEmail, `Project invite: ${projectName}`, html);
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
