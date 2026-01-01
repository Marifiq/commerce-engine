import nodemailer from 'nodemailer';
import { User } from '@prisma/client';

export interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

export default class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;

  constructor(user: Partial<User>, url: string) {
    this.to = user.email!;
    this.firstName = user.name!.split(' ')[0];
    this.url = url;
    this.from = `ShirtStore <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    // For "Real-time" delivery, we use a single SMTP configuration
    // You can use Gmail, SendGrid, Brevo, or any real SMTP service here.
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'gmail'
      host: process.env.EMAIL_HOST,       // e.g., 'smtp.sendgrid.net'
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }


  // Send the actual email
  async send(template: string, subject: string) {
    // 1) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: template, // In a real app, you might use Pug or HTML
      // html: ...
    };

    // 2) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('Welcome to the ShirtStore family!', 'Welcome to the ShirtStore!');
  }

  async sendPasswordReset() {
    await this.send(
      `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${this.firstName}.\nIf you didn't forget your password, please ignore this email!`,
      'Your password reset token (valid for only 10 minutes)'
    );
  }
}
