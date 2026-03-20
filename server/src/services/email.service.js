const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `OmniWork <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    }
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return info
  } catch (err) {
    console.error('Email error:', err.message)
  }
}

const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to OmniWork',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to OmniWork, ${user.name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>You can now log in and start managing your projects and team.</p>
        <a href="${process.env.CLIENT_URL}/login"
           style="background: #6366f1; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Go to OmniWork
        </a>
        <p style="color: #6b7280; margin-top: 24px; font-size: 13px;">
          If you did not create this account please ignore this email.
        </p>
      </div>
    `
  })
}

const sendLeaveStatusEmail = async (user, leave, status) => {
  await sendEmail({
    to: user.email,
    subject: `Leave Request ${status} — OmniWork`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Leave Request ${status}</h2>
        <p>Hi ${user.name},</p>
        <p>Your leave request has been <strong>${status.toLowerCase()}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Leave Type</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${leave.leaveType}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">From</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(leave.startDate).toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">To</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(leave.endDate).toDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Total Days</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${leave.totalDays}</td>
          </tr>
        </table>
        <a href="${process.env.CLIENT_URL}/leaves"
           style="background: #6366f1; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          View Leave Details
        </a>
      </div>
    `
  })
}

const sendExpenseStatusEmail = async (user, expense, status) => {
  await sendEmail({
    to: user.email,
    subject: `Expense Request ${status} — OmniWork`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Expense Request ${status}</h2>
        <p>Hi ${user.name},</p>
        <p>Your expense request has been <strong>${status.toLowerCase()}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Title</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${expense.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Amount</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">₹${expense.amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Category</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${expense.category}</td>
          </tr>
        </table>
        <a href="${process.env.CLIENT_URL}/expenses"
           style="background: #6366f1; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          View Expense Details
        </a>
      </div>
    `
  })
}

const sendTaskAssignedEmail = async (user, task, project) => {
  await sendEmail({
    to: user.email,
    subject: `New Task Assigned — ${task.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">New Task Assigned</h2>
        <p>Hi ${user.name},</p>
        <p>A new task has been assigned to you in <strong>${project.name}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Task</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${task.title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Priority</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${task.priority}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">Due Date</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${task.dueDate ? new Date(task.dueDate).toDateString() : 'No due date'}</td>
          </tr>
        </table>
        <a href="${process.env.CLIENT_URL}/tasks/${task.id}"
           style="background: #6366f1; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          View Task
        </a>
      </div>
    `
  })
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLeaveStatusEmail,
  sendExpenseStatusEmail,
  sendTaskAssignedEmail
}