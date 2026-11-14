const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const backendRequire = createRequire(path.join(process.cwd(), "package.json"));
const { ConfigService } = backendRequire("@nestjs/config");
const { AcademicAiService } = backendRequire(
  "./dist/integrations/academic-ai.service.js",
);
const { SubmissionReaderService } = backendRequire(
  "./dist/modules/academic/submission-reader.service.js",
);
async function main() {
  const settings = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  const ai = new AcademicAiService(
    new ConfigService({
      academic: {
        visionUrl: settings.aiUrl,
        visionKey: settings.aiKey,
        visionModel: settings.visionModel,
      },
    }),
  );
  const buffer = fs.readFileSync(process.argv[2]);
  const reader = new SubmissionReaderService(ai, {
    readObject: async () => buffer,
  });
  const rows = await reader.read(
    [
      {
        id: "pdf",
        storageKey: "synthetic",
        mimeType: "application/pdf",
        size: buffer.length,
      },
    ],
    [{ id: "q2", prompt: "Question 2: Solve 2x + 3 = 7", kind: "ESSAY" }],
    [{ questionId: "q2", answer: "", fileIds: ["pdf"] }],
  );
  console.log(
    JSON.stringify(
      {
        platform: process.platform,
        provider: new URL(settings.aiUrl).hostname,
        model: settings.visionModel,
        rows,
      },
      null,
      2,
    ),
  );
  if (!rows[0]?.readable || !rows[0]?.answer.includes("2"))
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(error.name, error.code || error.message);
  process.exitCode = 1;
});
