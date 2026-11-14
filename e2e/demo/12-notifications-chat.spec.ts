import { io } from "socket.io-client";
import { test, expect, unique, day, instant, select, type Role } from "./world";

test("12 - Thông báo và nhắc học phí", async ({ world, actors }, info) => {
  const f = await world.fixture("notifications");
  await world.db.enrollment.update({
    where: { id: f.enrollment!.id },
    data: { endDate: instant(5, "00:00") },
  });
  const parent = await actors.open("parent");
  await parent.goto("/notifications");
  const auth = await world.login("parent");
  const socket = io("http://localhost:3000/notifications", {
    autoConnect: false,
    transports: ["websocket"],
    auth: { token: auth.tokens.accessToken },
  });
  const realtime: { notificationId?: string }[] = [];
  socket.on("notification.created", (event) => realtime.push(event));
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
      socket.connect();
    });
    const title = unique("Thong bao lop"),
      content = unique("Noi dung gui phu huynh");
    const manager = await actors.open("manager");
    let announcementId = "";
    await test.step("Quản lý lưu thông báo; phụ huynh nhận realtime, không tải lại trang", async () => {
      await manager.goto("/manager/notifications/send");
      await select(manager, "Lớp nhận thông báo", f.classroom.name);
      await manager.getByLabel("Tiêu đề", { exact: true }).fill(title);
      await manager.getByLabel("Nội dung email", { exact: true }).fill(content);
      const responsePromise = manager.waitForResponse(
        (response) =>
          response.url().endsWith("/academic/announcements") &&
          response.request().method() === "POST",
      );
      await manager
        .getByRole("button", { name: "Lưu thông báo", exact: true })
        .click();
      const response = await responsePromise;
      expect(response.ok()).toBe(true);
      announcementId = (await response.json()).data.id;
      const notifications = await world.db.notification.findMany({
        where: { recipientUserId: f.users.parent.id, title },
      });
      expect(notifications).toHaveLength(1);
      await expect
        .poll(
          () =>
            realtime.some(
              (event) => event.notificationId === notifications[0].id,
            ),
          { timeout: 30_000 },
        )
        .toBe(true);
      await expect(parent.getByText(title, { exact: true })).toBeVisible({
        timeout: 30_000,
      });
      await actors.shot(parent, "12-parent-realtime-notice");
    });
    await test.step("Gửi email tới SMTP cục bộ; xác nhận đã gửi và không tạo trùng khi thử lại", async () => {
      await manager
        .getByRole("button", {
          name: `Gửi email thông báo ${title}`,
          exact: true,
        })
        .click();
      const dialog = manager.getByRole("dialog", {
        name: "Gửi email thông báo",
        exact: true,
      });
      await dialog
        .getByRole("checkbox", {
          name: "Xác nhận gửi email đến phụ huynh của lớp",
          exact: true,
        })
        .check();
      await dialog
        .getByRole("button", { name: "Gửi email", exact: true })
        .click();
      await expect(dialog).toBeHidden();
      await expect
        .poll(
          async () =>
            world.db.outboxEvent.count({
              where: {
                aggregateId: announcementId,
                eventType: "ANNOUNCEMENT",
                status: "SENT",
              },
            }),
          { timeout: 30_000 },
        )
        .toBe(1);
      const captured = await (await fetch("http://127.0.0.1:3900")).json();
      expect(
        captured.mail.some((mail: { message: string }) =>
          mail.message.includes(content),
        ),
      ).toBe(true);
      await world.call(
        "manager",
        `academic/announcements/${announcementId}/send-email`,
        "POST",
      );
      expect(
        await world.db.outboxEvent.count({
          where: { aggregateId: announcementId, eventType: "ANNOUNCEMENT" },
        }),
      ).toBe(1);
    });
    await test.step("Nhắc gia hạn cho kỳ sắp hết và lưu thông báo tương ứng", async () => {
      await manager
        .getByRole("tab", { name: "Nhắc học phí", exact: true })
        .click();
      await manager
        .getByLabel("Nhắc các kỳ học kết thúc đến ngày", { exact: true })
        .fill(day(7));
      await manager
        .getByRole("button", { name: "Gửi email nhắc học phí", exact: true })
        .click();
      await expect
        .poll(async () =>
          world.db.notification.count({
            where: {
              recipientUserId: f.users.parent.id,
              targetId: f.enrollment!.id,
              type: "TUITION_REMINDER",
            },
          }),
        )
        .toBe(1);
      await actors.shot(manager, "12-tuition-reminder");
      await info.attach("Email boundary", {
        body: Buffer.from(
          "Email is sent through real SMTP to the local capture server, never to parents' real inboxes. External mail deliverability is not verified.",
        ),
        contentType: "text/plain",
      });
    });
  } finally {
    socket.disconnect();
  }
});

test("13 - Chat nội bộ nhiều vai trò", async ({ world, actors }, info) => {
  const managerAuth = await world.login("manager");
  const staffAuth = await world.login("staff");
  const conversation = await world.call<{ id: string }>(
    "manager",
    "chat/conversations",
    "POST",
    { participantUserId: staffAuth.user.id },
  );
  const manager = await actors.open("manager");
  const staff = await actors.open("staff");
  await manager.goto(`/manager/chat?conversation=${conversation.id}`);
  await staff.goto(`/staff/chat?conversation=${conversation.id}`);
  const message = unique("Tin nhan realtime");
  await test.step("Gửi từ quản lý, nhân viên nhận mà không tải lại và trả lời được", async () => {
    await manager
      .getByRole("textbox", { name: "Nội dung tin nhắn", exact: true })
      .fill(message);
    await manager
      .getByRole("button", { name: "Gửi tin nhắn", exact: true })
      .click();
    await expect(staff.locator("p").filter({ hasText: message })).toBeVisible({
      timeout: 30_000,
    });
    const reply = `${message} - da nhan`;
    await staff
      .getByRole("textbox", { name: "Nội dung tin nhắn", exact: true })
      .fill(reply);
    await staff
      .getByRole("button", { name: "Gửi tin nhắn", exact: true })
      .click();
    await expect(manager.locator("p").filter({ hasText: reply })).toBeVisible({
      timeout: 30_000,
    });
    expect(
      await world.db.chatMessage.count({
        where: {
          conversationId: conversation.id,
          body: { in: [message, reply] },
        },
      }),
    ).toBe(2);
    await actors.shot(manager, "13-manager-realtime-chat");
    await actors.shot(staff, "13-staff-realtime-chat");
  });
  await test.step("Giáo viên và người thiết kế cũng trao đổi được; phụ huynh không vào chat nội bộ", async () => {
    for (const role of ["teacher", "designer"] as Role[]) {
      const auth = await world.login(role);
      const direct = await world.call<{ id: string }>(
        "manager",
        "chat/conversations",
        "POST",
        { participantUserId: auth.user.id },
      );
      const body = unique(`Chat ${role}`);
      await world.call(
        "manager",
        `chat/conversations/${direct.id}/messages`,
        "POST",
        { body },
      );
      const received = await world.call<{ items: { body: string }[] }>(
        role,
        `chat/conversations/${direct.id}/messages`,
      );
      expect(received.items.some((item) => item.body === body)).toBe(true);
      const outsider = await world.raw(
        role,
        `chat/conversations/${conversation.id}/messages`,
      );
      expect(outsider.status).toBe(404);
    }
    const parent = await world.raw("parent", "chat/users");
    expect(parent.status).toBe(403);
    const settings = await world.call<{ enabled: boolean; publicKey: string }>(
      "manager",
      "push/public-key",
    );
    expect(settings).toEqual({ enabled: false, publicKey: "" });
    await info.attach("Web Push boundary", {
      body: Buffer.from(
        "Realtime chat and notification delivery are verified. OS Web Push delivery is not exercised because this isolated environment has no VAPID keys or external push subscription; the API correctly reports push disabled.",
      ),
      contentType: "text/plain",
    });
  });
  expect(managerAuth.user.role).toBe("MANAGER");
});
