const fs = require("node:fs");
const path = require("node:path");
const { envFile } = require("./settings.cjs");

function createEnvFile(target = envFile) {
  try {
    fs.writeFileSync(
      target,
      fs.readFileSync(path.join(__dirname, ".env.example")),
      {
        flag: "wx",
        mode: 0o600,
      },
    );
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}

module.exports = { createEnvFile };
