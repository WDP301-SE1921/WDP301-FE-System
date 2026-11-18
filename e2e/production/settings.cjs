const fs = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { maskEnvironment } = require("./secrets.cjs");
const root = path.resolve(__dirname, "../..");
const runtime = path.join(root, "e2e/.production-runtime");
const envFile = path.join(__dirname, ".env");
const roles = ["manager", "staff", "teacher", "designer", "admin", "parent"];
const urls = {
  web: "https://edugrade.45.77.168.110.sslip.io",
  api: "https://api.edugrade.45.77.168.110.sslip.io/api/v1",
  admin: "https://admin.edugrade.45.77.168.110.sslip.io",
};

function settings(options = {}) {
  const environment = options.env || process.env;
  const file =
    options.envFile ?? environment.E2E_PRODUCTION_ENV_FILE ?? envFile;
  if (typeof parseEnv !== "function")
    throw new Error("Production Playwright needs Node.js 22 or newer.");
  const fromFile =
    file && fs.existsSync(file) ? parseEnv(fs.readFileSync(file, "utf8")) : {};
  const env = { ...fromFile, ...environment };
  if (!options.env) maskEnvironment(env);
  const value = (key, fallback = "") => String(env[key] ?? fallback).trim();
  const password = String(env.E2E_PRODUCTION_PASSWORD || "");
  const config = {
    web: value("E2E_PRODUCTION_WEB_URL", urls.web).replace(/\/$/, ""),
    api: value("E2E_PRODUCTION_API_URL", urls.api).replace(/\/$/, ""),
    admin: value("E2E_PRODUCTION_ADMIN_URL", urls.admin).replace(/\/$/, ""),
    password,
    passwords: Object.fromEntries(
      roles.map((role) => [
        role,
        String(env[`E2E_${role.toUpperCase()}_PASSWORD`] || password),
      ]),
    ),
    accounts: Object.fromEntries(
      roles.map((role) => [
        role,
        value(
          `E2E_${role.toUpperCase()}_EMAIL`,
          role === "parent" ? "" : `${role}@edugrade.local`,
        ),
      ]),
    ),
    aiUrl: value("AI_CHAT_URL", "https://api.deepseek.com/chat/completions"),
    aiKey: value("AI_API_KEY"),
    aiModel: value("AI_MODEL", "deepseek-chat"),
    visionUrl:
      value("AI_VISION_CHAT_URL") ||
      value("AI_CHAT_URL", "https://api.deepseek.com/chat/completions"),
    visionKey: value("AI_VISION_API_KEY") || value("AI_API_KEY"),
    visionModel: value("AI_VISION_MODEL", "deepseek-flash"),
    smtpUrl: value("SMTP_URL"),
    mailFrom: value("MAIL_FROM"),
    channel: value("E2E_CHANNEL") || undefined,
  };
  for (const key of Object.keys(urls)) {
    if (config[key] !== urls[key])
      throw new Error(
        "Target does not match the authorized production deployment.",
      );
  }
  return config;
}

function validateSettings(config, { auth = true, providers = false } = {}) {
  const missing = [];
  if (auth) {
    for (const role of roles) {
      if (!config.accounts[role])
        missing.push(`E2E_${role.toUpperCase()}_EMAIL`);
      if (!config.passwords[role])
        missing.push(
          `E2E_${role.toUpperCase()}_PASSWORD (or E2E_PRODUCTION_PASSWORD)`,
        );
    }
  }
  if (providers) {
    for (const [field, variable] of [
      ["aiUrl", "AI_CHAT_URL"],
      ["aiKey", "AI_API_KEY"],
      ["aiModel", "AI_MODEL"],
      ["visionUrl", "AI_VISION_CHAT_URL"],
      ["visionKey", "AI_VISION_API_KEY"],
      ["visionModel", "AI_VISION_MODEL"],
      ["smtpUrl", "SMTP_URL"],
      ["mailFrom", "MAIL_FROM"],
    ])
      if (!config[field]) missing.push(variable);
  }
  if (missing.length)
    throw new Error(
      `Configure e2e/production/.env before running: ${missing.join(", ")}. Run npm run test:e2e:production:setup.`,
    );
  return config;
}

function productionLinks(config = settings()) {
  return {
    web: config.web,
    admin: config.admin,
    api: config.api,
    health: `${config.api}/health/ready`,
    docs: `${new URL(config.api).origin}/api/docs`,
  };
}

module.exports = {
  root,
  runtime,
  envFile,
  roles,
  urls,
  settings,
  validateSettings,
  productionLinks,
};
