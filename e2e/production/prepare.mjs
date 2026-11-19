import fs from "node:fs";
import local from "./settings.cjs";
import sessions from "./auth-session.cjs";
const { runtime, settings, validateSettings, roles } = local;
const config = validateSettings(settings());
fs.mkdirSync(runtime, { recursive: true });
const schema = await fetch(config.api.replace(/\/api\/v1$/, "/api/docs-json"), {
  signal: AbortSignal.timeout(20000),
});
if (!schema.ok) throw new Error(`Swagger ${schema.status}`);
const specification = await schema.json();
fs.writeFileSync(`${runtime}/openapi.json`, JSON.stringify(specification));
let auth = {};
try {
  auth = JSON.parse(fs.readFileSync(`${runtime}/auth.json`, "utf8"));
} catch {}
for (const role of roles) {
  auth[role] = await sessions.authenticate(role, config, auth[role]);
  fs.writeFileSync(`${runtime}/auth.json`, JSON.stringify(auth), {
    mode: 0o600,
  });
  console.log(`${role}: authenticated ${auth[role].user.role}`);
}
console.log(
  `Production OpenAPI: ${Object.keys(specification.paths).length} paths; ${Object.values(specification.paths).reduce((n, x) => n + Object.keys(x).length, 0)} operations.`,
);
