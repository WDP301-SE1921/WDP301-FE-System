const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const {
  settings,
  validateSettings,
  productionLinks,
} = require("./settings.cjs");

const options = (env = {}) => ({ env, envFile: false });

test("production settings use approved URLs without a local settings JSON", () => {
  const config = settings(options());
  assert.equal(config.web, "https://edugrade.45.77.168.110.sslip.io");
  assert.equal(
    config.api,
    "https://api.edugrade.45.77.168.110.sslip.io/api/v1",
  );
  assert.equal(config.admin, "https://admin.edugrade.45.77.168.110.sslip.io");
  assert.ok(config.password === "", "No legacy password fallback");
  assert.ok(config.aiKey === "", "No legacy API key fallback");
});

test("production settings parse quoted env values and prefer process variables", (t) => {
  const folder = fs.mkdtempSync(
    path.join(os.tmpdir(), "edugrade-production-env-"),
  );
  const file = path.join(folder, ".env");
  fs.writeFileSync(
    file,
    [
      'E2E_PRODUCTION_PASSWORD="file password #1"',
      'AI_API_KEY="file-key"',
      'SMTP_URL="smtps://user%40example.com:password@smtp.example.com:465"',
      'MAIL_FROM="EduGrade Tests <tests@example.com>"',
    ].join("\n"),
  );
  t.after(() => {
    fs.unlinkSync(file);
    fs.rmdirSync(folder);
  });
  const config = settings({
    env: { AI_API_KEY: "process-key" },
    envFile: file,
  });
  assert.ok(
    config.password === "file password #1",
    "Quoted password is preserved",
  );
  assert.ok(config.aiKey === "process-key", "Process API key takes precedence");
  assert.ok(
    config.visionKey === "process-key",
    "Vision key falls back to text key",
  );
  assert.equal(config.mailFrom, "EduGrade Tests <tests@example.com>");
  assert.ok(
    config.smtpUrl ===
      "smtps://user%40example.com:password@smtp.example.com:465",
    "Quoted SMTP URL is preserved",
  );
});

test("role passwords can override the shared password", () => {
  const config = settings(
    options({
      E2E_PRODUCTION_PASSWORD: "shared password",
      E2E_TEACHER_PASSWORD: "teacher-only password",
      E2E_PARENT_EMAIL: "parent@example.com",
    }),
  );
  assert.ok(
    config.passwords.teacher === "teacher-only password",
    "Per-role password takes precedence",
  );
  assert.ok(
    config.passwords.manager === "shared password",
    "Shared password remains available",
  );
  assert.equal(config.accounts.parent, "parent@example.com");
  assert.doesNotThrow(() => validateSettings(config));
});

test("public checks do not require login or provider credentials", () => {
  const config = settings(options());
  assert.doesNotThrow(() => validateSettings(config, { auth: false }));
});

test("missing login fields fail with variable names before a production write", () => {
  assert.throws(
    () => validateSettings(settings(options())),
    /E2E_PRODUCTION_PASSWORD/,
  );
  assert.throws(
    () => validateSettings(settings(options())),
    /E2E_PARENT_EMAIL/,
  );
});

test("provider validation names missing fields without leaking configured secrets", () => {
  const config = settings(options({ AI_API_KEY: "never-print-this-key" }));
  assert.throws(
    () => validateSettings(config, { auth: false, providers: true }),
    (error) => {
      assert.match(error.message, /SMTP_URL/);
      assert.match(error.message, /MAIL_FROM/);
      assert.doesNotMatch(error.message, /never-print-this-key/);
      return true;
    },
  );
});

for (const [key, value] of [
  ["E2E_PRODUCTION_WEB_URL", "https://unexpected.example.com"],
  ["E2E_PRODUCTION_API_URL", "http://localhost:3000/api/v1"],
  ["E2E_PRODUCTION_ADMIN_URL", "https://unexpected.example.com/admin"],
]) {
  test(`production settings reject unauthorized target ${key}`, () => {
    assert.throws(
      () => settings(options({ [key]: value })),
      /authorized production/,
    );
  });
}

test("report links contain only public production endpoints", () => {
  const config = settings(
    options({
      E2E_PRODUCTION_PASSWORD: "secret-password",
      AI_API_KEY: "secret-api-key",
      SMTP_URL: "smtps://user:secret-smtp-password@smtp.example.com:465",
    }),
  );
  const links = productionLinks(config);
  assert.equal(links.web, "https://edugrade.45.77.168.110.sslip.io");
  assert.equal(
    links.health,
    "https://api.edugrade.45.77.168.110.sslip.io/api/v1/health/ready",
  );
  assert.equal(links.admin, "https://admin.edugrade.45.77.168.110.sslip.io");
  assert.doesNotMatch(JSON.stringify(links), /secret|smtp/);
});
