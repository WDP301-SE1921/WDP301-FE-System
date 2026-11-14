const { createRequire } = require("node:module");
const path = require("node:path");
const { backend } = require("./environment.cjs");
const backendRequire = createRequire(path.join(backend, "package.json"));

exports.answerPdf = async function answerPdf() {
  const PDFDocument = backendRequire("pdfkit");
  const document = new PDFDocument({ size: "A5", margin: 36 });
  const chunks = [];
  const result = new Promise((resolve, reject) => {
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  document.fontSize(18).text("Question 2 - E2E student work");
  document.moveDown().fontSize(15).text("2x + 3 = 7\n2x = 4\nx = 2");
  document.end();
  return result;
};
