const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const runtime = path.join(root, "e2e/.production-runtime");
const settingsPath =
  process.env.E2E_PRODUCTION_CONFIG || path.join(runtime, "settings.json");
function settings() {
  const value = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  if (
    value.web !== "https://edugrade.45.77.168.110.sslip.io" ||
    value.api !== "https://api.edugrade.45.77.168.110.sslip.io/api/v1"
  )
    throw new Error(
      "Production target does not match the explicitly authorized deployment.",
    );
  return value;
}
module.exports = { root, runtime, settings };
