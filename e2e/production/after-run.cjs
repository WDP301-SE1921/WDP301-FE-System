function afterRunPlan(args, environment, config) {
  const ci = environment.CI && !["0", "false"].includes(environment.CI);
  const inspectOnly = args.some((value) =>
    ["--list", "--help", "-h", "--version", "--ui"].includes(value),
  );
  if (ci || inspectOnly) return { publish: false };
  return {
    publish: !args.includes("--no-publish") && config.publishReport !== false,
  };
}

module.exports = { afterRunPlan };
