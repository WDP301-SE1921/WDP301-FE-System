const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const backendRequire = createRequire(path.join(process.cwd(), "package.json"));
const pdfRequire = createRequire(backendRequire.resolve("pdf-parse"));
const canvasRequire = createRequire(
  pdfRequire.resolve("pdfjs-dist/package.json"),
);
const { loadImage, createCanvas } = canvasRequire("@napi-rs/canvas");
const { SubmissionReaderService } = backendRequire(
  "./dist/modules/academic/submission-reader.service.js",
);
const buffer = fs.readFileSync(process.argv[2]);
async function main() {
  let darkPixels = 0;
  const service = new SubmissionReaderService(
    {
      visionAvailable: () => true,
      json: async (_instruction, _data, images) => {
        const image = await loadImage(
          Buffer.from(images[0].split(",")[1], "base64"),
        );
        const canvas = createCanvas(image.width, image.height),
          context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(
          0,
          0,
          image.width,
          image.height,
        ).data;
        for (let i = 0; i < pixels.length; i += 4)
          if (
            pixels[i] < 120 &&
            pixels[i + 1] < 120 &&
            pixels[i + 2] < 120 &&
            pixels[i + 3] > 120
          )
            darkPixels++;
        return {
          answers: [
            {
              questionId: "q",
              answer: "x = 2",
              readable: true,
              sources: [{ fileId: "pdf", page: 1 }],
              reason: "",
            },
          ],
        };
      },
    },
    { readObject: async () => buffer },
  );
  await service.read(
    [
      {
        id: "pdf",
        storageKey: "synthetic",
        mimeType: "application/pdf",
        size: buffer.length,
      },
    ],
    [{ id: "q", prompt: "Read the synthetic answer" }],
    [],
  );
  console.log(
    JSON.stringify({
      platform: process.platform,
      darkPixels,
      readable: darkPixels > 1000,
    }),
  );
  if (darkPixels <= 1000) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error.name, error.message);
  process.exitCode = 1;
});
