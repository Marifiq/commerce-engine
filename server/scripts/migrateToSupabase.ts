import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import prisma from "../db.js";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

// Initialize Supabase
let supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (supabaseUrl && supabaseUrl.includes('.storage.supabase.co')) {
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.storage\.supabase\.co/);
  if (match) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

if (!supabaseUrl && process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const match = dbUrl.match(/@([^.]+)\.(supabase\.co|pooler\.supabase\.com)/);
  if (match) {
    supabaseUrl = `https://${match[1]}.supabase.co`;
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase credentials not found!");
  console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file");
  process.exit(1);
}

// Validate that the key is a JWT (service role key)
if (!supabaseKey.startsWith('eyJ') || supabaseKey.split('.').length !== 3) {
  console.error("❌ Invalid Supabase Service Role Key!");
  console.error("The SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY must be a JWT token.");
  console.error("Get your Service Role Key from: Supabase Dashboard > Settings > API > service_role key");
  console.error("It should start with 'eyJ' and be ~200+ characters long.");
  console.error("\nCurrent key length:", supabaseKey.length);
  console.error("Current key starts with:", supabaseKey.substring(0, 10));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "product-media";

interface MigrationStats {
  products: { total: number; migrated: number; failed: number };
  categories: { total: number; migrated: number; failed: number };
  reviews: { total: number; migrated: number; failed: number };
}

async function uploadFileToSupabase(
  localPath: string,
  remotePath: string,
  folder: "images" | "videos"
): Promise<string | null> {
  try {
    const fullLocalPath = path.join(__dirname, "../public", localPath);
    
    // Check if file exists
    try {
      await fs.access(fullLocalPath);
    } catch {
      console.warn(`⚠️  File not found: ${fullLocalPath}`);
      return null;
    }

    const fileBuffer = await fs.readFile(fullLocalPath);
    const contentType = folder === "images" ? "image/webp" : "video/mp4";
    const filePath = `${folder}/${remotePath}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error uploading ${localPath}:`, error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return urlData?.publicUrl || null;
  } catch (error: any) {
    console.error(`❌ Error processing ${localPath}:`, error.message);
    return null;
  }
}

async function migrateProducts() {
  console.log("\n📦 Migrating Products...");
  const products = await prisma.product.findMany({
    include: { media: true },
  });

  const stats = { total: products.length, migrated: 0, failed: 0 };

  for (const product of products) {
    try {
      let updated = false;
      const updates: any = {};

      // Migrate main product image
      if (product.image && product.image.startsWith("/img/")) {
        const filename = path.basename(product.image);
        const publicUrl = await uploadFileToSupabase(product.image, filename, "images");
        if (publicUrl) {
          updates.image = publicUrl;
          updated = true;
        } else {
          stats.failed++;
          continue;
        }
      }

      // Migrate product media
      const mediaUpdates: any[] = [];
      for (const media of product.media) {
        if (media.url && media.url.startsWith("/img/")) {
          const filename = path.basename(media.url);
          const folder = media.type === "image" ? "images" : "videos";
          const publicUrl = await uploadFileToSupabase(media.url, filename, folder);
          if (publicUrl) {
            mediaUpdates.push({
              id: media.id,
              url: publicUrl,
            });
          }
        }
      }

      // Update product
      if (updated) {
        await prisma.product.update({
          where: { id: product.id },
          data: updates,
        });
      }

      // Update media
      for (const mediaUpdate of mediaUpdates) {
        await prisma.productMedia.update({
          where: { id: mediaUpdate.id },
          data: { url: mediaUpdate.url },
        });
      }

      if (updated || mediaUpdates.length > 0) {
        stats.migrated++;
        console.log(`✅ Migrated product: ${product.name}`);
      }
    } catch (error: any) {
      console.error(`❌ Error migrating product ${product.id}:`, error.message);
      stats.failed++;
    }
  }

  return stats;
}

async function migrateCategories() {
  console.log("\n📁 Migrating Categories...");
  const categories = await prisma.category.findMany();

  const stats = { total: categories.length, migrated: 0, failed: 0 };

  for (const category of categories) {
    try {
      if (category.image && category.image.startsWith("/img/")) {
        const filename = path.basename(category.image);
        const publicUrl = await uploadFileToSupabase(category.image, filename, "images");
        if (publicUrl) {
          await prisma.category.update({
            where: { id: category.id },
            data: { image: publicUrl },
          });
          stats.migrated++;
          console.log(`✅ Migrated category: ${category.name}`);
        } else {
          stats.failed++;
        }
      }
    } catch (error: any) {
      console.error(`❌ Error migrating category ${category.id}:`, error.message);
      stats.failed++;
    }
  }

  return stats;
}

async function migrateReviews() {
  console.log("\n⭐ Migrating Reviews...");
  const reviews = await prisma.review.findMany();

  const stats = { total: reviews.length, migrated: 0, failed: 0 };

  for (const review of reviews) {
    try {
      const updates: any = {};
      let updated = false;

      // Migrate review images
      if (review.images && Array.isArray(review.images)) {
        const migratedImages: string[] = [];
        for (const image of review.images) {
          if (typeof image === "string" && image.startsWith("/img/")) {
            const filename = path.basename(image);
            const publicUrl = await uploadFileToSupabase(image, filename, "images");
            if (publicUrl) {
              migratedImages.push(publicUrl);
            } else {
              migratedImages.push(image); // Keep original if upload fails
            }
          } else {
            migratedImages.push(image);
          }
        }
        if (migratedImages.some((img, idx) => img !== review.images[idx])) {
          updates.images = migratedImages;
          updated = true;
        }
      }

      // Migrate review videos
      if (review.videos && Array.isArray(review.videos)) {
        const migratedVideos: string[] = [];
        for (const video of review.videos) {
          if (typeof video === "string" && video.startsWith("/img/")) {
            const filename = path.basename(video);
            const publicUrl = await uploadFileToSupabase(filename, filename, "videos");
            if (publicUrl) {
              migratedVideos.push(publicUrl);
            } else {
              migratedVideos.push(video); // Keep original if upload fails
            }
          } else {
            migratedVideos.push(video);
          }
        }
        if (migratedVideos.some((vid, idx) => vid !== review.videos[idx])) {
          updates.videos = migratedVideos;
          updated = true;
        }
      }

      if (updated) {
        await prisma.review.update({
          where: { id: review.id },
          data: updates,
        });
        stats.migrated++;
        console.log(`✅ Migrated review: ${review.id}`);
      }
    } catch (error: any) {
      console.error(`❌ Error migrating review ${review.id}:`, error.message);
      stats.failed++;
    }
  }

  return stats;
}

async function main() {
  console.log("🚀 Starting migration to Supabase...");
  console.log(`📦 Bucket: ${BUCKET_NAME}`);
  console.log(`🌐 Supabase URL: ${supabaseUrl}\n`);

  const stats: MigrationStats = {
    products: { total: 0, migrated: 0, failed: 0 },
    categories: { total: 0, migrated: 0, failed: 0 },
    reviews: { total: 0, migrated: 0, failed: 0 },
  };

  try {
    stats.products = await migrateProducts();
    stats.categories = await migrateCategories();
    stats.reviews = await migrateReviews();

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log("=".repeat(50));
    console.log(`Products:   ${stats.products.migrated}/${stats.products.total} migrated, ${stats.products.failed} failed`);
    console.log(`Categories: ${stats.categories.migrated}/${stats.categories.total} migrated, ${stats.categories.failed} failed`);
    console.log(`Reviews:    ${stats.reviews.migrated}/${stats.reviews.total} migrated, ${stats.reviews.failed} failed`);
    console.log("=".repeat(50));
    console.log("✅ Migration completed!");
  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

