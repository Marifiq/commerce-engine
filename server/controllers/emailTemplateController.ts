import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import { readFileSync } from "fs";
import { join } from "path";

// Template name to file mapping
const TEMPLATE_FILE_MAP: Record<string, string> = {
  orderConfirmation: "orderConfirmation.html",
  orderShipped: "orderShipped.html",
  abandonedCart: "abandonedCart.html",
  newsletter: "newsletter.html",
  verificationCode: "verificationCode.html",
  passwordResetCode: "passwordResetCode.html",
};

// Get default template from file
function getDefaultTemplate(name: string): { subject: string; htmlContent: string; textContent: string } {
  const fileName = TEMPLATE_FILE_MAP[name];
  if (!fileName) {
    throw new Error(`Template ${name} not found`);
  }

  const templatePath = join(process.cwd(), "templates", "emails", fileName);
  let htmlContent = "";
  let subject = "";

  try {
    htmlContent = readFileSync(templatePath, "utf-8");
    // Extract subject from template if it's in a comment or metadata
    // For now, use default subjects
    const defaultSubjects: Record<string, string> = {
      orderConfirmation: "Order Confirmation",
      orderShipped: "Your Order Has Been Shipped",
      abandonedCart: "Complete Your Purchase",
      newsletter: "Newsletter",
      verificationCode: "Verify Your Email",
      passwordResetCode: "Password Reset Code",
    };
    subject = defaultSubjects[name] || name;
  } catch (error) {
    console.error(`Error reading template file ${templatePath}:`, error);
    htmlContent = `<h1>${name}</h1><p>Template content</p>`;
    subject = name;
  }

  // Generate basic text content from HTML (simple version)
  const textContent = htmlContent
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { subject, htmlContent, textContent };
}

// Get all email templates
export const getAllEmailTemplates = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });

  // For templates that don't exist in DB, return default templates
  const templateNames = Object.keys(TEMPLATE_FILE_MAP);
  const existingNames = new Set(templates.map(t => t.name));
  const missingTemplates = templateNames
    .filter(name => !existingNames.has(name))
    .map(name => {
      const defaultTemplate = getDefaultTemplate(name);
      return {
        id: 0,
        name,
        subject: defaultTemplate.subject,
        htmlContent: defaultTemplate.htmlContent,
        textContent: defaultTemplate.textContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

  const allTemplates = [...templates, ...missingTemplates];

  res.status(200).json({
    status: "success",
    results: allTemplates.length,
    data: { templates: allTemplates },
  });
});

// Get single email template
export const getEmailTemplate = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { name } = req.params;

  let template = await prisma.emailTemplate.findUnique({
    where: { name },
  });

  // If template doesn't exist in DB, return default from file
  if (!template) {
    if (!TEMPLATE_FILE_MAP[name]) {
      return next(new AppError("Email template not found", 404));
    }

    const defaultTemplate = getDefaultTemplate(name);
    template = {
      id: 0,
      name,
      subject: defaultTemplate.subject,
      htmlContent: defaultTemplate.htmlContent,
      textContent: defaultTemplate.textContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  res.status(200).json({
    status: "success",
    data: { template },
  });
});

// Update email template
export const updateEmailTemplate = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { name } = req.params;
  const { subject, htmlContent, textContent } = req.body;

  if (!TEMPLATE_FILE_MAP[name]) {
    return next(new AppError("Invalid template name", 400));
  }

  if (!subject && !htmlContent && textContent === undefined) {
    return next(new AppError("At least one field (subject, htmlContent, textContent) is required", 400));
  }

  // Check if template exists, if not create it
  let template = await prisma.emailTemplate.findUnique({
    where: { name },
  });

  const updateData: any = {};
  if (subject !== undefined) updateData.subject = subject;
  if (htmlContent !== undefined) updateData.htmlContent = htmlContent;
  if (textContent !== undefined) updateData.textContent = textContent;

  if (template) {
    template = await prisma.emailTemplate.update({
      where: { name },
      data: updateData,
    });
  } else {
    // Get default values for fields not provided
    const defaultTemplate = getDefaultTemplate(name);
    template = await prisma.emailTemplate.create({
      data: {
        name,
        subject: subject || defaultTemplate.subject,
        htmlContent: htmlContent || defaultTemplate.htmlContent,
        textContent: textContent !== undefined ? textContent : defaultTemplate.textContent,
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: { template },
  });
});

// Preview email template with sample data
export const previewEmailTemplate = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { name } = req.params;

  let template = await prisma.emailTemplate.findUnique({
    where: { name },
  });

  // If template doesn't exist in DB, use default from file
  if (!template) {
    if (!TEMPLATE_FILE_MAP[name]) {
      return next(new AppError("Email template not found", 404));
    }
    const defaultTemplate = getDefaultTemplate(name);
    template = {
      id: 0,
      name,
      subject: defaultTemplate.subject,
      htmlContent: defaultTemplate.htmlContent,
      textContent: defaultTemplate.textContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Simple template replacement for preview (you may want to enhance this)
  let previewHtml = template.htmlContent;
  const sampleData: Record<string, any> = {
    firstName: "John",
    customerName: "John Doe",
    appName: "ShirtStore",
    orderId: "ORD-12345",
    orderDate: new Date().toLocaleDateString(),
    orderStatus: "pending",
    totalAmount: "99.99",
    supportEmail: "support@shirtstore.com",
    items: [
      { name: "Sample Product", quantity: 2, price: "49.99", total: "99.98", size: "M" },
    ],
  };

  // Simple variable replacement for preview
  Object.entries(sampleData).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    previewHtml = previewHtml.replace(regex, String(value));
  });

  res.status(200).json({
    status: "success",
    data: {
      subject: template.subject,
      htmlContent: previewHtml,
      textContent: template.textContent,
    },
  });
});

// Reset email template to default
export const resetEmailTemplate = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { name } = req.params;

  if (!TEMPLATE_FILE_MAP[name]) {
    return next(new AppError("Invalid template name", 400));
  }

  const defaultTemplate = getDefaultTemplate(name);

  // Check if template exists, delete it to reset to file-based default
  const template = await prisma.emailTemplate.findUnique({
    where: { name },
  });

  if (template) {
    await prisma.emailTemplate.delete({
      where: { name },
    });
  }

  res.status(200).json({
    status: "success",
    message: "Template reset to default",
    data: {
      template: {
        name,
        subject: defaultTemplate.subject,
        htmlContent: defaultTemplate.htmlContent,
        textContent: defaultTemplate.textContent,
      },
    },
  });
});

