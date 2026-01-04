"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Camera, X, Upload } from "lucide-react";
import Avatar from "@/components/common/Avatar";
import { User } from "@/types/user";
import { profileService } from "@/services/profile.service";
import { useToast } from "@/contexts";

interface ProfileImageUploadProps {
  user: User;
  onUpdate: (user: User) => void;
  onClose?: () => void;
}

export default function ProfileImageUpload({
  user,
  onUpdate,
  onClose,
}: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0] && !preview) return;

    setUploading(true);
    try {
      let imageData: string | File;

      if (fileInputRef.current?.files?.[0]) {
        imageData = fileInputRef.current.files[0];
      } else if (preview) {
        imageData = preview;
      } else {
        return;
      }

      const response = await profileService.updateProfileImage(imageData);
      onUpdate(response.data.user);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToast("Profile image updated successfully", "success");
      if (onClose) {
        onClose();
      }
    } catch (error: unknown) {
      console.error("Failed to upload image:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      showToast(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const response = await profileService.updateProfile({ profileImage: null });
      onUpdate(response.data.user);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      showToast("Profile image removed", "success");
      if (onClose) {
        onClose();
      }
    } catch (error: unknown) {
      console.error("Failed to remove image:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to remove image";
      showToast(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <Avatar user={user} size="xl" />
          {preview && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        <div className="w-full space-y-3">
          <div className="flex justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-image-input"
            />
            <label
              htmlFor="profile-image-input"
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg cursor-pointer transition-colors text-sm font-medium text-white"
            >
              <Camera className="w-4 h-4" />
              {preview ? "Change Image" : "Upload Image"}
            </label>
          </div>
          {preview && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
          {user.profileImage && !preview && (
            <div className="flex justify-center">
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Remove Image
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-500 text-center">
        Recommended: Square image, at least 400x400px. Max file size: 5MB
      </p>
    </div>
  );
}

