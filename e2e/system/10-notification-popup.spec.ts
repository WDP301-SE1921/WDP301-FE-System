import { test, expect, unique } from "../demo/world";

interface PopupObservationState {
  observedPopupLabels: string[];
  popupObserver: MutationObserver;
}

test("@updates Popup thông báo realtime ở trang chi tiết, đóng/xem tin và đồng bộ đã đọc", async ({
  world,
  actors,
}) => {
  const f = await world.fixture("notification popup");
  const parent = await actors.open("parent");
  let connected = false;
  parent.on("websocket", (socket) => {
    socket.on("framereceived", ({ payload }) => {
      if (
        typeof payload === "string" &&
        payload.startsWith("40/notifications,")
      )
        connected = true;
    });
  });
  const initial = parent.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/v1/notifications" &&
      response.request().method() === "GET" &&
      response.ok(),
  );
  await parent.goto(`/children/${f.student.id}`);
  await expect.poll(() => connected, { timeout: 30000 }).toBe(true);
  await initial;

  const announce = async (label: string) => {
    const title = unique(label);
    const content = unique(
      "Nội dung đầy đủ gửi phụ huynh từ API thật, gồm thời gian và hướng dẫn liên hệ trung tâm.",
    );
    await world.call("manager", "academic/announcements", "POST", {
      classId: f.classroom.id,
      title,
      content,
    });
    const notification = await world.db.notification.findFirstOrThrow({
      where: { recipientUserId: f.users.parent.id, title },
    });
    return { title, content, notification };
  };

  const first = await announce("Popup đóng tin");
  const firstPopup = parent.getByRole("button", {
    name: `Thông báo mới: ${first.title}. ${first.content}`,
    exact: true,
  });
  await expect(firstPopup).toBeVisible({ timeout: 30000 });
  await parent
    .getByRole("button", { name: "Đóng thông báo nổi", exact: true })
    .click({ timeout: 1000 });
  await expect(firstPopup).toBeHidden({ timeout: 1000 });
  expect(
    (
      await world.db.notification.findUniqueOrThrow({
        where: { id: first.notification.id },
      })
    ).readAt,
  ).toBeNull();

  const second = await announce("Popup mở hộp thư");
  const secondPopup = parent.getByRole("button", {
    name: `Thông báo mới: ${second.title}. ${second.content}`,
    exact: true,
  });
  await expect(secondPopup).toBeVisible({ timeout: 30000 });
  await actors.shot(parent, "updates-parent-popup-on-detail");
  await secondPopup.click();
  await expect(parent).toHaveURL(/\/notifications$/);
  await expect
    .poll(
      async () =>
        (
          await world.db.notification.findUniqueOrThrow({
            where: { id: second.notification.id },
          })
        ).readAt,
    )
    .not.toBeNull();
  await parent
    .getByRole("button", {
      name: `${second.title}. ${second.content}`,
      exact: true,
    })
    .click();
  await expect(
    parent.getByRole("heading", { name: second.title, exact: true }),
  ).toBeVisible();
  await expect(
    parent.getByText(second.content, { exact: true }).last(),
  ).toBeVisible();
  await actors.shot(parent, "updates-parent-notification-detail");
  await parent.getByRole("button", { name: "Đóng", exact: true }).click();

  // The inbox updates live without covering its own header with a second popup.
  await parent.evaluate(() => {
    const state = window as typeof window & PopupObservationState;
    state.observedPopupLabels = [];
    const record = () => {
      for (const element of document.querySelectorAll(
        '[role="button"][aria-label^="Thông báo mới:"]',
      )) {
        state.observedPopupLabels.push(
          element.getAttribute("aria-label") ?? "",
        );
      }
    };
    state.popupObserver = new MutationObserver(record);
    state.popupObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-label", "role"],
    });
    record();
  });
  const third = await announce("Tin realtime trong hộp thư");
  await expect(
    parent.getByRole("button", {
      name: `Chưa đọc. ${third.title}. ${third.content}`,
      exact: true,
    }),
  ).toBeVisible({ timeout: 30000 });
  await expect
    .poll(() =>
      parent.evaluate((id) => {
        const notified: string[] = JSON.parse(
          localStorage.getItem("fem.notifications.notified_ids") ?? "[]",
        );
        return notified.includes(id);
      }, third.notification.id),
    )
    .toBe(true);
  // Observe a full banner lifetime after push sync. Eventual absence alone could hide a
  // wrongly displayed popup that simply auto-dismissed after 5 seconds.
  await parent.waitForTimeout(5500);
  const observed = await parent.evaluate(() => {
    const state = window as typeof window & PopupObservationState;
    state.popupObserver.disconnect();
    return state.observedPopupLabels;
  });
  expect(observed).toEqual([]);
  expect(
    (
      await world.db.notification.findUniqueOrThrow({
        where: { id: third.notification.id },
      })
    ).readAt,
  ).toBeNull();
  await parent.reload();
  await expect(
    parent.getByRole("button", {
      name: `${second.title}. ${second.content}`,
      exact: true,
    }),
  ).toBeVisible();
});
