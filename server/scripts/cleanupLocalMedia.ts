import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const MEDIA_DIRS = [
  "public/img/products",
  "public/img/videos",
  "public/img/categories",
  "public/img/users",
];

interface CleanupStats {
  directories: { name: string; filesRemoved: number; sizeRemoved: number }[];
  totalFiles: number;
  totalSize: number;
}

async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

async function cleanupDirectory(dirPath: string): Promise<{ filesRemoved: number; sizeRemoved: number }> {
  let filesRemoved = 0;
  let sizeRemoved = 0;

  try {
    // Check if directory exists
    try {
      await fs.access(dirPath);
    } catch {
      console.log(`⚠️  Directory doesn't exist: ${dirPath}`);
      return { filesRemoved: 0, sizeRemoved: 0 };
    }

    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const size = await getFileSize(filePath);
          await fs.unlink(filePath);
          filesRemoved++;
          sizeRemoved += size;
          console.log(`  ✅ Removed: ${file} (${formatBytes(size)})`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error removing ${file}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error(`❌ Error cleaning directory ${dirPath}:`, error.message);
  }

  return { filesRemoved, sizeRemoved };
}

async function main() {
  console.log("🧹 Starting cleanup of local media files...");
  console.log("⚠️  This will remove all images and videos from server/public/img/\n");

  const stats: CleanupStats = {
    directories: [],
    totalFiles: 0,
    totalSize: 0,
  };

  for (const dir of MEDIA_DIRS) {
    const fullPath = path.join(__dirname, "..", dir);
    console.log(`📁 Cleaning: ${dir}`);
    
    const result = await cleanupDirectory(fullPath);
    stats.directories.push({
      name: dir,
      filesRemoved: result.filesRemoved,
      sizeRemoved: result.sizeRemoved,
    });
    stats.totalFiles += result.filesRemoved;
    stats.totalSize += result.sizeRemoved;
    
    console.log(`   Removed ${result.filesRemoved} files (${formatBytes(result.sizeRemoved)})\n`);
  }

  console.log("=".repeat(50));
  console.log("📊 Cleanup Summary:");
  console.log("=".repeat(50));
  stats.directories.forEach((dir) => {
    if (dir.filesRemoved > 0) {
      console.log(`${dir.name}: ${dir.filesRemoved} files, ${formatBytes(dir.sizeRemoved)}`);
    }
  });
  console.log("=".repeat(50));
  console.log(`Total: ${stats.totalFiles} files removed, ${formatBytes(stats.totalSize)} freed`);
  console.log("=".repeat(50));
  console.log("✅ Cleanup completed!");
  console.log("\n💡 Note: All new uploads will go directly to Supabase.");
  console.log("💡 Old local files have been removed. Make sure your database URLs point to Supabase.");
}

main().catch((error) => {
  console.error("❌ Cleanup failed:", error);
  process.exit(1);
});









