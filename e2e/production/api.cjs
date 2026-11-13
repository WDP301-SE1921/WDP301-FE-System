const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
const { runtime, settings } = require("./settings.cjs");
const config = settings();
function session(role) {
  return JSON.parse(fs.readFileSync(`${runtime}/auth.json`, "utf8"))[role];
}
async function ensure(role) {
  const auth = session(role);
  const claims = JSON.parse(
    Buffer.from(auth.tokens.accessToken.split(".")[1], "base64url"),
  );
  if (claims.exp > Date.now() / 1000 + 90) return auth;
  const response = await fetch(`${config.api}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: auth.tokens.refreshToken }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `Production ${role} session expired; run prepare.mjs. HTTP ${response.status}`,
    );
  const updated = (await response.json()).data;
  const sessions = JSON.parse(fs.readFileSync(`${runtime}/auth.json`, "utf8"));
  sessions[role] = updated;
  fs.writeFileSync(`${runtime}/auth.json`, JSON.stringify(sessions));
  return updated;
}
async function raw(role, route, method = "GET", data, extra = {}) {
  const auth = await ensure(role);
  return fetch(`${config.api}/${route}`, {
    method,
    signal: AbortSignal.timeout(60_000),
    headers: {
      Authorization: `Bearer ${auth.tokens.accessToken}`,
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(method === "GET" ? {} : { "Idempotency-Key": randomUUID() }),
      ...extra,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
async function call(role, route, method = "GET", data, extra = {}) {
  const response = await raw(role, route, method, data, extra);
  const body = await response.json().catch(() => {
    throw new Error(
      `Production returned non-JSON HTTP ${response.status}: ${method} ${route}`,
    );
  });
  if (!response.ok)
    throw new Error(
      `${role} ${method} ${route}: HTTP ${response.status} ${body.error?.code}`,
    );
  return body.data;
}
const items = (value) => (Array.isArray(value) ? value : value.items);
const day = (offset = 0) => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(new Date(`${today}T00:00:00Z`).getTime() + offset * 86400000)
    .toISOString()
    .slice(0, 10);
};
module.exports = { config, runtime, session, ensure, raw, call, items, day };
