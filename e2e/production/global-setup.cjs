const { settings, validateSettings } = require("./settings.cjs");
const { selection } = require("./selection.cjs");
const { command } = require("./command.cjs");

module.exports = async function prepareProduction() {
  const plan = selection();
  const config = validateSettings(settings(), {
    auth: plan.auth,
    providers: plan.providers,
  });
  const ready = await fetch(`${config.api}/health/ready`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!ready.ok)
    throw new Error(`Production readiness failed: HTTP ${ready.status}.`);
  if (!plan.auth) return;
  if (await command("e2e/production/prepare.mjs"))
    throw new Error(
      "Production authentication failed; no new fixture was created.",
    );
  if (plan.write && (await command("e2e/production/fixture.mjs")))
    throw new Error(
      "Production fixture preparation failed. Inspect its private manifest before continuing.",
    );
  if (plan.write && !plan.keepFixture) {
    return async () => {
      if (await command("e2e/production/cleanup.mjs"))
        throw new Error(
          "Production fixture cleanup failed; run npm run test:e2e:production:cleanup.",
        );
    };
  }
};
