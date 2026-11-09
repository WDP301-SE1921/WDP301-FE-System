self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: "EduGrade",
      body: event.data ? event.data.text() : "Bạn có thông báo mới.",
    };
  }
  const title = payload.title || "EduGrade";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "Bạn có thông báo mới.",
      tag: payload.tag || "edugrade-notification",
      data: payload.data || { url: "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href;
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const existing = windows.find((client) => client.url === target);
        if (existing) return existing.focus();
        return clients.openWindow(target);
      }),
  );
});
