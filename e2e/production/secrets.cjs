const registered = new Set();

function maskValues(
  values,
  {
    ci = process.env.GITHUB_ACTIONS === "true",
    write = (text) => process.stdout.write(text),
  } = {},
) {
  if (!ci) return;
  for (const value of values) {
    if (typeof value !== "string" || !value) continue;
    for (const variant of new Set([value, encodeURIComponent(value)])) {
      if (registered.has(variant)) continue;
      const escaped = variant
        .replace(/%/g, "%25")
        .replace(/\r/g, "%0D")
        .replace(/\n/g, "%0A");
      write(`::add-mask::${escaped}\n`);
      registered.add(variant);
    }
  }
}

function maskEnvironment(env) {
  const values = Object.entries(env)
    .filter(([key]) =>
      /PASSWORD|SECRET|KEY|SMTP_URL|MAIL_FROM|_EMAIL$/i.test(key),
    )
    .map(([, value]) => value);
  if (env.SMTP_URL) {
    try {
      const url = new URL(env.SMTP_URL);
      values.push(
        decodeURIComponent(url.username),
        decodeURIComponent(url.password),
      );
    } catch {
      /* Invalid configuration is reported without its value by the provider check. */
    }
  }
  maskValues(values);
}

function maskSession(session) {
  maskValues([session?.tokens?.accessToken, session?.tokens?.refreshToken]);
}

module.exports = { maskValues, maskEnvironment, maskSession };
