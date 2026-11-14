import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

export async function verifyDeployment({
  origin,
  expectedCommit,
  attempts = 40,
  intervalMs = 3000,
}) {
  if (!expectedCommit)
    throw new Error("An expected frontend commit is required.");
  const endpoint = new URL("/api/health", origin);
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
      });
      const body = await response.json();
      if (response.ok && body.status === "ok" && body.commit === expectedCommit)
        return { origin: endpoint.origin, commit: body.commit, attempt };
    } catch {
      // Startup resets and unavailable responses are bounded by attempts/timeouts.
    }
    if (attempt < attempts) await delay(intervalMs);
  }
  throw new Error(
    `Frontend did not become ready at ${endpoint.href} for commit ${expectedCommit}`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  verifyDeployment({ origin: process.argv[2], expectedCommit: process.argv[3] })
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
