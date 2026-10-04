const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

test(
  "Built Next app: manager configuration, staff registration, payment replay, receipt and logout",
  { timeout: 120000 },
  async () => {
    let payments = 0;
    let expireStaffAccess = false;
    let rotations = 0;
    const programs = [];
    const classes = [];
    const orders = new Map();
    const receipts = new Map();
    const replies = new Map();
    const parent = {
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Phụ huynh",
      status: "ACTIVE",
      emailVerifiedAt: "2026-10-02T03:00:00Z",
      parentProfile: {
        id: "profile-1",
        phone: null,
        students: [
          {
            id: "child-1",
            fullName: "Nguyễn An",
            grade: 8,
            status: "ACTIVE",
            dateOfBirth: null,
          },
          {
            id: "child-2",
            fullName: "Nguyễn Bình",
            grade: 6,
            status: "ACTIVE",
            dateOfBirth: null,
          },
        ],
      },
    };
    const backend = http.createServer(async (req, res) => {
      let text = "";
      for await (const chunk of req) text += chunk;
      const body = text ? JSON.parse(text) : {};
      const url = new URL(req.url, "http://fixture");
      const route = url.pathname.replace("/api/v1/", "");
      const role = req.headers.authorization?.includes("MANAGER")
        ? "MANAGER"
        : "STAFF";
      const send = (data, status = 200) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, data }));
      };
      const error = (code, status) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: { code, message: code, requestId: "fixture-request" },
          }),
        );
      };
      const user = (role) => ({
        id: role === "MANAGER" ? "manager-1" : "staff-1",
        email: `${role.toLowerCase()}@example.com`,
        displayName: role === "MANAGER" ? "Quản lý" : "Nhân viên",
        role,
        status: "ACTIVE",
        emailVerifiedAt: null,
      });
      if (route === "auth/register") {
        assert.deepEqual(Object.keys(body).sort(), ["email", "password"]);
        return send(
          {
            user: { ...user("PARENT"), email: body.email },
            tokens: {
              accessToken: "fixture-PARENT",
              refreshToken: "fixture-refresh-PARENT",
              tokenType: "Bearer",
              expiresIn: 900,
            },
          },
          201,
        );
      }
      if (route === "auth/login") {
        if (body.password !== "FixturePass123!")
          return error("AUTH_INVALID_CREDENTIALS", 401);
        const role = body.email.startsWith("manager") ? "MANAGER" : "STAFF";
        return send({
          user: user(role),
          tokens: {
            accessToken: `fixture-${role}`,
            refreshToken: `fixture-refresh-${role}`,
            tokenType: "Bearer",
            expiresIn: 900,
          },
        });
      }
      if (route === "auth/refresh") {
        if (body.refreshToken !== "fixture-refresh-STAFF" || rotations > 0)
          return error("AUTH_INVALID_REFRESH_TOKEN", 401);
        rotations++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return send({
          user: user("STAFF"),
          tokens: {
            accessToken: "fixture-STAFF-new",
            refreshToken: "fixture-refresh-STAFF-new",
            tokenType: "Bearer",
            expiresIn: 900,
          },
        });
      }
      if (
        expireStaffAccess &&
        req.headers.authorization === "Bearer fixture-STAFF"
      )
        return error("AUTH_UNAUTHORIZED", 401);
      if (!req.headers.authorization?.startsWith("Bearer fixture-"))
        return error("AUTH_UNAUTHORIZED", 401);
      if (route === "auth/me") return send(user(role));
      if (route === "auth/logout") return send({ revoked: true });
      if (route === "parents/search")
        return send(
          parent.email.includes(url.searchParams.get("email"))
            ? [
                {
                  id: parent.id,
                  email: parent.email,
                  displayName: parent.displayName,
                  status: parent.status,
                },
              ]
            : [],
        );
      if (route === "parents/lookup")
        return url.searchParams.get("email") === parent.email
          ? send(parent)
          : error("PARENT_NOT_FOUND", 404);
      if (route === "programs") {
        if (req.method === "POST") {
          if (role !== "MANAGER") return error("FORBIDDEN", 403);
          const row = { id: "program-1", ...body };
          programs.push(row);
          return send(row, 201);
        }
        return send(programs);
      }
      if (route === "classes") {
        if (req.method === "POST") {
          if (role !== "MANAGER") return error("FORBIDDEN", 403);
          const row = {
            id: "class-1",
            ...body,
            teacherId: body.teacherId ?? null,
            program: programs.find((item) => item.id === body.programId),
            weeklySchedules: [],
            monthlyFee: String(body.monthlyFee),
          };
          classes.push(row);
          return send(row, 201);
        }
        return send(classes);
      }
      if (route === "classes/class-1/schedules") {
        if (role !== "MANAGER") return error("FORBIDDEN", 403);
        classes[0].weeklySchedules = body.schedules;
        return send(classes[0]);
      }
      if (route === "classes/class-1" && req.method === "PATCH") {
        if (role !== "MANAGER") return error("FORBIDDEN", 403);
        Object.assign(classes[0], body);
        return send(classes[0]);
      }
      if (route === "registrations" && req.method === "POST") {
        assert.deepEqual(
          Object.keys(body).sort(),
          ["classId", "packageMonths", "startDate", "targetStudentId"].sort(),
        );
        const child = parent.parentProfile.students.find(
          (child) => child.id === body.targetStudentId,
        );
        const row = {
          id: "order-1",
          ...body,
          parentEmail: parent.email,
          studentFullName: child.fullName,
          studentGrade: child.grade,
          targetStudent: child,
          class: classes[0],
          quotedAmount: "2400000.00",
          currency: "VND",
          endDate: "2027-01-05",
          status: "DRAFT",
        };
        orders.set(row.id, row);
        return send(row, 201);
      }
      if (route === "registrations/order-1/confirm-payment") {
        const key = req.headers["idempotency-key"];
        if (!key) return error("IDEMPOTENCY_KEY_REQUIRED", 409);
        if (replies.has(key)) return send(replies.get(key));
        const order = orders.get("order-1");
        if (order.status !== "DRAFT")
          return error("REGISTRATION_NOT_DRAFT", 409);
        order.status = "COMPLETED";
        payments++;
        const receipt = {
          registrationId: order.id,
          status: "COMPLETED",
          parentEmail: parent.email,
          student: {
            fullName: order.studentFullName,
            grade: order.studentGrade,
          },
          class: {
            id: "class-1",
            name: classes[0].name,
            subject: "Toán",
            grade: 8,
            schedules: classes[0].weeklySchedules,
          },
          term: {
            packageMonths: 3,
            startDate: "2026-10-05",
            endDate: "2027-01-05",
            label: "Sắp học",
          },
          payment: {
            id: "payment-1",
            receiptNumber: body.receiptNumber || "FIXTURE-001",
            amount: 2400000,
            currency: "VND",
            confirmedAt: "2026-10-03T03:00:00Z",
          },
          enrollment: { id: "enrollment-1", status: "ACTIVE" },
          quotedAmount: 2400000,
          currency: "VND",
        };
        replies.set(key, receipt);
        receipts.set(order.id, receipt);
        return send(receipt);
      }
      if (route === "registrations/order-1/receipt")
        return send(receipts.get("order-1"));
      if (route === "registrations/order-1") return send(orders.get("order-1"));
      return error("NOT_FOUND", 404);
    });
    await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
    const backendPort = backend.address().port;
    const portProbe = http.createServer();
    await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
    const webPort = portProbe.address().port;
    await new Promise((resolve) => portProbe.close(resolve));
    const origin = `http://127.0.0.1:${webPort}`;
    const app = spawn(
      process.execPath,
      [
        require.resolve("next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        String(webPort),
      ],
      {
        cwd: path.resolve(__dirname, ".."),
        windowsHide: true,
        env: {
          ...process.env,
          BACKEND_API_URL: `http://127.0.0.1:${backendPort}/api/v1`,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let logs = "";
    app.stdout.on("data", (chunk) => {
      logs += chunk.toString();
    });
    app.stderr.on("data", (chunk) => {
      logs += chunk.toString();
    });
    const cookies = new Map();
    async function call(route, method = "GET", body, headers = {}) {
      const response = await fetch(`${origin}${route}`, {
        method,
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        headers: {
          Origin: origin,
          "Content-Type": "application/json",
          Cookie: [...cookies]
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
          ...headers,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const [entry] = cookie.split(";");
        const separator = entry.indexOf("=");
        const key = entry.slice(0, separator);
        const value = entry.slice(separator + 1);
        if (value) cookies.set(key, value);
        else cookies.delete(key);
      }
      return response;
    }
    async function data(route, method, body, headers) {
      const response = await call(
        `/api/backend/${route}`,
        method,
        body,
        headers,
      );
      const payload = await response.json();
      assert.equal(response.ok, true, JSON.stringify(payload));
      return payload.data;
    }
    try {
      let started = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        try {
          const res = await fetch(`${origin}/login`, {
            signal: AbortSignal.timeout(1000),
          });
          if (res.ok) {
            started = true;
            break;
          }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      assert.equal(started, true, logs);
      assert.equal((await call("/activate?token=obsolete")).status, 404);
      const signupPage = await call("/register");
      assert.equal(signupPage.status, 200);
      assert.match(await signupPage.text(), /Đăng ký tài khoản phụ huynh/);
      const signup = await data("auth/register", "POST", {
        email: "new-parent@example.com",
        password: "FixturePass123!",
      });
      assert.deepEqual(signup, { email: "new-parent@example.com" });
      assert.equal(cookies.size, 0);
      const manager = await data("auth/login", "POST", {
        email: "manager@example.com",
        password: "FixturePass123!",
        rememberMe: true,
      });
      assert.equal(manager.user.role, "center_manager");
      assert.equal((await call("/staff/enrollments/new")).status, 403);
      assert.equal(
        (await call("/api/backend/registrations", "POST", {})).status,
        403,
      );
      assert.equal(manager.tokens, undefined);
      const managerPage = await call("/manager/classes");
      assert.equal(managerPage.status, 200);
      assert.match(await managerPage.text(), /Lớp học và lịch tuần/);
      await data("programs", "POST", {
        name: "Toán 8",
        subject: "Toán",
        grade: 8,
      });
      await data("classes", "POST", {
        name: "Toán 8A",
        programId: "program-1",
        capacity: 20,
        monthlyFee: 800000,
        isOpen: false,
      });
      await data("classes/class-1/schedules", "POST", {
        schedules: [{ weekday: 1, startTime: "18:00", endTime: "20:00" }],
      });
      await data("classes/class-1", "PATCH", { isOpen: true });
      await data("auth/logout", "POST");
      const staff = await data("auth/login", "POST", {
        email: "staff@example.com",
        password: "FixturePass123!",
        rememberMe: false,
      });
      assert.equal(staff.user.role, "staff");
      assert.equal(staff.redirectTo, "/staff/enrollments/new");
      assert.equal(
        (await data("parents/search?email=pa&limit=10"))[0].email,
        "parent@example.com",
      );
      assert.equal((await call("/manager/classes")).status, 403);
      const enrollmentPage = await call("/staff/enrollments/new");
      assert.equal(enrollmentPage.status, 200);
      assert.match(await enrollmentPage.text(), /Đăng ký học cho con/);
      assert.equal(
        (await data("parents/lookup?email=parent%40example.com")).parentProfile
          .students.length,
        2,
      );
      assert.equal(
        (
          await data(
            "classes?studentId=child-1&subject=To%C3%A1n&page=1&limit=100",
          )
        )[0].isOpen,
        true,
      );
      const draft = await data("registrations", "POST", {
        targetStudentId: "child-1",
        classId: "class-1",
        startDate: "2026-10-05",
        packageMonths: 3,
      });
      assert.equal(draft.status, "DRAFT");
      assert.equal(draft.quotedAmount, "2400000.00");
      const key = "fixture-payment-key";
      const first = await data(
        "registrations/order-1/confirm-payment",
        "POST",
        {},
        { "Idempotency-Key": key },
      );
      const replay = await data(
        "registrations/order-1/confirm-payment",
        "POST",
        {},
        { "Idempotency-Key": key },
      );
      assert.deepEqual(replay, first);
      assert.equal(payments, 1);
      assert.equal(
        (await data("registrations/order-1/receipt")).enrollment.id,
        "enrollment-1",
      );
      assert.equal((await data("registrations/order-1")).status, "COMPLETED");
      const receiptPage = await call("/staff/payments?registrationId=order-1");
      assert.equal(receiptPage.status, 200);
      expireStaffAccess = true;
      const oldCookies = [...cookies]
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
      const expiredPage = await call(
        "/staff/enrollments/new",
        "GET",
        undefined,
        {
          Cookie: oldCookies,
        },
      );
      const restoreLocation = expiredPage.headers.get("location");
      assert.equal(
        expiredPage.status,
        307,
        `Expired page should redirect: ${expiredPage.status}; ${await expiredPage.text()}`,
      );
      assert.ok(restoreLocation, "Expired page should provide a restore URL");
      const restoreUrl = new URL(restoreLocation, origin);
      assert.equal(restoreUrl.origin, origin);
      assert.equal(restoreUrl.pathname, "/api/auth/restore");
      assert.equal(rotations, 0);
      const [apiRenewal, pageRenewal] = await Promise.all([
        call("/api/backend/classes", "GET", undefined, { Cookie: oldCookies }),
        call(restoreUrl.pathname + restoreUrl.search, "GET", undefined, {
          Cookie: oldCookies,
        }),
      ]);
      assert.equal(apiRenewal.status, 200);
      assert.equal(pageRenewal.status, 307);
      assert.equal(rotations, 1);
      assert.equal((await call("/staff/enrollments/new")).status, 200);
      await data("auth/logout", "POST");
      assert.equal(cookies.size, 0);
      assert.equal((await call("/staff/enrollments/new")).status, 307);
    } finally {
      app.kill();
      backend.closeAllConnections();
      await new Promise((resolve) => backend.close(resolve));
    }
  },
);
