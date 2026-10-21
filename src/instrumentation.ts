/** Warn at startup when BACKEND_API_URL points back at this web server (same localhost port). */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { backendConfigProblem } = await import("@/lib/api/server");
  const problem = backendConfigProblem();
  if (problem) console.error(`[BFF] ${problem}`);
}
