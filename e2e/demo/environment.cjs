const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const backend = path.resolve(root, "../WDP301-BE-System");
const mobile = path.resolve(root, "../WDP301-FEM-System");
const password = process.env.E2E_PASSWORD || "WdpE2E!2026_local";
const env = {
  ...process.env,
  NODE_ENV: "test",
  PORT: "3000",
  DATABASE_URL:
    "mysql://root:WdpE2E_database_local@127.0.0.1:3308/edugrade_e2e",
  CORS_ORIGINS:
    "http://localhost:3001,http://localhost:8081,http://127.0.0.1:8081",
  WEB_ORIGIN: "http://localhost:3001",
  SWAGGER_ENABLED: "true",
  JWT_ACCESS_SECRET: "wdp-e2e-local-access-secret-2026-11-13",
  JWT_REFRESH_SECRET: "wdp-e2e-local-refresh-secret-2026-11-13",
  JWT_ISSUER: "wdp-e2e",
  JWT_AUDIENCE: "wdp-e2e-clients",
  JWT_ACCESS_TTL_SECONDS: "7200",
  THROTTLE_LIMIT_PER_MINUTE: "10000",
  SEED_DEFAULT_PASSWORD: password,
  SEED_ADMIN_EMAIL: "admin@edugrade.local",
  SEED_MANAGER_EMAIL: "manager@edugrade.local",
  SEED_STAFF_EMAIL: "staff@edugrade.local",
  SEED_TEACHER_EMAIL: "teacher@edugrade.local",
  SEED_CURRICULUM_DESIGNER_EMAIL: "designer@edugrade.local",
  SEED_PARENT_EMAIL: "parent@edugrade.local",
  E2E_PASSWORD: password,
  SEED_MODE: "demo",
  SEED_REFERENCE_DATE: "2026-11-13",
  STORAGE_ENDPOINT: "http://127.0.0.1:9002",
  STORAGE_PUBLIC_ENDPOINT: "http://127.0.0.1:9002",
  STORAGE_REGION: "us-east-1",
  STORAGE_BUCKET: "wdp-e2e",
  STORAGE_ACCESS_KEY: "wdp_e2e_local",
  STORAGE_SECRET_KEY: "WdpE2E_storage_local",
  AI_CHAT_URL: "http://127.0.0.1:3900/chat/completions",
  AI_API_KEY: "local-test-provider",
  AI_MODEL: "deterministic-e2e",
  AI_VISION_CHAT_URL: "http://127.0.0.1:3900/chat/completions",
  AI_VISION_API_KEY: "local-test-provider",
  AI_VISION_MODEL: "deterministic-e2e",
  VAPID_PUBLIC_KEY: "",
  VAPID_PRIVATE_KEY: "",
  SMTP_URL: "smtp://127.0.0.1:1026",
  MAIL_FROM: "EduGrade E2E <noreply@example.test>",
  BACKEND_API_URL: "http://localhost:3000/api/v1",
  NEXT_PUBLIC_REALTIME_URL: "http://localhost:3000",
  EXPO_PUBLIC_ENV: "development",
  EXPO_PUBLIC_API_URL: "http://localhost:3000/api/v1",
  EXPO_NO_TELEMETRY: "1",
  EXPO_NO_DOTENV: "1",
};
module.exports = { root, backend, mobile, password, env };
