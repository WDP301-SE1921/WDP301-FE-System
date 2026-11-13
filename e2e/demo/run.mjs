import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import environment from "./environment.cjs";
const { root, backend, mobile, env } = environment;

const args = process.argv.slice(2);
const system = args.includes("--system");
const runtime = path.join(root, "e2e/.demo-runtime");
fs.mkdirSync(runtime, { recursive: true });
const running = [];
const node = process.execPath;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function command(file, commandArgs, cwd = root, customEnv = env) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, commandArgs, {
      cwd,
      env: customEnv,
      windowsHide: true,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `${path.basename(file)} ${commandArgs[0]} exited ${code}`,
            ),
          ),
    );
  });
}
function service(name, file, commandArgs, cwd, customEnv = env) {
  const output = fs.openSync(path.join(runtime, `${name}.log`), "a");
  const child = spawn(file, commandArgs, {
    cwd,
    env: customEnv,
    windowsHide: true,
    stdio: ["ignore", output, output],
  });
  child.on("error", (error) => console.error(name, error.message));
  running.push(child);
  return child;
}
async function ready(url, child, limit = 120_000) {
  const until = Date.now() + limit;
  while (Date.now() < until) {
    if (child?.exitCode !== null && child?.exitCode !== undefined)
      throw new Error(
        `Service exited before ${url}; inspect e2e/.demo-runtime/*.log`,
      );
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(3000) })).ok) return;
    } catch {}
    await pause(500);
  }
  throw new Error(`Service did not become ready: ${url}`);
}
async function assertFree(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", () =>
      reject(
        new Error(
          `Port ${port} is occupied. Stop its process before starting the isolated test system.`,
        ),
      ),
    );
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}
function stop() {
  for (const child of running.reverse()) {
    if (child.exitCode !== null) continue;
    if (process.platform === "win32")
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
    else child.kill("SIGTERM");
  }
}
process.on("SIGINT", () => {
  stop();
  process.exit(130);
});
process.on("SIGTERM", () => {
  stop();
  process.exit(143);
});

try {
  if (!args.includes("--reuse")) {
    for (const port of [
      3000,
      3001,
      8081,
      3900,
      1026,
      ...(system ? [5173] : []),
    ])
      await assertFree(port);
    await command(node, [
      path.join(root, "node_modules/@playwright/test/cli.js"),
      "install",
      "ffmpeg",
    ]);
    await command("docker", [
      "compose",
      "-f",
      "e2e/demo/compose.yml",
      "up",
      "-d",
      "--wait",
    ]);
    await ready("http://127.0.0.1:9002/minio/health/ready");
    const prisma = path.join(backend, "node_modules/prisma/build/index.js");
    console.log(
      "Generating Prisma client and applying migrations to edugrade_e2e only...",
    );
    await command(node, [prisma, "generate"], backend);
    await command(node, [prisma, "migrate", "deploy"], backend);
    await command(
      node,
      [
        path.join(backend, "node_modules/ts-node/dist/bin.js"),
        "--transpile-only",
        "src/database/seed.ts",
      ],
      backend,
    );
    const require = createRequire(path.join(backend, "package.json"));
    const {
      S3Client,
      HeadBucketCommand,
      CreateBucketCommand,
    } = require("@aws-sdk/client-s3");
    const s3 = new S3Client({
      endpoint: env.STORAGE_ENDPOINT,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY,
        secretAccessKey: env.STORAGE_SECRET_KEY,
      },
    });
    try {
      await s3.send(new HeadBucketCommand({ Bucket: env.STORAGE_BUCKET }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: env.STORAGE_BUCKET }));
    }
    s3.destroy();
    if (!args.includes("--skip-build")) {
      console.log("Building the latest API and web application...");
      await command(
        node,
        [path.join(backend, "node_modules/@nestjs/cli/bin/nest.js"), "build"],
        backend,
      );
      await command(
        node,
        [
          path.join(root, "node_modules/next/dist/bin/next"),
          "build",
          "--webpack",
        ],
        root,
        { ...env, NODE_ENV: "production" },
      );
    }
    service("providers", node, ["e2e/demo/providers.mjs"], root);
    await ready("http://127.0.0.1:3900");
    const api = service("api", node, ["dist/main.js"], backend);
    await ready("http://localhost:3000/api/v1/health/ready", api);
    const web = service(
      "web",
      node,
      ["node_modules/next/dist/bin/next", "start", "-p", "3001"],
      root,
      { ...env, NODE_ENV: "production" },
    );
    await ready("http://localhost:3001/login", web);
    const app = service(
      "mobile",
      node,
      [
        "node_modules/expo/bin/cli",
        "start",
        "--web",
        "--port",
        "8081",
        "--clear",
      ],
      mobile,
      { ...env, NODE_ENV: "development", CI: "1" },
    );
    await ready("http://localhost:8081", app, 180_000);
    fs.writeFileSync(
      path.join(runtime, "processes.json"),
      JSON.stringify(running.map((child) => child.pid)),
    );
  }
  if (system) {
    let adminReady = false;
    if (args.includes("--reuse"))
      try {
        adminReady = (await fetch("http://localhost:5173")).ok;
      } catch {}
    if (!adminReady) {
      const admin = service(
        "admin",
        node,
        ["e2e/system/admin-server.mjs"],
        root,
      );
      await ready("http://localhost:5173", admin);
    }
  }
  if (args.includes("--serve")) {
    console.log(
      "E2E environment ready: web localhost:3001, parent localhost:8081, API localhost:3000. Ctrl+C stops the servers, preserves test DB.",
    );
    await new Promise(() => {});
  }
  const testArgs = args.filter(
    (arg) => !["--reuse", "--skip-build", "--headed", "--system"].includes(arg),
  );
  const headed = args.includes("--headed");
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      node,
      [
        path.join(root, "node_modules/@playwright/test/cli.js"),
        "test",
        "-c",
        system ? "playwright.system.config.ts" : "playwright.demo.config.ts",
        ...testArgs,
      ],
      {
        cwd: root,
        env: { ...env, E2E_HEADED: headed ? "1" : "0" },
        windowsHide: true,
        stdio: "inherit",
      },
    );
    child.on("error", reject);
    child.on("exit", resolve);
  });
  process.exitCode = typeof result === "number" ? result : 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  stop();
}
