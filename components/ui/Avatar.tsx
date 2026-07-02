"use client";

import Image from "next/image";
import { User } from "lucide-react";

type AvatarProps = {
  imageUrl: string | null;
  name: string | null;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
} as const;

const iconSizeMap = {
  sm: 16,
  md: 20,
  lg: 30,
  xl: 44,
} as const;

const textSizeClassName = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
  xl: "text-3xl",
} as const;

function getInitials(name: string | null) {
  if (!name) {
    return "";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  const firstInitial = parts[0]?.[0] ?? "";
  const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";

  return `${firstInitial}${lastInitial}`.slice(0, 2).toUpperCase();
}

export default function Avatar({ imageUrl, name, size = "md" }: AvatarProps) {
  const pixelSize = sizeMap[size];
  const initials = getInitials(name);

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name ? `${name} avatar` : "User avatar"}
        width={pixelSize}
        height={pixelSize}
        className="rounded-full border-2 border-[#EADDCD] object-cover"
        style={{
          width: pixelSize,
          height: pixelSize,
        }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-[#EADDCD] bg-[#B87B68] font-semibold text-[#F8F5F0] ${textSizeClassName[size]}`}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
      aria-label={name ? `${name} avatar` : "User avatar"}
    >
      {initials ? (
        initials
      ) : (
        <User
          width={iconSizeMap[size]}
          height={iconSizeMap[size]}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
