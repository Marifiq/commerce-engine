import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import Email from "../utils/email.js";
import multer from "multer";
import sharp from "sharp";
import { uploadToSupabase, deleteFromSupabase } from "../utils/supabaseStorage.js";

// Multer configuration for logo uploads
const multerStorage = multer.memoryStorage();

const multerFilter = (req: Request, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for logos
  },
});

// Middleware for uploading logo
// Use upload.any() to handle both file and text fields in FormData
export const uploadLogo = upload.any();

// Process logo image
export const processLogoImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Find the logo file from req.files array (when using upload.any())
    const files = req.files as Express.Multer.File[] | undefined;
    const logoFile = files?.find((file) => file.fieldname === "logo");
    
    if (!logoFile) return next();

    const filename = `logo-${Date.now()}.webp`;

    // Process with Sharp and upload
    const processedBuffer = await sharp(logoFile.buffer)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat("webp")
      .webp({ quality: 90 })
      .toBuffer();

    const uploadedUrl = await uploadToSupabase(processedBuffer, filename, "images", "products");
    console.log("Logo uploaded successfully:", uploadedUrl);
    req.body.logoUrl = uploadedUrl;
    next();
  }
);

// Process base64 logo (for backward compatibility)
export const processBase64Logo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Skip if logo is already processed by multer
    const files = req.files as Express.Multer.File[] | undefined;
    const logoFile = files?.find((file) => file.fieldname === "logo");
    if (logoFile || req.body.logoUrl) return next();

    // Skip if no logo field in body or if it's null/undefined
    if (!req.body.appLogo || req.body.appLogo === null || req.body.appLogo === undefined) {
      return next();
    }

    // Check if logo is a base64 data URL
    if (typeof req.body.appLogo === "string" && req.body.appLogo.startsWith("data:image")) {
      try {
        // Extract base64 data and mime type
        const matches = req.body.appLogo.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches) {
          return next(new AppError("Invalid base64 image format", 400));
        }

        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const filename = `logo-${Date.now()}.webp`;

        // Process with Sharp and upload
        const processedBuffer = await sharp(buffer)
          .resize(800, 800, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFormat("webp")
          .webp({ quality: 90 })
          .toBuffer();

        req.body.logoUrl = await uploadToSupabase(processedBuffer, filename, "images", "products");
      } catch (error: any) {
        console.error("Error processing logo image:", error);
        return next(new AppError("Error processing image: " + error.message, 400));
      }
    } else if (typeof req.body.appLogo === "string" && req.body.appLogo.trim() === "") {
      // Empty string means no logo
      req.body.logoUrl = null;
    } else if (typeof req.body.appLogo === "string") {
      // Assume it's already a URL
      req.body.logoUrl = req.body.appLogo;
    }

    next();
  }
);

// Process base64 icon (favicon)
export const processBase64Icon = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Skip if no icon field in body or if it's null/undefined
    if (!req.body.appIcon || req.body.appIcon === null || req.body.appIcon === undefined) {
      return next();
    }

    // Check if icon is a base64 data URL
    if (typeof req.body.appIcon === "string" && req.body.appIcon.startsWith("data:image")) {
      try {
        // Extract base64 data and mime type
        const matches = req.body.appIcon.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches) {
          return next(new AppError("Invalid base64 image format", 400));
        }

        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const filename = `icon-${Date.now()}.webp`;

        // Process with Sharp and upload (favicon is typically smaller, so resize to 256x256)
        const processedBuffer = await sharp(buffer)
          .resize(256, 256, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFormat("webp")
          .webp({ quality: 90 })
          .toBuffer();

        req.body.iconUrl = await uploadToSupabase(processedBuffer, filename, "images", "products");
      } catch (error: any) {
        console.error("Error processing icon image:", error);
        return next(new AppError("Error processing icon: " + error.message, 400));
      }
    } else if (typeof req.body.appIcon === "string" && req.body.appIcon.trim() === "") {
      // Empty string means no icon
      req.body.iconUrl = null;
    } else if (typeof req.body.appIcon === "string") {
      // Assume it's already a URL
      req.body.iconUrl = req.body.appIcon;
    }

    next();
  }
);

// ==================== SETTINGS ====================

// Get app name (public endpoint - no auth required)
export const getAppName = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "appName" },
  });

  const appName = setting?.value || "ShirtStore";

  res.status(200).json({
    status: "success",
    data: { appName },
  });
});

// Get app logo (public endpoint - no auth required)
export const getAppLogo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "appLogo" },
  });

  const appLogo = setting?.value || null;
  console.log("Getting app logo from DB:", appLogo);

  res.status(200).json({
    status: "success",
    data: { appLogo },
  });
});

// Get app icon (public endpoint - no auth required)
export const getAppIcon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "appIcon" },
  });

  const appIcon = setting?.value || null;

  res.status(200).json({
    status: "success",
    data: { appIcon },
  });
});

// Get allow guest checkout setting (public endpoint - no auth required)
export const getAllowGuestCheckout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "allowGuestCheckout" },
  });

  // Also check requireAccount - if it's enabled, guest checkout is disabled
  const requireAccountSetting = await prisma.settings.findUnique({
    where: { key: "requireAccount" },
  });

  const requireAccount = requireAccountSetting?.value === "true";
  const allowGuestCheckout = !requireAccount && setting?.value === "true";

  res.status(200).json({
    status: "success",
    data: { allowGuestCheckout },
  });
});

// Get hero text (public endpoint - no auth required)
export const getHeroText = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "heroText" },
  });

  const heroText = setting?.value || null;

  res.status(200).json({
    status: "success",
    data: { heroText },
  });
});

// Get hero description (public endpoint - no auth required)
export const getHeroDescription = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "heroDescription" },
  });

  const heroDescription = setting?.value || null;

  res.status(200).json({
    status: "success",
    data: { heroDescription },
  });
});

// Get heading lines (public endpoint - no auth required)
export const getHeadingLines = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const setting = await prisma.settings.findUnique({
    where: { key: "headingLines" },
  });

  const headingLines = setting?.value || null;

  res.status(200).json({
    status: "success",
    data: { headingLines },
  });
});

// Get all settings
export const getSettings = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const settings = await prisma.settings.findMany({
    orderBy: { key: "asc" },
  });

  // Convert array to object for easier access
  const settingsObj: Record<string, string> = {};
  settings.forEach((setting) => {
    settingsObj[setting.key] = setting.value || "";
  });

  res.status(200).json({
    status: "success",
    data: { settings: settingsObj },
  });
});

// Get single setting
export const getSetting = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { key } = req.params;

  const setting = await prisma.settings.findUnique({
    where: { key },
  });

  if (!setting) {
    return next(new AppError("Setting not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { setting },
  });
});

// Create or update setting
export const upsertSetting = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { key, value } = req.body;

  if (!key) {
    return next(new AppError("Setting key is required", 400));
  }

  const setting = await prisma.settings.upsert({
    where: { key },
    update: { value: value || null },
    create: { key, value: value || null },
  });

  res.status(200).json({
    status: "success",
    data: { setting },
  });
});

// Update multiple settings
export const updateSettings = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  // Build settings object from req.body, excluding internal fields
  const settings: Record<string, string> = {};
  
  // Copy all fields from req.body except internal processing fields
  Object.keys(req.body).forEach(key => {
    if (key !== 'logoUrl' && key !== 'iconUrl' && key !== 'processedMedia') {
      settings[key] = req.body[key];
    }
  });

  // Handle logo URL if it was processed by middleware
  if (req.body.logoUrl !== undefined) {
    console.log("Setting logo from logoUrl:", req.body.logoUrl);
    settings.appLogo = req.body.logoUrl;
  } else if (req.body.appLogo !== undefined && req.body.logoUrl === undefined) {
    // If appLogo is sent directly (e.g., when keeping existing logo), use it
    // Only if logoUrl wasn't set by middleware (meaning no new file was uploaded)
    console.log("Setting logo from appLogo:", req.body.appLogo);
    settings.appLogo = req.body.appLogo;
  }
  
  console.log("Final settings.appLogo:", settings.appLogo);

  // Handle icon URL if it was processed by middleware
  if (req.body.iconUrl !== undefined) {
    settings.appIcon = req.body.iconUrl;
  } else if (req.body.appIcon !== undefined && req.body.iconUrl === undefined) {
    // If appIcon is sent directly (e.g., when keeping existing icon), use it
    // Only if iconUrl wasn't set by middleware (meaning no new file was uploaded)
    settings.appIcon = req.body.appIcon;
  }

  if (!settings || Object.keys(settings).length === 0) {
    return next(new AppError("Settings object is required", 400));
  }

  // Delete old logo if new one is being uploaded
  if (settings.appLogo && typeof settings.appLogo === "string" && settings.appLogo.startsWith("http")) {
    const oldSetting = await prisma.settings.findUnique({
      where: { key: "appLogo" },
    });
    
    if (oldSetting?.value && oldSetting.value !== settings.appLogo && oldSetting.value.startsWith("http")) {
      // Extract file path from old URL and delete it
      try {
        const urlMatch = oldSetting.value.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        if (urlMatch) {
          const filePath = urlMatch[1];
          await deleteFromSupabase(filePath, "products");
        }
      } catch (error) {
        console.error("Error deleting old logo:", error);
        // Continue even if deletion fails
      }
    }
  }

  // Delete old icon if new one is being uploaded
  if (settings.appIcon && typeof settings.appIcon === "string" && settings.appIcon.startsWith("http")) {
    const oldSetting = await prisma.settings.findUnique({
      where: { key: "appIcon" },
    });
    
    if (oldSetting?.value && oldSetting.value !== settings.appIcon && oldSetting.value.startsWith("http")) {
      // Extract file path from old URL and delete it
      try {
        const urlMatch = oldSetting.value.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
        if (urlMatch) {
          const filePath = urlMatch[1];
          await deleteFromSupabase(filePath, "products");
        }
      } catch (error) {
        console.error("Error deleting old icon:", error);
        // Continue even if deletion fails
      }
    }
  }

  const updates = Object.entries(settings).map(([key, value]) =>
    prisma.settings.upsert({
      where: { key },
      update: { value: value as string || null },
      create: { key, value: value as string || null },
    })
  );

  await Promise.all(updates);

  // Fetch all updated settings and format as object (same format as getSettings)
  const updatedSettingsArray = await prisma.settings.findMany({
    where: { key: { in: Object.keys(settings) } },
  });

  // Convert array to object for easier access (same format as getSettings)
  const settingsObj: Record<string, string> = {};
  updatedSettingsArray.forEach((setting) => {
    settingsObj[setting.key] = setting.value || "";
  });

  res.status(200).json({
    status: "success",
    data: { settings: settingsObj },
  });
});

// Delete setting
export const deleteSetting = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { key } = req.params;

  await prisma.settings.delete({
    where: { key },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ==================== NEWSLETTER ====================

// Get all newsletter subscribers
export const getNewsletterSubscribers = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    status: "success",
    results: subscribers.length,
    data: { subscribers },
  });
});

// Add newsletter subscriber
export const addNewsletterSubscriber = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { email, name } = req.body;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { name: name || null, isActive: true },
    create: { email, name: name || null },
  });

  res.status(200).json({
    status: "success",
    data: { subscriber },
  });
});

// Remove newsletter subscriber
export const removeNewsletterSubscriber = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await prisma.newsletterSubscriber.delete({
    where: { id: parseInt(id) },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Send newsletter email
export const sendNewsletter = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { subject, message, recipientIds } = req.body;

  if (!subject || !message) {
    return next(new AppError("Subject and message are required", 400));
  }

  let subscribers;
  if (recipientIds && Array.isArray(recipientIds) && recipientIds.length > 0) {
    // Send to specific subscribers
    subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        id: { in: recipientIds.map((id: string) => parseInt(id)) },
        isActive: true,
      },
    });
  } else {
    // Send to all active subscribers
    subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
    });
  }

  if (subscribers.length === 0) {
    return next(new AppError("No active subscribers found", 404));
  }

  // Send emails with markdown support
  const emailPromises = subscribers.map(async (subscriber) => {
    try {
      const email = new Email(
        { email: subscriber.email, name: subscriber.name || "Subscriber" },
        ""
      );
      // Use the sendNewsletter method which supports markdown
      return await email.sendNewsletter(subject, message);
    } catch (error: any) {
      console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
      // Re-throw to be caught by Promise.allSettled
      throw { subscriber: subscriber.email, error: error.message };
    }
  });

  // Use allSettled to continue even if some emails fail
  const results = await Promise.allSettled(emailPromises);
  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected');
  
  if (failed.length > 0) {
    console.error(`Failed to send ${failed.length} newsletter(s):`, failed);
    // Still return success if at least some emails were sent
    if (failed.length === subscribers.length) {
      return next(new AppError("Failed to send newsletter to all subscribers. Please check email configuration (EMAIL_HOST/EMAIL_SERVICE, EMAIL_USERNAME, EMAIL_PASSWORD).", 500));
    }
  }

  const responseMessage = failed.length > 0 
    ? `Newsletter sent to ${successful} subscriber(s), ${failed.length} failed`
    : `Newsletter sent to ${subscribers.length} subscriber(s)`;

  res.status(200).json({
    status: "success",
    message: responseMessage,
    data: { 
      sentCount: successful,
      totalCount: subscribers.length,
      failedCount: failed.length
    },
  });
});

// ==================== BANNERS ====================

// Get all banners
export const getBanners = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const banners = await prisma.banner.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  res.status(200).json({
    status: "success",
    results: banners.length,
    data: { banners },
  });
});

// Get single banner
export const getBanner = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const banner = await prisma.banner.findUnique({
    where: { id: parseInt(id) },
  });

  if (!banner) {
    return next(new AppError("Banner not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { banner },
  });
});

// Create banner
export const createBanner = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { title, description, image, link, position, isActive, order, config } = req.body;

  // Image is optional now (banners can use gradients/solid colors)
  // Only validate if background type is image in config
  if (config?.backgroundType === 'image' && !image) {
    return next(new AppError("Banner image is required when background type is image", 400));
  }

  const banner = await prisma.banner.create({
    data: {
      title: title || null,
      description: description || null,
      image: image || null,
      link: link || null,
      position: position || "top",
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      config: config || null,
    },
  });

  res.status(201).json({
    status: "success",
    data: { banner },
  });
});

// Update banner
export const updateBanner = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { title, description, image, link, position, isActive, order, config } = req.body;

  // Validate image if background type is image
  if (config?.backgroundType === 'image' && !image) {
    // Check if existing banner has image
    const existingBanner = await prisma.banner.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingBanner?.image) {
      return next(new AppError("Banner image is required when background type is image", 400));
    }
  }

  const banner = await prisma.banner.update({
    where: { id: parseInt(id) },
    data: {
      ...(title !== undefined && { title: title || null }),
      ...(description !== undefined && { description: description || null }),
      ...(image !== undefined && { image: image || null }),
      ...(link !== undefined && { link: link || null }),
      ...(position && { position }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order }),
      ...(config !== undefined && { config: config || null }),
    },
  });

  res.status(200).json({
    status: "success",
    data: { banner },
  });
});

// Delete banner
export const deleteBanner = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await prisma.banner.delete({
    where: { id: parseInt(id) },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// ==================== SOCIAL MEDIA ====================

// Get all social media links
export const getSocialMediaLinks = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const links = await prisma.socialMedia.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  res.status(200).json({
    status: "success",
    results: links.length,
    data: { links },
  });
});

// Get single social media link
export const getSocialMediaLink = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const link = await prisma.socialMedia.findUnique({
    where: { id: parseInt(id) },
  });

  if (!link) {
    return next(new AppError("Social media link not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { link },
  });
});

// Create social media link
export const createSocialMediaLink = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { platform, url, icon, isActive, order } = req.body;

  if (!platform || !url) {
    return next(new AppError("Platform and URL are required", 400));
  }

  const link = await prisma.socialMedia.create({
    data: {
      platform,
      url,
      icon: icon || null,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
    },
  });

  res.status(201).json({
    status: "success",
    data: { link },
  });
});

// Update social media link
export const updateSocialMediaLink = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { platform, url, icon, isActive, order } = req.body;

  const link = await prisma.socialMedia.update({
    where: { id: parseInt(id) },
    data: {
      ...(platform && { platform }),
      ...(url && { url }),
      ...(icon !== undefined && { icon: icon || null }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order }),
    },
  });

  res.status(200).json({
    status: "success",
    data: { link },
  });
});

// Delete social media link
export const deleteSocialMediaLink = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await prisma.socialMedia.delete({
    where: { id: parseInt(id) },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

