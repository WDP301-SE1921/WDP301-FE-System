import local from "./settings.cjs";
import setup from "./setup-env.cjs";
import runner from "./command.cjs";

console.log(
  setup.createEnvFile()
    ? "Created e2e/production/.env. Fill in the team's private credentials once."
    : "Preserved the existing e2e/production/.env.",
);
for (const [name, url] of Object.entries(local.productionLinks()))
  console.log(`${name}: ${url}`);
if (!process.argv.includes("--no-browser"))
  process.exitCode = await runner.command(
    "node_modules/@playwright/test/cli.js",
    ["install", "chromium"],
  );
console.log("Next: npm run test:e2e:production:ui");
