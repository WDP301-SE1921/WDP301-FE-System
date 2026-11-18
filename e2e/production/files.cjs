const fs = require("node:fs");
const path = require("node:path");

exports.answerPdf = async function answerPdf() {
  return fs.readFileSync(path.join(__dirname, "fixtures/math-answer.pdf"));
};
