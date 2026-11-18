const assert = require("node:assert/strict");
const { test } = require("node:test");
const { settings } = require("./settings.cjs");
const now = 1800000000000;
const config = settings({
  envFile: false,
  env: {
    E2E_PRODUCTION_PASSWORD: "shared",
    E2E_TEACHER_PASSWORD: "teacher-password",
  },
});
const token = (expiry) =>
  `header.${Buffer.from(JSON.stringify({ exp: expiry })).toString("base64url")}.signature`;
const session = (
  email = config.accounts.teacher,
  expiry = now / 1000 + 900,
) => ({
  user: { email, role: "TEACHER" },
  tokens: { accessToken: token(expiry), refreshToken: "synthetic-refresh" },
});

test("cached production sessions must match the configured account and token expiry", () => {
  const { reusableSession } = require("./auth-session.cjs");
  assert.equal(reusableSession(session(), config, "teacher", now), true);
  assert.equal(
    reusableSession(session("another@example.com"), config, "teacher", now),
    false,
  );
  assert.equal(
    reusableSession(
      session(config.accounts.teacher, now / 1000 - 1),
      config,
      "teacher",
      now,
    ),
    false,
  );
  assert.equal(
    reusableSession(
      { user: session().user, tokens: { accessToken: "bad-token" } },
      config,
      "teacher",
      now,
    ),
    false,
  );
});

test("production authentication uses the configured per-role password", async () => {
  const { authenticate } = require("./auth-session.cjs");
  let usedPassword;
  const result = await authenticate("teacher", config, undefined, {
    now: () => now,
    request: async (url, options) => {
      assert.equal(url, `${config.api}/auth/login`);
      usedPassword = JSON.parse(options.body).password;
      return Response.json({ data: session() });
    },
  });
  assert.ok(
    usedPassword === "teacher-password",
    "Login must use the selected role's password",
  );
  assert.equal(result.user.email, config.accounts.teacher);
});

test("expired matching sessions are refreshed before consuming another login attempt", async () => {
  const { authenticate } = require("./auth-session.cjs");
  const result = await authenticate(
    "teacher",
    config,
    session(config.accounts.teacher, 1),
    {
      now: () => now,
      request: async (url) => {
        assert.equal(url, `${config.api}/auth/refresh`);
        return Response.json({ data: session() });
      },
    },
  );
  assert.equal(result.user.email, config.accounts.teacher);
});

test("failed login stops preparation without disclosing the provider response", async () => {
  const { authenticate } = require("./auth-session.cjs");
  await assert.rejects(
    authenticate("teacher", config, undefined, {
      now: () => now,
      request: async () =>
        Response.json({ message: "private-response-detail" }, { status: 401 }),
    }),
    (error) => {
      assert.match(error.message, /teacher.*HTTP 401/);
      assert.doesNotMatch(
        error.message,
        /private-response-detail|teacher-password/,
      );
      return true;
    },
  );
});

test("an unexpired cached session is checked against the live API", async () => {
  const { authenticate } = require("./auth-session.cjs");
  const previous = session();
  assert.equal(
    await authenticate("teacher", config, previous, {
      now: () => now,
      request: async (url, options) => {
        assert.equal(url, `${config.api}/auth/me`);
        assert.equal(options.method, "GET");
        assert.ok(
          options.headers.Authorization ===
            `Bearer ${previous.tokens.accessToken}`,
        );
        return Response.json({ data: previous.user });
      },
    }),
    previous,
  );
});

test("a revoked unexpired cached session is replaced instead of reused", async () => {
  const { authenticate } = require("./auth-session.cjs");
  const previous = session();
  const routes = [];
  const renewed = session(config.accounts.teacher, now / 1000 + 1800);
  const result = await authenticate("teacher", config, previous, {
    now: () => now,
    request: async (url) => {
      routes.push(url.slice(config.api.length));
      return url.endsWith("/login")
        ? Response.json({ data: renewed })
        : Response.json({}, { status: 401 });
    },
  });
  assert.deepEqual(routes, ["/auth/me", "/auth/refresh", "/auth/login"]);
  assert.ok(result.tokens.accessToken === renewed.tokens.accessToken);
});
