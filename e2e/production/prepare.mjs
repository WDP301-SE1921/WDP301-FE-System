import fs from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import local from "./settings.cjs";
const { runtime, settings } = local;
const config = settings();
fs.mkdirSync(runtime, { recursive: true });
const schema = await fetch(config.api.replace(/\/api\/v1$/, "/api/docs-json"));
if (!schema.ok) throw new Error(`Swagger ${schema.status}`);
const specification = await schema.json();
fs.writeFileSync(`${runtime}/openapi.json`, JSON.stringify(specification));
let auth = {};
try {
  auth = JSON.parse(fs.readFileSync(`${runtime}/auth.json`, "utf8"));
} catch {}
for (const role of [
  "manager",
  "staff",
  "teacher",
  "designer",
  "admin",
  "parent",
]) {
  const previous = auth[role];
  if (
    previous &&
    JSON.parse(
      Buffer.from(previous.tokens.accessToken.split(".")[1], "base64url"),
    ).exp >
      Date.now() / 1000 + 120
  )
    continue;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${config.api}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: config.accounts[role],
        password: config.password,
      }),
    });
    if (response.status === 429) {
      console.log("Waiting for production login rate limit.");
      await delay(
        Math.min(60, Number(response.headers.get("retry-after") || 60)) * 1000 +
          100,
      );
      continue;
    }
    if (!response.ok) {
      console.log(`${role}: login ${response.status}`);
      break;
    }
    const body = await response.json();
    auth[role] = body.data;
    fs.writeFileSync(`${runtime}/auth.json`, JSON.stringify(auth));
    console.log(`${role}: authenticated ${body.data.user.role}`);
    break;
  }
}
console.log(
  `Production OpenAPI: ${Object.keys(specification.paths).length} paths; ${Object.values(specification.paths).reduce((n, x) => n + Object.keys(x).length, 0)} operations.`,
);
