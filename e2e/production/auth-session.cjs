const { setTimeout: delay } = require("node:timers/promises");
const { maskSession } = require("./secrets.cjs");
const expectedRole = (role) =>
  role === "designer" ? "CURRICULUM_DESIGNER" : role.toUpperCase();
const matchesAccount = (session, config, role) =>
  session?.user?.email === config.accounts[role] &&
  session.user.role === expectedRole(role);

function reusableSession(session, config, role, now = Date.now()) {
  if (!matchesAccount(session, config, role) || !session.tokens?.refreshToken)
    return false;
  try {
    const claims = JSON.parse(
      Buffer.from(session.tokens.accessToken.split(".")[1], "base64url"),
    );
    return claims.exp > now / 1000 + 120;
  } catch {
    return false;
  }
}

async function authenticate(role, config, previous, options = {}) {
  const request = options.request || fetch;
  const wait = options.wait || delay;
  const now = options.now || Date.now;
  maskSession(previous);
  if (reusableSession(previous, config, role, now())) {
    let current;
    try {
      current = await request(`${config.api}/auth/me`, {
        method: "GET",
        redirect: "error",
        signal: AbortSignal.timeout(20000),
        headers: { Authorization: `Bearer ${previous.tokens.accessToken}` },
      });
    } catch {
      throw new Error(`Production ${role} session could not be verified.`);
    }
    if (current.ok) {
      const body = await current.json();
      if (matchesAccount({ user: body.data }, config, role)) return previous;
    } else {
      await current.body?.cancel();
    }
  }
  const post = async (route, body) => {
    try {
      return await request(`${config.api}/auth/${route}`, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(20000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(
        `Production ${role} authentication could not reach the API.`,
      );
    }
  };
  const accept = async (response) => {
    const session = (await response.json()).data;
    maskSession(session);
    if (!reusableSession(session, config, role, now()))
      throw new Error(
        `Production ${role} authentication returned an invalid account/session.`,
      );
    return session;
  };
  if (matchesAccount(previous, config, role) && previous.tokens?.refreshToken) {
    const refresh = await post("refresh", {
      refreshToken: previous.tokens.refreshToken,
    });
    if (refresh.ok) return accept(refresh);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await post("login", {
      email: config.accounts[role],
      password: config.passwords[role],
    });
    if (response.status === 429 && attempt < 2) {
      const seconds = Number(response.headers.get("retry-after") || 60);
      console.log(`Production ${role}: waiting for the login rate limit.`);
      await wait(
        (Number.isFinite(seconds) ? Math.max(1, Math.min(60, seconds)) : 60) *
          1000 +
          100,
      );
      continue;
    }
    if (!response.ok)
      throw new Error(
        `Production ${role} login failed: HTTP ${response.status}.`,
      );
    return accept(response);
  }
}

module.exports = { reusableSession, authenticate };
