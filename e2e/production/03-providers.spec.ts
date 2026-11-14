import { createRequire } from "node:module";
import path from "node:path";
import { test, expect } from "@playwright/test";
import local from "./settings.cjs";
const config = local.settings();
const requireBackend = createRequire(
  path.resolve(local.root, "../WDP301-BE-System/package.json"),
);
const { ConfigService } = requireBackend("@nestjs/config");
const { AcademicAiService } = requireBackend(
  "./dist/integrations/academic-ai.service.js",
);
const { createTransport } = requireBackend("nodemailer");

test("live DeepSeek text through the backend AI client", async ({}, info) => {
  const service = new AcademicAiService(
    new ConfigService({
      academic: {
        aiUrl: config.aiUrl,
        aiKey: config.aiKey,
        aiModel: config.aiModel,
      },
    }),
  );
  const result = await service.json(
    'Evaluate the synthetic math answer. Return JSON {"correct":boolean,"answer":number}.',
    { question: "2x + 3 = 7", studentAnswer: "x = 2" },
  );
  expect(result).toMatchObject({ correct: true, answer: 2 });
  await info.attach("real text provider result", {
    body: JSON.stringify({
      provider: new URL(config.aiUrl).hostname,
      model: config.aiModel,
      result,
    }),
    contentType: "application/json",
  });
});

test("live DeepSeek vision reads an actual image", async ({ page }, info) => {
  await page.setContent(
    '<main style="background:white;color:black;padding:40px;width:800px;font:36px Arial"><h1>Question 1</h1><p>2x + 3 = 7</p><p>2x = 4</p><p>x = 2</p><p>Code: 73819</p></main>',
  );
  const image = await page.screenshot();
  const service = new AcademicAiService(
    new ConfigService({
      academic: {
        visionUrl: config.aiUrl,
        visionKey: config.aiKey,
        visionModel: config.visionModel,
      },
    }),
  );
  const result = await service.json(
    'Read the actual image. Return JSON {"answer":number,"code":string}. Do not guess.',
    { task: "Read x and the numeric code" },
    [`data:image/png;base64,${image.toString("base64")}`],
  );
  expect(result).toMatchObject({ answer: 2, code: "73819" });
  await info.attach("vision input", { body: image, contentType: "image/png" });
  await info.attach("real vision provider result", {
    body: JSON.stringify({
      provider: new URL(config.aiUrl).hostname,
      model: config.visionModel,
      result,
    }),
    contentType: "application/json",
  });
});

test("real SMTP connects and authenticates", async ({}, info) => {
  const transporter = createTransport(config.smtpUrl, {
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
  try {
    expect(await transporter.verify()).toBe(true);
    await info.attach("SMTP verification", {
      body: JSON.stringify({
        host: new URL(config.smtpUrl).hostname,
        authenticated: true,
        delivery:
          "Authentication only; inbox delivery requires the application outbox test.",
      }),
      contentType: "application/json",
    });
  } finally {
    transporter.close();
  }
});
