import fs from "node:fs";
import { test, expect } from "@playwright/test";
import local from "./settings.cjs";
import api from "./api.cjs";
const config = local.settings();
const origin = new URL(config.api).origin;
const schema = JSON.parse(
  fs.readFileSync(`${local.runtime}/openapi.json`, "utf8"),
);
const auth = JSON.parse(fs.readFileSync(`${local.runtime}/auth.json`, "utf8"));
test.beforeEach(async () => {
  for (const role of Object.keys(auth)) auth[role] = await api.ensure(role);
});
const placeholder = "00000000-0000-4000-8000-000000000000";
const endpoints = Object.entries(schema.paths) as [
  string,
  Record<
    string,
    {
      security?: unknown[];
      parameters?: { name: string; in: string; required?: boolean }[];
    }
  >,
][];

test("all protected API operations reject guests", async ({
  request,
}, info) => {
  const results = [];
  for (const [route, methods] of endpoints)
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation.security?.length) continue;
      // Public invitation acceptance inherits a class-level Swagger bearer marker.
      // Its actual contract is a one-use invitation token, not an access token.
      if (method === "post" && route === "/api/v1/account-invitations/accept")
        continue;
      const url = origin + route.replace(/\{[^}]+\}/g, placeholder);
      const response = await request.fetch(url, {
        method: method.toUpperCase(),
        data: method === "get" ? undefined : {},
        timeout: 30_000,
      });
      results.push({ method, route, status: response.status() });
      expect
        .soft(response.status(), `${method.toUpperCase()} ${route}`)
        .toBe(401);
    }
  await info.attach("unauthenticated API operations", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
});

test("all static GET APIs respond with authorized roles", async ({
  request,
}, info) => {
  const results = [];
  for (const [route, methods] of endpoints) {
    if (!methods.get || route.includes("{")) continue;
    const role = route.startsWith("/api/v1/admin/")
      ? "admin"
      : route.startsWith("/api/v1/me/")
        ? "parent"
        : route === "/api/v1/parents/search"
          ? "staff"
          : [
                "/api/v1/academic/assignments",
                "/api/v1/academic/reports",
              ].includes(route)
            ? "teacher"
            : "manager";
    const url = new URL(origin + route);
    if (route.includes("/analytics"))
      for (const [key, value] of Object.entries({
        from: "2026-11-01",
        to: "2026-11-13",
        bucket: "DAY",
      }))
        url.searchParams.set(key, value);
    if (route.endsWith("/parents/lookup") || route.endsWith("/parents/search"))
      url.searchParams.set("email", config.accounts.parent);
    if (route.endsWith("/auth/me/avatar")) continue; // Covered by a concrete uploaded avatar, no avatar is a valid 404.
    const response = await request.get(url.toString(), {
      headers: { Authorization: `Bearer ${auth[role].tokens.accessToken}` },
      timeout: 45_000,
    });
    results.push({ route, role, status: response.status() });
    expect.soft(response.status(), `${role} GET ${route}`).toBe(200);
  }
  await info.attach("GET inventory", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
});

test("parent and staff cannot access admin APIs", async ({ request }) => {
  for (const role of ["parent", "staff", "teacher", "designer", "manager"])
    for (const route of [
      "admin/overview",
      "admin/services",
      "admin/accounts",
    ]) {
      const response = await request.get(`${config.api}/${route}`, {
        headers: { Authorization: `Bearer ${auth[role].tokens.accessToken}` },
      });
      expect(response.status(), `${role} ${route}`).toBe(403);
    }
});

test("production reports configuration separately from live service success", async ({
  request,
}, info) => {
  const response = await request.get(`${config.api}/admin/services`, {
    headers: { Authorization: `Bearer ${auth.admin.tokens.accessToken}` },
  });
  expect(response.status()).toBe(200);
  await info.attach("production service configuration", {
    body: JSON.stringify((await response.json()).data, null, 2),
    contentType: "application/json",
  });
});
