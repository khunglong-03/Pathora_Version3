import { DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL } from "./apiGateway";

export const SOCIAL_MEDIA = {
  facebook:
    process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/pathora",
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/pathora",
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/pathora",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com/pathora",
  github: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/pathora",
} as const;

// App Store URLs
export const APP_STORES = {
  apple:
    process.env.NEXT_PUBLIC_APPLE_STORE_URL ||
    "https://apps.apple.com/app/pathora",
  google:
    process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL ||
    "https://play.google.com/store/apps/pathora",
} as const;

// Development URLs (for internal use only - admin/dev tools)
// These should NOT be exposed in production
const DEV_DEFAULTS = {
  frontend: "http://localhost:3001",
  backend: DEFAULT_DEVELOPMENT_API_GATEWAY_BASE_URL,
  minio: "http://localhost:9000",
  rabbitmq: "http://localhost:15672",
  mailhog: "http://localhost:8025",
  elasticsearch: "http://localhost:9200",
  portainer: "http://localhost:9002",
  jupyter: "http://localhost:5540",
} as const;

export const DEV_URLS = {
  frontend: process.env.NEXT_PUBLIC_DEV_FRONTEND_URL || DEV_DEFAULTS.frontend,
  backend: process.env.NEXT_PUBLIC_DEV_BACKEND_URL || DEV_DEFAULTS.backend,
  minio: process.env.NEXT_PUBLIC_DEV_MINIO_URL || DEV_DEFAULTS.minio,
  rabbitmq: process.env.NEXT_PUBLIC_DEV_RABBITMQ_URL || DEV_DEFAULTS.rabbitmq,
  mailhog: process.env.NEXT_PUBLIC_DEV_MAILHOG_URL || DEV_DEFAULTS.mailhog,
  elasticsearch:
    process.env.NEXT_PUBLIC_DEV_ELASTICSEARCH_URL || DEV_DEFAULTS.elasticsearch,
  portainer:
    process.env.NEXT_PUBLIC_DEV_PORTAINER_URL || DEV_DEFAULTS.portainer,
  jupyter: process.env.NEXT_PUBLIC_DEV_JUPYTER_URL || DEV_DEFAULTS.jupyter,
} as const;

// API Gateway (re-export for convenience)
export { API_GATEWAY_BASE_URL as API_BASE_URL } from "./apiGateway";

// Default values for external references
export const EXTERNAL_LINKS = {
  supportEmail: "support@pathora.com",
  contactEmail: "contact@pathora.com",
} as const;
