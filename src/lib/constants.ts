export const APP_NAME = "Value Stream Consulting";

export const COLORS = {
  primary: "#CD3465",
  secondary: "#0F172A",
  text: "#262626",
} as const;

export const OTP = {
  LENGTH: 4,
  VALIDITY_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  RATE_LIMIT_COUNT: 50,
  RATE_LIMIT_WINDOW_MINUTES: 15,
} as const;

export const PASSWORD = {
  MIN_LENGTH: 8,
  RESET_TOKEN_VALIDITY_HOURS: 1,
} as const;

export const UPLOAD = {
  MAX_SIZE_BYTES: 25 * 1024 * 1024,
  ALLOWED_EXTENSIONS: [".pdf", ".ppt", ".pptx", ".xls", ".xlsx"],
  MAX_FILES_PER_SESSION: 20,
} as const;

export const IMAGE_UPLOAD = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_EXTENSIONS: [".png", ".jpg", ".jpeg", ".webp", ".svg"],
} as const;

export const AVATAR_UPLOAD = {
  MAX_SIZE_BYTES: 4 * 1024 * 1024,
  ALLOWED_EXTENSIONS: [".png", ".jpg", ".jpeg", ".webp"],
  OUTPUT_SIZE: 256,
  OUTPUT_QUALITY: 82,
} as const;

export const APP_FAVICON = "/favicon.ico";

export const BRANDING = {
  APP_FAVICON,
  DEFAULT_FAVICON: "/branding/vscg-icon.png",
  DEFAULT_LOGO_DARK: "/branding/vscg-logo-dark.png",
  DEFAULT_LOGO_LIGHT: "/branding/vscg-icon.png",
} as const;

export const SESSION_COOKIE = "vsc_session";
export const ACTIVE_COMPANY_COOKIE = "vsc_active_company";
