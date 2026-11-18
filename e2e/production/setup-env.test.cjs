const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseEnv } = require("node:util");
const { test } = require("node:test");

function target(t) {
  const folder = fs.mkdtempSync(
    path.join(os.tmpdir(), "edugrade-production-setup-"),
  );
  const file = path.join(folder, ".env");
  t.after(() => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    fs.rmdirSync(folder);
  });
  return file;
}

test("setup creates a usable template without shipping private credentials", (t) => {
  const { createEnvFile } = require("./setup-env.cjs");
  const file = target(t);
  assert.equal(createEnvFile(file), true);
  const config = parseEnv(fs.readFileSync(file, "utf8"));
  assert.equal(
    config.E2E_PRODUCTION_WEB_URL,
    "https://edugrade.45.77.168.110.sslip.io",
  );
  assert.equal(config.E2E_PRODUCTION_PASSWORD, "");
  assert.equal(config.AI_API_KEY, "");
  assert.equal(config.SMTP_URL, "");
});

test("running setup again preserves an existing teammate's .env", (t) => {
  const { createEnvFile } = require("./setup-env.cjs");
  const file = target(t);
  const original = "AI_API_KEY=private-team-key\n";
  fs.writeFileSync(file, original);
  assert.equal(createEnvFile(file), false);
  assert.ok(
    fs.readFileSync(file, "utf8") === original,
    "Existing private configuration must stay unchanged",
  );
});
