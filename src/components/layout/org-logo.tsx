import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

export type BrandLogoVariant = "header" | "sidebar" | "login" | "thumbnail" | "preview";

const VARIANT_CLASS: Record<BrandLogoVariant, string> = {
  header: "max-h-11 w-auto max-w-[min(300px,44vw)] shrink-0",
  sidebar: "max-h-[52px] w-auto max-w-[240px] shrink-0",
  login: "max-h-24 w-auto max-w-[min(340px,85vw)] shrink-0",
  thumbnail: "max-h-9 w-auto max-w-[140px] shrink-0",
  preview: "max-h-16 w-auto max-w-[280px] shrink-0",
};

type OrgLogoProps = {
  logoUrl: string;
  alt: string;
  variant?: BrandLogoVariant;
  className?: string;
  rounded?: "lg" | "xl" | "full" | "none";
};

export function OrgLogo({
  logoUrl,
  alt,
  variant,
  className,
  rounded = "none",
}: OrgLogoProps) {
  const radius =
    rounded === "full"
      ? "rounded-full"
      : rounded === "xl"
        ? "rounded-xl"
        : rounded === "lg"
          ? "rounded-lg"
          : "";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveMediaUrl(logoUrl)}
      alt={alt}
      decoding="async"
      className={cn(
        "h-auto object-contain object-left",
        variant && VARIANT_CLASS[variant],
        radius,
        className
      )}
    />
  );
}
