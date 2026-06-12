"use client";

import { avatarColor, userInitials } from "@/lib/avatar-color";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  ringClassName?: string;
};

export function UserAvatar({
  userId,
  firstName,
  lastName,
  avatarUrl,
  size = 40,
  className,
  ringClassName = "ring-2 ring-white",
}: UserAvatarProps) {
  const src = resolveMediaUrl(avatarUrl);
  const initials = userInitials(firstName, lastName);
  const color = avatarColor(userId);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", ringClassName, className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        ringClassName,
        className
      )}
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(10, size * 0.28) }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
