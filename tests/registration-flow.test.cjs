require("./register-typescript.cjs");
const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { NextRequest } = require("next/server");
const calendar = require("../src/features/registration-flow/calendar.ts");
const schemas = require("../src/features/registration-flow/schemas.ts");
const server = require("../src/lib/api/server.ts");
const route = require("../src/app/api/backend/[...path]/route.ts");
const { proxy } = require("../src/proxy.ts");
const restoreRoute = require("../src/app/api/auth/restore/route.ts");
const apiClient = require("../src/lib/api/client.ts");
const { registrationApi } = require("../src/features/registration-flow/api.ts");
const storage = require("../src/features/registration-flow/storage.ts");
const { canAccessPath } = require("../src/constants/role-access.ts");
const {
  loginSchema,
  registerParentSchema,
} = require("../src/lib/validators/auth.ts");
const originalFetch = global.fetch;
const originalApiRequest = apiClient.apiRequest;
const originalSessionStorage = global.sessionStorage;
const originalWindow = global.window;

test("Parent self-registration accepts email/password and rejects invitation fields", async () => {
  const input = { email: " NEW-PARENT@Example.Com ", password: "x".repeat(72) };
  const parsed = registerParentSchema.parse(input);
  assert.equal(parsed.email, "new-parent@example.com");
  assert.equal(
    registerParentSchema.safeParse({ ...input, token: "old-invitation" })
      .success,
    false,
  );
  assert.equal(
    registerParentSchema.safeParse({ ...input, password: "ắ".repeat(25) })
      .success,
    false,
  );
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return url.endsWith("auth/register")
      ? success({
          ...auth("PARENT"),
          user: { ...user("PARENT"), email: parsed.email },
        })
      : success({ revoked: true });
  };
  const result = await route.POST(
    request("/api/backend/auth/register", "POST", input),
    context("auth/register"),
  );
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(calls[0].init.body), parsed);
  assert.ok(calls[1].url.endsWith("auth/logout"));
  assert.deepEqual(await result.json(), {
    success: true,
    data: { email: parsed.email },
  });
  assert.equal(result.headers.get("set-cookie"), null);
});

test("Manager cannot call registration APIs directly even if BE still permits that role", async () => {
  let requests = 0;
  global.fetch = async (url) => {
    requests++;
    assert.ok(url.endsWith("auth/me"));
    return success(user("MANAGER"));
  };
  const response = await route.POST(
    request(
      "/api/backend/registrations",
      "POST",
      {},
      "edugrade_access=manager",
    ),
    context("registrations"),
  );
  assert.equal(response.status, 403);
  assert.equal(requests, 1);
});

test("Email suggestions normalize partial queries, forward cancellation and exclude child data", async () => {
  const controller = new AbortController();
  apiClient.apiRequest = async (path, options) => {
    assert.equal(path, "parents/search?email=pa&limit=10");
    assert.equal(options.signal, controller.signal);
    return [
      {
        id: "parent-1",
        email: "parent@example.com",
        displayName: "Phụ huynh",
        status: "ACTIVE",
        parentProfile: { students: [] },
      },
    ];
  };
  const rows = await registrationApi.searchParents(" PA ", controller.signal);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].parentProfile, undefined);
  await assert.rejects(registrationApi.searchParents("p"));
});

test("Missing suggestion endpoint only falls back for complete emails and never invents accounts", async () => {
  const paths = [];
  apiClient.apiRequest = async (path) => {
    paths.push(path);
    if (path.startsWith("parents/search"))
      throw new apiClient.ApiError("NOT_FOUND", "Missing", 404);
    return {
      id: "parent-1",
      email: "parent@example.com",
      displayName: null,
      status: "ACTIVE",
    };
  };
  await assert.rejects(
    registrationApi.searchParents("pa"),
    /chưa hỗ trợ gợi ý/,
  );
  assert.equal(paths.length, 1);
  assert.equal(
    (await registrationApi.searchParents("parent@example.com"))[0].id,
    "parent-1",
  );
  assert.ok(paths.at(-1).startsWith("parents/lookup?"));
  apiClient.apiRequest = async () => {
    throw new apiClient.ApiError("NETWORK_ERROR", "Disconnected", 0);
  };
  await assert.rejects(
    registrationApi.searchParents("parent@example.com"),
    /Disconnected/,
  );
});

test("Search BFF requires staff, a partial email of at least two characters and preserves upstream query", async () => {
  const paths = [];
  global.fetch = async (url) => {
    paths.push(url);
    return url.endsWith("auth/me") ? success(user()) : success([]);
  };
  const cookie = "edugrade_access=staff";
  const invalid = await route.GET(
    request("/api/backend/parents/search?email=p", "GET", undefined, cookie),
    context("parents/search"),
  );
  assert.equal(invalid.status, 400);
  assert.equal(paths.length, 1);
  const valid = await route.GET(
    request(
      "/api/backend/parents/search?email=pa&limit=10",
      "GET",
      undefined,
      cookie,
    ),
    context("parents/search"),
  );
  assert.equal(valid.status, 200);
  assert.ok(paths.at(-1).endsWith("parents/search?email=pa&limit=10"));
});
afterEach(() => {
  global.fetch = originalFetch;
  apiClient.apiRequest = originalApiRequest;
  global.sessionStorage = originalSessionStorage;
  global.window = originalWindow;
  global.edugradeRefreshes.clear();
});
const user = (role = "STAFF") => ({
  id: "user-1",
  email: "staff@example.com",
  displayName: "Nhân viên",
  role,
  status: "ACTIVE",
  emailVerifiedAt: null,
});
const success = (data) => Response.json({ success: true, data });
const failure = (status, code) =>
  Response.json(
    { success: false, error: { code, message: code, requestId: "req-test" } },
    { status },
  );
const auth = (role = "STAFF") => ({
  user: user(role),
  tokens: {
    accessToken: "access-new",
    refreshToken: "refresh-new",
    expiresIn: 900,
    tokenType: "Bearer",
  },
});
const context = (path) => ({
  params: Promise.resolve({ path: path.split("/") }),
});
function request(path, method = "GET", body, cookie = "") {
  return new NextRequest(`http://localhost:3001${path}`, {
    method,
    headers: {
      Origin: "http://localhost:3001",
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("Calendar uses Vietnam day, clamps month end, handles leap years, and keeps end date exclusive", () => {
  assert.equal(
    calendar.todayInVietnam(new Date("2026-10-02T17:30:00Z")),
    "2026-10-03",
  );
  assert.equal(calendar.addCalendarMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(calendar.addCalendarMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(calendar.addCalendarMonths("2026-10-05", 3), "2027-01-05");
  assert.equal(calendar.isoWeekday("2026-10-04"), 7);
  assert.equal(
    calendar.nextStudyDate([{ weekday: 1 }], "2026-10-03"),
    "2026-10-05",
  );
  assert.equal(
    calendar.termLabel("2026-10-05", "2027-01-05", "2027-01-05"),
    "Hết hạn",
  );
});
test("Validation rejects overlapping schedules, accepts adjacent slots, and validates UTF-8 passwords", () => {
  assert.equal(
    schemas.schedulesSchema.safeParse({
      schedules: [
        { weekday: 1, startTime: "18:00", endTime: "20:00" },
        { weekday: 1, startTime: "19:00", endTime: "21:00" },
      ],
    }).success,
    false,
  );
  assert.equal(
    schemas.schedulesSchema.safeParse({
      schedules: [
        { weekday: 1, startTime: "18:00", endTime: "20:00" },
        { weekday: 1, startTime: "20:00", endTime: "21:00" },
      ],
    }).success,
    true,
  );
  assert.equal(
    loginSchema.safeParse({
      email: " STAFF@example.com ",
      password: "ắ".repeat(25),
      rememberMe: false,
    }).success,
    false,
  );
  assert.equal(
    schemas.parentEmailSchema.parse({ email: " PARENT@Example.Com " }).email,
    "parent@example.com",
  );
});
test("Only staff can register; staff and manager routes are isolated", () => {
  assert.equal(canAccessPath("staff", "/staff/enrollments/new"), true);
  assert.equal(
    canAccessPath("center_manager", "/staff/enrollments/new"),
    false,
  );
  assert.equal(canAccessPath("staff", "/manager/enrollments/new"), false);
  assert.equal(canAccessPath("staff", "/manager/dashboard"), false);
  assert.equal(canAccessPath("teacher", "/staff/enrollments/new"), false);
  assert.equal(
    canAccessPath("curriculum_designer", "/staff/enrollments/new"),
    false,
  );
});
test("Login forwards only backend fields and returns HttpOnly cookies without exposing tokens", async () => {
  let forwarded;
  global.fetch = async (_url, init) => {
    forwarded = JSON.parse(init.body);
    return success(auth("MANAGER"));
  };
  const result = await route.POST(
    request("/api/backend/auth/login", "POST", {
      email: " MANAGER@EXAMPLE.COM ",
      password: "StrongPass123!",
      rememberMe: true,
    }),
    context("auth/login"),
  );
  assert.equal(result.status, 200);
  assert.deepEqual(forwarded, {
    email: "manager@example.com",
    password: "StrongPass123!",
  });
  const data = (await result.json()).data;
  assert.equal(data.user.role, "center_manager");
  assert.equal(data.tokens, undefined);
  const cookies = result.headers.get("set-cookie");
  assert.match(cookies, /HttpOnly/i);
  assert.match(cookies, /Max-Age=/i);
});
test("Invalid credentials preserve backend request ID and do not refresh", async () => {
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return failure(401, "AUTH_INVALID_CREDENTIALS");
  };
  const result = await route.POST(
    request("/api/backend/auth/login", "POST", {
      email: "staff@example.com",
      password: "WrongPass123!",
      rememberMe: false,
    }),
    context("auth/login"),
  );
  assert.equal(result.status, 401);
  assert.equal((await result.json()).error.requestId, "req-test");
  assert.equal(calls, 1);
});
test("Parent web login is rejected and its newly created session revoked", async () => {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    return success(url.endsWith("logout") ? { revoked: true } : auth("PARENT"));
  };
  const result = await route.POST(
    request("/api/backend/auth/login", "POST", {
      email: "parent@example.com",
      password: "StrongPass123!",
      rememberMe: false,
    }),
    context("auth/login"),
  );
  assert.equal(result.status, 403);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /auth\/logout$/);
});
test("Parallel expired requests rotate one refresh token once and each retry with the new access token", async () => {
  let refreshCalls = 0;
  let retried = 0;
  global.fetch = async (url, init) => {
    if (url.endsWith("auth/refresh")) {
      refreshCalls++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return success(auth());
    }
    if (init.headers.Authorization === "Bearer access-new") {
      retried++;
      return success([]);
    }
    return failure(401, "AUTH_UNAUTHORIZED");
  };
  const req = request(
    "/api/backend/classes",
    "GET",
    undefined,
    "edugrade_access=access-old; edugrade_refresh=refresh-old",
  );
  const results = await Promise.all([
    server.authorizedBackendFetch(req, "classes"),
    server.authorizedBackendFetch(req, "programs"),
    server.authorizedBackendFetch(req, "auth/me"),
  ]);
  assert.equal(refreshCalls, 1);
  assert.equal(retried, 3);
  assert.equal(
    results.every(
      (result) => result.renewed.tokens.refreshToken === "refresh-new",
    ),
    true,
  );
});
test("Refresh outage preserves cookies and can retry; invalid refresh clears session cookies", async () => {
  const req = request(
    "/api/backend/classes",
    "GET",
    undefined,
    "edugrade_access=old; edugrade_refresh=refresh-outage",
  );
  let refreshCalls = 0;
  global.fetch = async (url) =>
    url.endsWith("auth/refresh")
      ? (refreshCalls++, failure(503, "BACKEND_UNAVAILABLE"))
      : failure(401, "AUTH_UNAUTHORIZED");
  const result = await route.GET(req, context("classes"));
  assert.equal(result.status, 503);
  assert.equal(result.headers.get("set-cookie"), null);
  await route.GET(req, context("classes"));
  assert.equal(refreshCalls, 2);
  global.fetch = async () => failure(401, "AUTH_INVALID_REFRESH_TOKEN");
  const invalid = await route.GET(req, context("classes"));
  assert.equal(invalid.status, 401);
  assert.match(invalid.headers.get("set-cookie"), /Max-Age=0/i);
});
test("Server routing ignores forged role cookies and overwrites role request headers", async () => {
  global.fetch = async () => success(user("STAFF"));
  const forged = request(
    "/manager/classes",
    "GET",
    undefined,
    "edugrade_access=valid; edugrade_role=center_manager",
  );
  forged.headers.set("x-edugrade-verified-role", "center_manager");
  const denied = await proxy(forged);
  assert.equal(denied.status, 403);
  assert.match(await denied.text(), /Không có quyền truy cập/);
  const allowedRequest = request(
    "/staff/enrollments/new",
    "GET",
    undefined,
    "edugrade_access=valid; edugrade_role=center_manager",
  );
  allowedRequest.headers.set("x-edugrade-verified-role", "center_manager");
  const allowed = await proxy(allowedRequest);
  assert.equal(
    allowed.headers.get("x-middleware-request-x-edugrade-verified-role"),
    "staff",
  );
  const missing = await proxy(
    request(
      "/manager/dashboard",
      "GET",
      undefined,
      "edugrade_role=center_manager",
    ),
  );
  assert.equal(missing.status, 307);
  assert.match(missing.headers.get("location"), /\/login$/);
});
test("Expired page navigation defers rotation to the shared restore handler and keeps its return URL", async () => {
  let rotations = 0;
  global.fetch = async (url, init) => {
    if (url.endsWith("auth/refresh")) {
      rotations++;
      return success(auth());
    }
    return init.headers.Authorization === "Bearer access-new"
      ? success(user())
      : failure(401, "AUTH_UNAUTHORIZED");
  };
  const cookies = "edugrade_access=access-old; edugrade_refresh=refresh-old";
  const pageRequest = request(
    "/staff/enrollments/new?registrationId=order-1",
    "GET",
    undefined,
    cookies,
  );
  pageRequest.headers.set("host", "127.0.0.1:3001");
  const redirect = await proxy(pageRequest);
  assert.equal(rotations, 0);
  const location = new URL(redirect.headers.get("location"));
  assert.equal(location.host, "127.0.0.1:3001");
  assert.equal(location.pathname, "/api/auth/restore");
  const result = await restoreRoute.GET(
    request(location.pathname + location.search, "GET", undefined, cookies),
  );
  assert.equal(rotations, 1);
  assert.match(
    result.headers.get("location"),
    /\/staff\/enrollments\/new\?registrationId=order-1$/,
  );
  assert.match(result.headers.get("set-cookie"), /access-new/);
});

test("Origin validation accepts browser-facing loopback Host and rejects other origins", () => {
  const req = request("/api/backend/auth/login", "POST", {});
  req.headers.set("host", "127.0.0.1:3001");
  req.headers.set("origin", "http://127.0.0.1:3001");
  assert.equal(server.isSameOriginRequest(req), true);
  req.headers.set("origin", "https://other.example");
  assert.equal(server.isSameOriginRequest(req), false);
  req.headers.delete("origin");
  assert.equal(server.isSameOriginRequest(req), false);
});

test("Cross-origin writes are rejected before reaching backend", async () => {
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return success(auth());
  };
  const req = request("/api/backend/registrations", "POST", {});
  req.headers.set("origin", "https://other.example");
  const result = await route.POST(req, context("registrations"));
  assert.equal(result.status, 403);
  assert.equal(calls, 0);
});
test("Payment key and receipt body survive retries and are scoped by operator and registration", () => {
  const values = new Map();
  global.sessionStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const first = storage.getPaymentAttempt("staff-1", "order-1", "RCPT-001");
  const second = storage.getPaymentAttempt("staff-1", "order-1", "CHANGED");
  assert.deepEqual(second, first);
  assert.deepEqual(second.body, { receiptNumber: "RCPT-001" });
  assert.notEqual(
    storage.getPaymentAttempt("staff-1", "order-2", "").key,
    first.key,
  );
  assert.notEqual(
    storage.getPaymentAttempt("staff-2", "order-1", "").key,
    first.key,
  );
});
test("Confirmation timeout recovers a completed registration receipt without a second payment POST", async () => {
  const calls = [];
  apiClient.apiRequest = async (path, options) => {
    calls.push({ path, options });
    if (path.endsWith("confirm-payment"))
      throw new apiClient.ApiError("NETWORK_ERROR", "timeout", 0);
    if (path.endsWith("receipt"))
      return { registrationId: "order-1", status: "COMPLETED" };
    return { status: "COMPLETED" };
  };
  const receipt = await registrationApi.confirm("order-1", "stable-key", {
    receiptNumber: "RCPT-001",
  });
  assert.equal(receipt.status, "COMPLETED");
  assert.equal(
    calls.filter((call) => call.options?.method === "POST").length,
    1,
  );
  assert.equal(calls[0].options.idempotencyKey, "stable-key");
});
test("Business payment conflicts are not retried; draft requests only contain contract fields", async () => {
  let calls = [];
  apiClient.apiRequest = async (path, options) => {
    calls.push({ path, options });
    throw new apiClient.ApiError("CLASS_FULL", "full", 409);
  };
  await assert.rejects(registrationApi.confirm("order-1", "key", {}), /sĩ số/);
  assert.equal(calls.length, 1);
  calls = [];
  apiClient.apiRequest = async (path, options) => {
    calls.push({ path, options });
    return {};
  };
  await registrationApi.draft({
    targetStudentId: "child-1",
    classId: "class-1",
    subject: "Toán",
    startDate: "2026-10-05",
    packageMonths: 3,
    hasReceivedPayment: false,
    receiptNumber: "",
  });
  assert.deepEqual(calls[0].options.body, {
    targetStudentId: "child-1",
    classId: "class-1",
    startDate: "2026-10-05",
    packageMonths: 3,
  });
});
test("List loading fetches all backend pages without inventing totals or dropping rows", async () => {
  let calls = 0;
  apiClient.apiRequest = async (path) => {
    calls++;
    const page = Number(
      new URL(`http://test/${path}`).searchParams.get("page"),
    );
    return Array.from({ length: page === 1 ? 100 : 2 }, (_, index) => ({
      id: `${page}-${index}`,
    }));
  };
  assert.equal((await registrationApi.programs()).length, 102);
  assert.equal(calls, 2);
});
