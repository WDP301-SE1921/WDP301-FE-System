import { test, expect, unique } from "../demo/world";

test("@latest Lớp bắt buộc có phòng; sĩ số lấy từ phòng và đồng bộ khi đổi sức chứa", async ({
  world,
}) => {
  const f = await world.fixture("room capacity", {
    enroll: false,
    capacity: 6,
  });
  const body = {
    programId: f.program.id,
    name: unique("Lớp theo phòng"),
    monthlyFee: 0,
  };
  const missing = await world.raw("manager", "classes", "POST", body);
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({
    error: { code: "ROOM_REQUIRED" },
  });
  const created = await world.call<{
    id: string;
    roomId: string;
    capacity: number;
  }>("manager", "classes", "POST", {
    ...body,
    roomId: f.room.id,
    capacity: 99,
  });
  expect(created).toMatchObject({ roomId: f.room.id, capacity: 6 });
  await world.call("manager", `classes/${created.id}`, "PATCH", {
    capacity: 99,
  });
  expect(
    (await world.call<{ capacity: number }>("manager", `classes/${created.id}`))
      .capacity,
  ).toBe(6);
  await world.call("manager", `rooms/${f.room.id}`, "PATCH", { capacity: 10 });
  const classes = await world.db.class.findMany({
    where: { roomId: f.room.id, deletedAt: null },
  });
  expect(classes.map((row) => row.id).sort()).toEqual(
    [f.classroom.id, created.id].sort(),
  );
  expect(classes.every((row) => row.capacity === 10)).toBe(true);
  const cleared = await world.raw("manager", `classes/${created.id}`, "PATCH", {
    roomId: null,
  });
  expect(cleared.status).toBe(400);
  expect(await cleared.json()).toMatchObject({
    error: { code: "ROOM_REQUIRED" },
  });
  const other = await world.call<{ id: string }>("manager", "rooms", "POST", {
    name: unique("Phòng nhỏ hơn"),
    capacity: 4,
  });
  await world.call("manager", `classes/${created.id}`, "PATCH", {
    roomId: other.id,
    capacity: 999,
  });
  expect(
    await world.db.class.findUniqueOrThrow({ where: { id: created.id } }),
  ).toMatchObject({ roomId: other.id, capacity: 4 });
});

test("@latest Không thu nhỏ phòng hoặc chuyển lớp khi thiếu chỗ cho học viên đã giữ chỗ", async ({
  world,
}) => {
  const f = await world.fixture("reserved room seats", { capacity: 3 });
  const second = await world.db.studentProfile.create({
    data: {
      parentProfileId: f.student.parentProfileId,
      fullName: unique("Học sinh thứ hai"),
      grade: 8,
    },
  });
  await world.enrollIn(f.classroom.id, second.id);
  const smaller = await world.call<{ id: string }>("manager", "rooms", "POST", {
    name: unique("Phòng một chỗ"),
    capacity: 1,
  });
  for (const [route, body] of [
    [`rooms/${f.room.id}`, { capacity: 1 }],
    [`classes/${f.classroom.id}`, { roomId: smaller.id }],
  ] as const) {
    const denied = await world.raw("manager", route, "PATCH", body);
    expect(denied.status).toBe(409);
    expect(await denied.json()).toMatchObject({
      error: { code: "ROOM_CAPACITY_TOO_SMALL" },
    });
    expect(
      await world.db.room.findUniqueOrThrow({ where: { id: f.room.id } }),
    ).toMatchObject({ capacity: 3 });
    expect(
      await world.db.class.findUniqueOrThrow({ where: { id: f.classroom.id } }),
    ).toMatchObject({ roomId: f.room.id, capacity: 3 });
  }
  const denied = await world.raw("staff", `rooms/${f.room.id}`, "PATCH", {
    capacity: 20,
  });
  expect(denied.status).toBe(403);
});
