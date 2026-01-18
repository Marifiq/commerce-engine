import { createClient } from "@supabase/supabase-js";
import AppError from "./appError.js";
import fs from "fs/promises";
import path from "path";
import { getDatabaseConfig } from "./dbConfig.js";

// Initialize Supabase client
// Support multiple env variable names for flexibility
let supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || process.env.SUPABASE_SECRET_KEY 
  || process.env.SUPABASE_ANON_KEY;

// If URL points to storage endpoint, extract project URL
if (supabaseUrl && supabaseUrl.includes('.storage.supabase.co')) {
  // Extract project ref from storage URL: https://[project-ref].storage.supabase.co/...
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.storage\.supabase\.co/);
  if (match) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

// If still no URL, try to construct from DATABASE_URL
if (!supabaseUrl && process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const match = dbUrl.match(/@([^.]+)\.(supabase\.co|pooler\.supabase\.com)/);
  if (match) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found. File uploads will use local storage.");
  console.warn("Required: SUPABASE_URL (or extract from DATABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
  console.warn("Get your Service Role Key from: Supabase Dashboard > Settings > API > service_role key");
} else if (!supabaseKey.startsWith('eyJ') || supabaseKey.split('.').length !== 3) {
  console.warn("⚠️  Invalid Supabase Service Role Key format!");
  console.warn("The key must be a JWT token (starts with 'eyJ', ~200+ chars)");
  console.warn("Get your Service Role Key from: Supabase Dashboard > Settings > API > service_role key");
  console.warn("File uploads will use local storage.");
}

const supabase = supabaseUrl && supabaseKey && supabaseKey.startsWith('eyJ') && supabaseKey.split('.').length === 3
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Bucket names - can be overridden via environment variables
const PRODUCTS_BUCKET = process.env.SUPABASE_PRODUCTS_BUCKET || process.env.SUPABASE_BUCKET_NAME || "products";
const REVIEWS_BUCKET = process.env.SUPABASE_REVIEWS_BUCKET || "reviews";
const MESSAGES_BUCKET = process.env.SUPABASE_MESSAGES_BUCKET || "messages";

/**
 * Upload a file buffer to Supabase Storage or local storage
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name of the file
 * @param folder - The folder path in the bucket (e.g., "images" or "videos")
 * @param bucketType - The bucket type: "products" or "reviews" (default: "products")
 * @returns The public URL of the uploaded file
 */
export const uploadToSupabase = async (
  fileBuffer: Buffer,
  fileName: string,
  folder: "images" | "videos",
  bucketType: "products" | "reviews" = "products"
): Promise<string> => {
  // Check if using local database
  const dbConfig = getDatabaseConfig();
  const useLocalStorage = dbConfig.isLocal;

  // If using local database, save to local public folder
  if (useLocalStorage) {
    let localDir: string;
    let urlPath: string;

    if (bucketType === "reviews") {
      // Reviews: public/img/reviews/ for images, public/img/review-videos/ for videos
      localDir = folder === "images" ? "public/img/reviews" : "public/img/review-videos";
      urlPath = folder === "images" ? `/img/reviews/${fileName}` : `/img/review-videos/${fileName}`;
    } else {
      // Products: public/img/products/ for images, public/img/videos/ for videos
      localDir = folder === "images" ? "public/img/products" : "public/img/videos";
      urlPath = folder === "images" ? `/img/products/${fileName}` : `/img/videos/${fileName}`;
    }

    try {
      await fs.mkdir(localDir, { recursive: true });
      await fs.writeFile(path.join(localDir, fileName), fileBuffer);
      return urlPath;
    } catch (error: any) {
      throw new AppError(`Failed to save file to local storage: ${error.message}`, 500);
    }
  }

  // Use Supabase for remote database
  if (!supabase) {
    throw new AppError("Supabase is not configured. Please set SUPABASE_URL (or it will be extracted from DATABASE_URL) and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in your .env file.", 500);
  }

  // Determine bucket name based on bucketType
  const bucketName = bucketType === "reviews" ? REVIEWS_BUCKET : PRODUCTS_BUCKET;

  const filePath = `${folder}/${fileName}`;
  const contentType = folder === "images" ? "image/webp" : "video/mp4";

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      throw new AppError(`Failed to upload file to Supabase: ${error.message}`, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new AppError("Failed to get public URL from Supabase", 500);
    }

    return urlData.publicUrl;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Supabase upload error: ${error.message}`, 500);
  }
};

/**
 * Delete a file from Supabase Storage or local storage
 * @param filePath - The path of the file to delete (e.g., "images/product-123.webp" for Supabase, or URL path for local)
 * @param bucketType - The bucket type: "products" or "reviews" (default: "products")
 */
export const deleteFromSupabase = async (
  filePath: string,
  bucketType: "products" | "reviews" = "products"
): Promise<void> => {
  // Check if using local database
  const dbConfig = getDatabaseConfig();
  const useLocalStorage = dbConfig.isLocal;

  // If using local database, delete from local filesystem
  if (useLocalStorage) {
    // filePath might be a URL path like "/img/products/image.webp"
    if (filePath.startsWith("/img/")) {
      try {
        const fullPath = path.join("public", filePath);
        await fs.unlink(fullPath).catch(() => {
          // Ignore errors if file doesn't exist
        });
      } catch (error: any) {
        console.error(`Failed to delete local file: ${error.message}`);
      }
    }
    return;
  }

  // Use Supabase for remote database
  if (!supabase) {
    return; // Silently fail if Supabase not configured
  }

  // Determine bucket name based on bucketType
  const bucketName = bucketType === "reviews" ? REVIEWS_BUCKET : PRODUCTS_BUCKET;

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error(`Failed to delete file from Supabase: ${error.message}`);
    }
  } catch (error: any) {
    console.error(`Supabase delete error: ${error.message}`);
  }
};

/**
 * Upload message attachment (images, documents, videos)
 * @param fileBuffer - The file buffer to upload
 * @param fileName - The name of the file
 * @param fileType - The type of file: "image", "document", "video"
 * @returns The public URL of the uploaded file
 */
export const uploadMessageAttachment = async (
  fileBuffer: Buffer,
  fileName: string,
  fileType: "image" | "document" | "video"
): Promise<string> => {
  const dbConfig = getDatabaseConfig();
  const useLocalStorage = dbConfig.isLocal;

  if (useLocalStorage) {
    const localDir = "public/img/messages";
    const urlPath = `/img/messages/${fileName}`;

    try {
      await fs.mkdir(localDir, { recursive: true });
      await fs.writeFile(path.join(localDir, fileName), fileBuffer);
      return urlPath;
    } catch (error: any) {
      throw new AppError(`Failed to save file to local storage: ${error.message}`, 500);
    }
  }

  if (!supabase) {
    throw new AppError("Supabase is not configured", 500);
  }

  const folder = fileType === "image" ? "images" : fileType === "video" ? "videos" : "documents";
  const filePath = `${folder}/${fileName}`;
  
  // Determine content type
  const ext = fileName.split('.').pop()?.toLowerCase();
  const contentTypeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    mp4: "video/mp4",
  };
  const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

  try {
    const { data, error } = await supabase.storage
      .from(MESSAGES_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new AppError(`Failed to upload file to Supabase: ${error.message}`, 500);
    }

    const { data: urlData } = supabase.storage
      .from(MESSAGES_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new AppError("Failed to get public URL from Supabase", 500);
    }

    return urlData.publicUrl;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Supabase upload error: ${error.message}`, 500);
  }
};

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean => {
  // If using local database, always return false to use local storage
  const dbConfig = getDatabaseConfig();
  if (dbConfig.isLocal) {
    return false;
  }
  return supabase !== null;
};

