"use client";

import { User } from "lucide-react";
import { resolveImageUrl } from "@/utils/imageUtils";
import { User as UserType } from "@/types/user";

// Simple className utility
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

interface AvatarProps {
  user?: UserType | null;
  imageUrl?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-20 h-20 text-lg",
  xl: "w-32 h-32 text-2xl",
};

export default function Avatar({
  user,
  imageUrl,
  name,
  size = "md",
  className,
}: AvatarProps) {
  const displayName = name || user?.name || "";
  const profileImage = imageUrl || user?.profileImage;
  const resolvedImage = profileImage ? resolveImageUrl(profileImage) : "";

  // Get initials from name
  const getInitials = (name: string): string => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);
  const sizeClass = sizeClasses[size];

  if (resolvedImage) {
    return (
      <div
        className={cn(
          "rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center",
          sizeClass,
          className
        )}
      >
        <img
          src={resolvedImage}
          alt={displayName || "User avatar"}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </div>
    );
  }

  // Fallback to initials or default icon
  return (
    <div
      className={cn(
        "rounded-full bg-zinc-700 dark:bg-zinc-800 flex items-center justify-center text-white font-bold",
        sizeClass,
        className
      )}
    >
      {initials ? (
        initials
      ) : (
        <User className={cn("text-zinc-400", size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-16 h-16")} />
      )}
    </div>
  );
}

