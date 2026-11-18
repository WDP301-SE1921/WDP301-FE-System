const { spawn } = require("node:child_process");
const { root } = require("./settings.cjs");

async function command(script, args = [], environment = process.env) {
  const status = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: root,
      env: environment,
      windowsHide: true,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", resolve);
  });
  return typeof status === "number" ? status : 1;
}

module.exports = { command };
