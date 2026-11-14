const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");

async function withServer(responses, check) {
  let calls = 0;
  const server = http.createServer((request, response) => {
    assert.equal(request.url, "/api/health");
    const item = responses[Math.min(calls++, responses.length - 1)];
    response.writeHead(item.status || 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(item.body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await check(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("deployment readiness accepts the expected public commit", async () => {
  const { verifyDeployment } = await import("./deployment-readiness.mjs");
  await withServer(
    [{ body: { status: "ok", commit: "new" } }],
    async (origin) => {
      const result = await verifyDeployment({
        origin,
        expectedCommit: "new",
        attempts: 1,
      });
      assert.equal(result.commit, "new");
    },
  );
});

test("deployment readiness waits through an old public version", async () => {
  const { verifyDeployment } = await import("./deployment-readiness.mjs");
  await withServer(
    [
      { body: { status: "ok", commit: "old" } },
      { body: { status: "ok", commit: "new" } },
    ],
    async (origin) => {
      const result = await verifyDeployment({
        origin,
        expectedCommit: "new",
        attempts: 2,
        intervalMs: 0,
      });
      assert.equal(result.attempt, 2);
    },
  );
});

for (const [name, response] of [
  ["old image", { body: { status: "ok", commit: "old" } }],
  ["failed status", { status: 503, body: { status: "ok", commit: "new" } }],
  ["unready application", { body: { status: "starting", commit: "new" } }],
]) {
  test(`deployment readiness rejects ${name}`, async () => {
    const { verifyDeployment } = await import("./deployment-readiness.mjs");
    await withServer([response], async (origin) => {
      await assert.rejects(
        verifyDeployment({ origin, expectedCommit: "new", attempts: 1 }),
        /did not become ready/,
      );
    });
  });
}
