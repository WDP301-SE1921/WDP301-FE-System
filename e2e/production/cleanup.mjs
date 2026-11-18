import fs from "node:fs";
import api from "./api.cjs";
import cleanup from "./cleanup-fixture.cjs";
import runner from "./command.cjs";
const file = `${api.runtime}/fixture.json`;
const fixture = JSON.parse(fs.readFileSync(file, "utf8"));
const dryRun = process.argv.includes("--dry-run");
if (fixture.cleanedUp) {
  console.log("This production test fixture was already cleaned up.");
} else {
  if (await runner.command("e2e/production/prepare.mjs"))
    throw new Error(
      "Production cleanup could not authenticate; the ownership manifest was retained.",
    );
  await cleanup.cleanupFixture(api, fixture, {
    dryRun,
    save: () => fs.writeFileSync(file, JSON.stringify(fixture, null, 2)),
    log: console.log,
  });
  if (dryRun)
    console.log(
      "Verified this run's existing resource names/IDs. No changes made.",
    );
  else {
    fs.writeFileSync(
      `${api.runtime}/cleanup-summary.json`,
      JSON.stringify(
        {
          prefix: fixture.prefix,
          cleanedUpAt: fixture.cleanedUpAt,
          states: fixture.cleanup,
          retained: fixture.retained,
        },
        null,
        2,
      ),
    );
    console.log(
      "Only verified E2E resources were cleaned; 0 VND history retained.",
    );
  }
}
