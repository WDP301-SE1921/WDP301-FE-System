const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");

async function withProvider(reply, check) {
  const requests = [];
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    requests.push({
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
      body: JSON.parse(Buffer.concat(chunks).toString()),
    });
    response.writeHead(reply.status || 200, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify(reply.body));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await check(
      `http://127.0.0.1:${server.address().port}/chat/completions`,
      requests,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("real-provider probe sends the configured model and reads structured text", async () => {
  const { aiJson } = require("./providers.cjs");
  await withProvider(
    {
      body: {
        choices: [
          { finish_reason: "stop", message: { content: '{"answer":2}' } },
        ],
      },
    },
    async (url, requests) => {
      const result = await aiJson(
        { url, key: "synthetic-key", model: "text-model" },
        "Solve the equation.",
        { answer: "x = 2" },
      );
      assert.deepEqual(result, { answer: 2 });
      assert.equal(requests.length, 1);
      assert.equal(requests[0].authorization, "Bearer synthetic-key");
      assert.equal(requests[0].body.model, "text-model");
      assert.deepEqual(requests[0].body.response_format, {
        type: "json_object",
      });
      assert.equal(requests[0].body.messages[1].content, '{"answer":"x = 2"}');
    },
  );
});

test("vision probe submits the image with the vision-specific configuration", async () => {
  const { aiJson } = require("./providers.cjs");
  const image = "data:image/png;base64,synthetic-image";
  await withProvider(
    {
      body: {
        choices: [
          { finish_reason: "stop", message: { content: '{"code":"73819"}' } },
        ],
      },
    },
    async (url, requests) => {
      assert.deepEqual(
        await aiJson(
          { url, key: "vision-key", model: "vision-model" },
          "Read the code.",
          {},
          [image],
        ),
        { code: "73819" },
      );
      assert.equal(requests[0].authorization, "Bearer vision-key");
      assert.equal(requests[0].body.model, "vision-model");
      assert.deepEqual(requests[0].body.messages[1].content[1], {
        type: "image_url",
        image_url: { url: image },
      });
    },
  );
});

test("provider rejection does not disclose its response body or the API key", async () => {
  const { aiJson } = require("./providers.cjs");
  await withProvider(
    { status: 401, body: { error: "upstream-private-detail" } },
    async (url) => {
      await assert.rejects(
        aiJson({ url, key: "private-api-key", model: "text" }, "Test", {}),
        (error) => {
          assert.match(error.message, /HTTP 401/);
          assert.doesNotMatch(
            error.message,
            /upstream-private-detail|private-api-key/,
          );
          return true;
        },
      );
    },
  );
});

test("truncated provider responses do not count as successful structured answers", async () => {
  const { aiJson } = require("./providers.cjs");
  await withProvider(
    {
      body: {
        choices: [
          { finish_reason: "length", message: { content: '{"answer":2}' } },
        ],
      },
    },
    async (url) => {
      await assert.rejects(
        aiJson({ url, key: "key", model: "text" }, "Test", {}),
        /incomplete/,
      );
    },
  );
});
