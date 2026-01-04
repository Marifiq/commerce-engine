import nodemailer from 'nodemailer';
import { User, Order, OrderItem } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';
import prisma from '../db.js';

export interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

interface OrderItemWithProduct extends OrderItem {
  product: {
    name: string;
  };
}

// Helper function to get app name from settings
async function getAppName(): Promise<string> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'appName' },
    });
    return setting?.value || 'ShirtStore';
  } catch (error) {
    console.error('Error fetching app name from settings:', error);
    return 'ShirtStore';
  }
}

// Helper function to get app logo from settings
async function getAppLogo(): Promise<string | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'appLogo' },
    });
    const logoUrl = setting?.value || null;
    
    if (!logoUrl) return null;
    
    // If it's already a full URL (http/https), return as is
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }
    
    // If it's a relative path, convert to absolute URL
    // Use the API base URL from environment or construct from request context
    const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}${logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`}`;
  } catch (error) {
    console.error('Error fetching app logo from settings:', error);
    return null;
  }
}

// Helper function to get app icon from settings
async function getAppIcon(): Promise<string | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'appIcon' },
    });
    const iconUrl = setting?.value || null;
    
    if (!iconUrl) return null;
    
    // If it's already a full URL (http/https), return as is
    if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
      return iconUrl;
    }
    
    // If it's a base64 data URL, return as is
    if (iconUrl.startsWith('data:image')) {
      return iconUrl;
    }
    
    // If it's a relative path, convert to absolute URL
    const baseUrl = process.env.API_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3001';
    return `${baseUrl}${iconUrl.startsWith('/') ? iconUrl : `/${iconUrl}`}`;
  } catch (error) {
    console.error('Error fetching app icon from settings:', error);
    return null;
  }
}

export default class Email {
  private to: string;
  private firstName: string;
  private url: string;
  private from: string;

  constructor(user: Partial<User>, url: string = '') {
    this.to = user.email!;
    this.firstName = user.name ? user.name.split(' ')[0] : 'Customer';
    this.url = url;
    // Default from, will be updated with app name when sending
    this.from = `ShirtStore <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`;
  }

  private async updateFrom() {
    const appName = await getAppName();
    this.from = `${appName} <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`;
  }

  newTransport() {
    // Validate email configuration
    if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE) {
      throw new Error('Email configuration missing: EMAIL_HOST or EMAIL_SERVICE must be set');
    }
    if (!process.env.EMAIL_USERNAME) {
      throw new Error('Email configuration missing: EMAIL_USERNAME must be set');
    }
    if (!process.env.EMAIL_PASSWORD) {
      throw new Error('Email configuration missing: EMAIL_PASSWORD must be set');
    }

    // For "Real-time" delivery, we use a single SMTP configuration
    // You can use Gmail, SendGrid, Brevo, or any real SMTP service here.
    const transportConfig: any = {
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for 587
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    // Use service if provided, otherwise use host
    if (process.env.EMAIL_SERVICE) {
      transportConfig.service = process.env.EMAIL_SERVICE;
    } else {
      transportConfig.host = process.env.EMAIL_HOST;
    }

    return nodemailer.createTransport(transportConfig);
  }

  // Simple template replacement function
  private replaceTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    
    // Handle each loops first (before other replacements)
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = data[arrayName] || [];
      return array.map((item: any) => {
        let itemContent = content;
        // Replace this.key with item values
        Object.entries(item).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{this\\.${key}\\}\\}`, 'g');
          itemContent = itemContent.replace(regex, String(value || ''));
        });
        return itemContent;
      }).join('');
    });
    
    // Handle conditional blocks
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    });
    
    // Replace simple variables
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value || ''));
    }
    
    return result;
  }

  // Send the actual email
  async send(template: string, subject: string, html?: string) {
    // Update from field with current app name
    await this.updateFrom();
    
    // Validate recipient email
    if (!this.to || !this.to.includes('@')) {
      throw new Error(`Invalid recipient email: ${this.to}`);
    }
    
    // 1) Define email options
    const mailOptions: any = {
      from: this.from,
      to: this.to,
      subject,
      text: template,
    };

    if (html) {
      mailOptions.html = html;
    }

    // 2) Create a transport and send email
    try {
      const transport = this.newTransport();
      const info = await transport.sendMail(mailOptions);
      console.log('Email sent successfully:', {
        to: this.to,
        subject,
        messageId: info.messageId,
      });
      return info;
    } catch (error: any) {
      console.error('Failed to send email:', {
        to: this.to,
        subject,
        error: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  async sendWelcome() {
    const appName = await getAppName();
    await this.send(`Welcome to the ${appName} family!`, `Welcome to ${appName}!`);
  }

  async sendPasswordReset() {
    await this.send(
      `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${this.firstName}.\nIf you didn't forget your password, please ignore this email!`,
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  async sendVerificationCode(code: string) {
    try {
      const appName = await getAppName();
      const appIcon = await getAppIcon();
      const templatePath = join(process.cwd(), 'templates', 'emails', 'verificationCode.html');
      let template = readFileSync(templatePath, 'utf-8');

      const templateData = {
        firstName: this.firstName,
        code: code,
        appName: appName,
        appIcon: appIcon || '',
        supportEmail: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'support@shirtstore.com',
      };

      const html = this.replaceTemplate(template, templateData);
      const text = `Hello ${this.firstName},\n\nYour email verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\n${appName} Team`;

      await this.send(text, `Verify Your Email - ${appName}`, html);
    } catch (error) {
      console.error('Error sending verification code email:', error);
      // Fallback to plain text if template fails
      const appName = await getAppName();
      const message = `Hello ${this.firstName},\n\nYour email verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\n${appName} Team`;
      await this.send(message, `Verify Your Email - ${appName}`);
    }
  }

  async sendPasswordResetCode(code: string) {
    try {
      const appName = await getAppName();
      const appIcon = await getAppIcon();
      const templatePath = join(process.cwd(), 'templates', 'emails', 'passwordResetCode.html');
      let template = readFileSync(templatePath, 'utf-8');

      const templateData = {
        firstName: this.firstName,
        code: code,
        appName: appName,
        appIcon: appIcon || '',
        supportEmail: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'support@shirtstore.com',
      };

      const html = this.replaceTemplate(template, templateData);
      const text = `Hello ${this.firstName},\n\nYour password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\n${appName} Team`;

      await this.send(text, `Password Reset Code - ${appName}`, html);
    } catch (error) {
      console.error('Error sending password reset code email:', error);
      // Fallback to plain text if template fails
      const appName = await getAppName();
      const message = `Hello ${this.firstName},\n\nYour password reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nBest regards,\n${appName} Team`;
      await this.send(message, `Password Reset Code - ${appName}`);
    }
  }

  async sendOrderConfirmation(order: Order & { items: OrderItemWithProduct[] }, user: Partial<User>) {
    try {
      const appName = await getAppName();
      const appIcon = await getAppIcon();
      const templatePath = join(process.cwd(), 'templates', 'emails', 'orderConfirmation.html');
      let template = readFileSync(templatePath, 'utf-8');

      const items = order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: (item.price * item.quantity).toFixed(2),
        size: item.size || '',
      }));

      const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const templateData = {
        customerName: user.name || this.firstName,
        orderId: `ORD-${order.id}`,
        orderDate: orderDate,
        orderStatus: order.status,
        phoneNumber: order.phoneNumber || '',
        shippingAddress: order.shippingAddress || '',
        paymentMethod: order.paymentMethod || '',
        items: items,
        totalAmount: order.totalAmount.toFixed(2),
        supportEmail: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'support@shirtstore.com',
        appName: appName,
        appIcon: appIcon || '',
      };

      const html = this.replaceTemplate(template, templateData);
      const text = `Dear ${user.name},\n\nThank you for your order! Your order #${order.id} has been confirmed and is currently ${order.status}.\n\nOrder Total: $${order.totalAmount.toFixed(2)}\n\nYour order will be shipped soon. To track your order, visit your profile or contact us at ${templateData.supportEmail}.\n\nThank you for shopping with ${appName}!`;

      await this.send(text, `Order Confirmation - Order #${order.id}`, html);
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      // Don't throw - email failure shouldn't break order creation
    }
  }

  async sendOrderShipped(order: Order & { items: OrderItemWithProduct[] }, user: Partial<User>) {
    try {
      const appName = await getAppName();
      const appIcon = await getAppIcon();
      const templatePath = join(process.cwd(), 'templates', 'emails', 'orderShipped.html');
      let template = readFileSync(templatePath, 'utf-8');

      const items = order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: (item.price * item.quantity).toFixed(2),
        size: item.size || '',
      }));

      const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const shippedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Calculate estimated delivery date if estimatedDeliveryDays is provided
      let estimatedDeliveryDate = '';
      let estimatedDeliveryText = '';
      if (order.estimatedDeliveryDays) {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + order.estimatedDeliveryDays);
        estimatedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        if (order.estimatedDeliveryDays === 1) {
          estimatedDeliveryText = 'within 1 day';
        } else {
          estimatedDeliveryText = `within ${order.estimatedDeliveryDays} days`;
        }
      }

      const templateData = {
        customerName: user.name || this.firstName,
        orderId: `ORD-${order.id}`,
        orderDate: orderDate,
        shippedDate: shippedDate,
        estimatedDeliveryDate: estimatedDeliveryDate,
        estimatedDeliveryText: estimatedDeliveryText,
        shippingAddress: order.shippingAddress || '',
        items: items,
        totalAmount: order.totalAmount.toFixed(2),
        supportEmail: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'support@shirtstore.com',
        appName: appName,
        appIcon: appIcon || '',
      };

      const html = this.replaceTemplate(template, templateData);
      const deliveryInfo = estimatedDeliveryText 
        ? `\n\nEstimated Delivery: ${estimatedDeliveryText} (by ${estimatedDeliveryDate})`
        : '';
      const text = `Dear ${user.name},\n\nGreat news! Your order #${order.id} has been shipped and is on its way to you!${deliveryInfo}\n\nYou can track your order in your profile or contact us at ${templateData.supportEmail}.\n\nThank you for shopping with ${appName}!`;

      await this.send(text, `Your Order Has Been Shipped - Order #${order.id}`, html);
    } catch (error) {
      console.error('Error sending order shipped email:', error);
      // Don't throw - email failure shouldn't break order update
    }
  }

  async sendAbandonedCartEmail(
    cartItems: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
      size?: string;
      image: string;
    }>,
    totalAmount: number,
    cartUrl: string
  ) {
    try {
      console.log('Preparing to send abandoned cart email to:', this.to);
      
      const appName = await getAppName();
      const appIcon = await getAppIcon();
      const templatePath = join(process.cwd(), 'templates', 'emails', 'abandonedCart.html');
      let template = readFileSync(templatePath, 'utf-8');

      // Resolve image URLs to absolute URLs
      const items = cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: item.total.toFixed(2),
        size: item.size || '',
        image: item.image.startsWith('http') 
          ? item.image 
          : `${process.env.FRONTEND_URL || process.env.API_BASE_URL || 'http://localhost:3000'}${item.image.startsWith('/') ? item.image : `/${item.image}`}`,
      }));

      const templateData = {
        customerName: this.firstName,
        items: items,
        totalAmount: totalAmount.toFixed(2),
        cartUrl: cartUrl,
        appName: appName,
        appIcon: appIcon || '',
        supportEmail: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'support@shirtstore.com',
      };

      const html = this.replaceTemplate(template, templateData);
      const text = `Hi ${this.firstName},\n\nWe noticed you left some items in your cart! Complete your purchase now.\n\nTotal: $${totalAmount.toFixed(2)}\n\nVisit: ${cartUrl}\n\nThank you,\n${appName} Team`;

      await this.send(text, `Complete Your Order - ${appName}`, html);
      console.log('Abandoned cart email sent successfully to:', this.to);
    } catch (error: any) {
      console.error('Error sending abandoned cart email:', {
        to: this.to,
        error: error.message,
        stack: error.stack,
      });
      // Re-throw the error so the controller can handle it
      throw new Error(`Failed to send abandoned cart email: ${error.message}`);
    }
  }

  async sendNewsletter(subject: string, markdownContent: string) {
    try {
      const appName = await getAppName();
      const appIcon = await getAppIcon();
      const templatePath = join(process.cwd(), 'templates', 'emails', 'newsletter.html');
      let template = readFileSync(templatePath, 'utf-8');

      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      // Convert markdown to HTML
      const htmlContent = marked.parse(markdownContent);

      const currentYear = new Date().getFullYear();

      const templateData = {
        subject: subject,
        content: htmlContent,
        appName: appName,
        appIcon: appIcon || '',
        supportEmail: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'support@shirtstore.com',
        currentYear: currentYear,
      };

      const html = this.replaceTemplate(template, templateData);
      const text = markdownContent.replace(/#{1,6}\s+/g, '').replace(/\*\*/g, '').replace(/\*/g, '');

      await this.send(text, subject, html);
    } catch (error: any) {
      console.error('Error sending newsletter email:', error);
      // Fallback to plain text if template fails
      await this.send(markdownContent, subject);
    }
  }
}
