import { Request, Response, NextFunction } from "express";
import catchAsync from "./catchAsync.js";
import AppError from "./appError.js";
import { uploadToSupabase } from "./supabaseStorage.js";
import sharp from "sharp";

/**
 * Process review images and videos from base64 strings
 * Uploads them to Supabase (reviews bucket) or local storage (when using local database)
 * Replaces base64 with URLs
 */
export const processReviewMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    // Process images
    if (req.body.images && Array.isArray(req.body.images)) {
      const processedImages: string[] = [];

      for (const imageData of req.body.images) {
        // Skip if already a URL (not base64)
        if (typeof imageData === "string" && (imageData.startsWith("http") || imageData.startsWith("/"))) {
          processedImages.push(imageData);
          continue;
        }

        // Process base64 image
        if (typeof imageData === "string" && imageData.startsWith("data:image")) {
          try {
            const matches = imageData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (!matches) {
              return next(new AppError("Invalid base64 image format", 400));
            }

            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");

            const filename = `review-image-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

            // Process with Sharp and upload to reviews bucket (handles both Supabase and local storage)
            const processedBuffer = await sharp(buffer)
              .resize(800, 800, { fit: "inside", withoutEnlargement: true })
              .toFormat("webp")
              .webp({ quality: 85 })
              .toBuffer();

            const publicUrl = await uploadToSupabase(processedBuffer, filename, "images", "reviews");
            processedImages.push(publicUrl);
          } catch (error: any) {
            console.error("Error processing review image:", error);
            return next(new AppError("Error processing image: " + error.message, 400));
          }
        } else {
          processedImages.push(imageData);
        }
      }

      req.body.images = processedImages;
    }

    // Process videos
    if (req.body.videos && Array.isArray(req.body.videos)) {
      const processedVideos: string[] = [];

      for (const videoData of req.body.videos) {
        // Skip if already a URL (not base64)
        if (typeof videoData === "string" && (videoData.startsWith("http") || videoData.startsWith("/"))) {
          processedVideos.push(videoData);
          continue;
        }

        // Process base64 video
        if (typeof videoData === "string" && videoData.startsWith("data:video")) {
          try {
            const matches = videoData.match(/^data:video\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (!matches) {
              return next(new AppError("Invalid base64 video format", 400));
            }

            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");
            const ext = matches[1] || "mp4";
            const filename = `review-video-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            // Upload video to reviews bucket (handles both Supabase and local storage)
            const publicUrl = await uploadToSupabase(buffer, filename, "videos", "reviews");
            processedVideos.push(publicUrl);
          } catch (error: any) {
            console.error("Error processing review video:", error);
            return next(new AppError("Error processing video: " + error.message, 400));
          }
        } else {
          processedVideos.push(videoData);
        }
      }

      req.body.videos = processedVideos;
    }

    next();
  }
);

