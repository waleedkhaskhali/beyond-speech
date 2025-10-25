import nodemailer from 'nodemailer';
import { EmailTemplate } from '../types';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(template: EmailTemplate): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: template.to,
        subject: template.subject,
        html: template.template,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${template.to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - Beyond Speech</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">Beyond Speech</h1>
            </div>
            
            <h2>Welcome to Beyond Speech, ${firstName}!</h2>
            
            <p>Thank you for registering with Beyond Speech. To complete your registration and start connecting with speech therapy providers, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #8B5CF6, #EC4899); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            
            <p>This link will expire in 24 hours for security reasons.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              If you didn't create an account with Beyond Speech, please ignore this email.
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              The Beyond Speech Team
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Beyond Speech',
      template,
      data: { firstName, verificationUrl }
    });
  }

  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - Beyond Speech</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">Beyond Speech</h1>
            </div>
            
            <h2>Password Reset Request</h2>
            
            <p>Hello ${firstName},</p>
            
            <p>We received a request to reset your password for your Beyond Speech account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #8B5CF6, #EC4899); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <p>This link will expire in 1 hour for security reasons.</p>
            
            <p><strong>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              The Beyond Speech Team
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Beyond Speech',
      template,
      data: { firstName, resetUrl }
    });
  }

  async sendAppointmentConfirmation(email: string, firstName: string, appointmentData: any): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Confirmed - Beyond Speech</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">Beyond Speech</h1>
            </div>
            
            <h2>Appointment Confirmed</h2>
            
            <p>Hello ${firstName},</p>
            
            <p>Your appointment has been confirmed! Here are the details:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Appointment Details</h3>
              <p><strong>Service:</strong> ${appointmentData.serviceType}</p>
              <p><strong>Date & Time:</strong> ${appointmentData.startTime}</p>
              <p><strong>Duration:</strong> ${appointmentData.duration} minutes</p>
              <p><strong>Location:</strong> ${appointmentData.isRemote ? 'Remote (link will be provided)' : appointmentData.location}</p>
              <p><strong>Provider:</strong> ${appointmentData.providerName}</p>
            </div>
            
            ${appointmentData.isRemote ? `
              <p><strong>Meeting Link:</strong> <a href="${appointmentData.meetingLink}">${appointmentData.meetingLink}</a></p>
            ` : ''}
            
            <p>Please arrive 5 minutes early for your appointment. If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              The Beyond Speech Team
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Appointment Confirmed - Beyond Speech',
      template,
      data: { firstName, appointmentData }
    });
  }

  async sendAppointmentReminder(email: string, firstName: string, appointmentData: any): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Appointment Reminder - Beyond Speech</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">Beyond Speech</h1>
            </div>
            
            <h2>Appointment Reminder</h2>
            
            <p>Hello ${firstName},</p>
            
            <p>This is a friendly reminder about your upcoming appointment:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Appointment Details</h3>
              <p><strong>Service:</strong> ${appointmentData.serviceType}</p>
              <p><strong>Date & Time:</strong> ${appointmentData.startTime}</p>
              <p><strong>Duration:</strong> ${appointmentData.duration} minutes</p>
              <p><strong>Location:</strong> ${appointmentData.isRemote ? 'Remote' : appointmentData.location}</p>
              <p><strong>Provider:</strong> ${appointmentData.providerName}</p>
            </div>
            
            ${appointmentData.isRemote ? `
              <p><strong>Meeting Link:</strong> <a href="${appointmentData.meetingLink}">${appointmentData.meetingLink}</a></p>
            ` : ''}
            
            <p>We look forward to seeing you soon!</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              The Beyond Speech Team
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Appointment Reminder - Beyond Speech',
      template,
      data: { firstName, appointmentData }
    });
  }

  async sendExistingUserEmail(email: string, firstName: string, role: string): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome Back - Beyond Speech</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">Beyond Speech</h1>
            </div>
            
            <h2>Welcome Back, ${firstName}!</h2>
            
            <p>We noticed you already have an account with Beyond Speech. You can log in to your existing account to continue using our services.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="background: linear-gradient(135deg, #8B5CF6, #EC4899); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                Log In to Your Account
              </a>
            </div>
            
            <p>If you forgot your password, you can reset it using the "Forgot Password" link on the login page.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              The Beyond Speech Team
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome Back - Beyond Speech',
      template,
      data: { firstName, role }
    });
  }

  async sendAdminNotification(email: string, name: string, role: string, message?: string): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Submission - Beyond Speech</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>New Contact Form Submission</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Contact Details</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Role:</strong> ${role}</p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            </div>
            
            <p>Please follow up with this contact within 1-2 business days.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/admin" 
                 style="background: linear-gradient(135deg, #8B5CF6, #EC4899); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                View in Admin Panel
              </a>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: process.env.ADMIN_EMAIL || 'wkhaskhalu@gmail.com',
      subject: `New ${role} Contact: ${name}`,
      template,
      data: { name, email, role, message }
    });
  }

  async sendWelcomeEmail(email: string, firstName: string, role: string): Promise<void> {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Beyond Speech</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #8B5CF6; margin: 0;">Beyond Speech</h1>
            </div>
            
            <h2>Welcome to Beyond Speech, ${firstName}!</h2>
            
            <p>Thank you for joining our community. We're excited to help you connect with quality speech therapy services.</p>
            
            <p>As a ${role.toLowerCase()}, you now have access to:</p>
            <ul>
              <li>Connect with qualified speech therapy providers</li>
              <li>Schedule appointments that fit your schedule</li>
              <li>Access to our secure messaging system</li>
              <li>Track your progress and goals</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #8B5CF6, #EC4899); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                Get Started
              </a>
            </div>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              The Beyond Speech Team
            </p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Beyond Speech',
      template,
      data: { firstName, role }
    });
  }
}

export const emailService = new EmailService();
