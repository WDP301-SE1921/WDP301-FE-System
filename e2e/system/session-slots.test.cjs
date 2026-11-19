const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");

/** Loads one TS module of `src`; `stubs` replaces its alias imports. */
function load(file, stubs = {}) {
  const loaded = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(
    (name) => (name in stubs ? stubs[name] : require(name)),
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

const lunar = load("src/lib/lunar-new-year.ts");
const slots = load("src/features/curriculum/session-slots.ts");

test("tetBreaks matches the BE Tết break (23 tháng Chạp to mùng 7)", () => {
  assert.deepEqual(lunar.tetBreaks("2027-01-01", "2027-12-31"), [
    { fromDate: "2027-01-30", toDate: "2027-02-12" },
  ]);
  assert.deepEqual(lunar.tetBreaks("2026-12-01", "2027-01-29"), []);
  assert.equal(lunar.LUNAR_NEW_YEAR.length, lunar.TET_BREAKS.length);
  for (const [index, newYear] of lunar.LUNAR_NEW_YEAR.entries()) {
    const row = lunar.TET_BREAKS[index];
    const days = (a, b) => (Date.parse(b) - Date.parse(a)) / 86_400_000;
    assert.equal(days(newYear, row.toDate), 6, `${newYear} ends at mùng 7`);
    assert.ok([7, 8].includes(days(row.fromDate, newYear)), `${newYear} starts 23 Chạp`);
  }
  assert.ok(lunar.LUNAR_NEW_YEAR.includes("2030-02-02"));
});

test("countSlots skips the Tết break", () => {
  // Mon/Wed/Fri, 2027-02-01 … 2027-02-19: 9 slots, 6 of them inside the break (to 02-12).
  const week = [{ weekday: 1 }, { weekday: 3 }, { weekday: 5 }];
  const from = "2027-02-01";
  const to = "2027-02-19";
  assert.equal(slots.countSlots(week, from, to), 9);
  assert.equal(slots.countSlots(week, from, to, lunar.tetBreaks(from, to)), 3);
});

test("BFF forwards no session cancel and no center-closures route", () => {
  const permissions = load("src/lib/api/backend-permissions.ts");
  for (const [method, route] of [
    ["POST", "academic/sessions/s1/cancel"],
    ["POST", "academic/sessions/s1/cancel-preview"],
    ["POST", "academic/sessions/bulk-cancel"],
    ["POST", "academic/sessions/bulk-cancel-preview"],
    ["GET", "academic/center-closures"],
    ["POST", "academic/center-closures"],
    ["PATCH", "academic/center-closures/c1"],
    ["DELETE", "academic/center-closures/c1"],
  ])
    assert.equal(permissions.backendRule(method, route), undefined, `${method} ${route}`);
  assert.ok(permissions.backendRule("POST", "academic/sessions/s1/reschedule"));
  assert.ok(permissions.backendRule("POST", "academic/sessions/s1/reschedule-preview"));
});

test("backendTimeoutMs has no bulk cancel case", () => {
  const server = load("src/lib/api/server.ts", {
    "@/types/backend": { BACKEND_ROLE_MAP: {} },
  });
  assert.equal(server.backendTimeoutMs("academic/sessions/bulk-cancel"), 25_000);
  assert.equal(server.backendTimeoutMs("academic/assignments/import-preview"), 120_000);
});
