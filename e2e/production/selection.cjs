function selection(args = [], env = process.env) {
  const flag = (argument, variable) =>
    args.includes(argument) || env[variable] === "1";
  const publicOnly = flag("--public", "E2E_PRODUCTION_PUBLIC");
  const services = flag("--services", "E2E_PRODUCTION_SERVICES");
  const full = args.includes("--full");
  const write = services || full || flag("--write", "E2E_PRODUCTION_WRITE");
  const providers =
    services || full || flag("--providers", "E2E_PRODUCTION_PROVIDERS");
  if (publicOnly && (write || providers))
    throw new Error(
      "Public checks cannot be combined with write/provider profiles.",
    );
  const recheckAi = services || full || flag("--recheck-ai", "E2E_RECHECK_AI");
  const headed = flag("--headed", "E2E_HEADED");
  const ui = args.includes("--ui");
  const keepFixture =
    ui || flag("--keep-fixture", "E2E_PRODUCTION_KEEP_FIXTURE");
  const runFlags = [
    "--public",
    "--services",
    "--full",
    "--write",
    "--providers",
    "--recheck-ai",
    "--keep-fixture",
    "--no-open",
    "--no-publish",
  ];
  const files = services
    ? ["03-providers.spec.ts", "04-business.spec.ts"]
    : [
        "00-production.spec.ts",
        ...(!publicOnly ? ["01-routes.spec.ts", "02-api.spec.ts"] : []),
        ...(providers ? ["03-providers.spec.ts"] : []),
        ...(write
          ? [
              "04-business.spec.ts",
              "05-dynamic-routes.spec.ts",
              "06-curriculum.spec.ts",
              "07-attachments.spec.ts",
              "08-admin.spec.ts",
              "09-contract-updates.spec.ts",
            ]
          : []),
      ];
  return {
    auth: !publicOnly,
    write,
    providers,
    recheckAi,
    headed,
    ui,
    keepFixture,
    files,
    mode: publicOnly
      ? "public"
      : services
        ? "services"
        : write
          ? "full"
          : "read-only",
    playwrightArgs: args.filter((argument) => !runFlags.includes(argument)),
    environment: {
      E2E_PRODUCTION_PUBLIC: publicOnly ? "1" : "0",
      E2E_PRODUCTION_SERVICES: services ? "1" : "0",
      E2E_PRODUCTION_WRITE: write ? "1" : "0",
      E2E_PRODUCTION_PROVIDERS: providers ? "1" : "0",
      E2E_RECHECK_AI: recheckAi ? "1" : "0",
      E2E_HEADED: headed ? "1" : "0",
      E2E_PRODUCTION_KEEP_FIXTURE: keepFixture ? "1" : "0",
    },
  };
}

module.exports = { selection };
