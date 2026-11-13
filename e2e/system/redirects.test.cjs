const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const loaded = { exports: {} };
const source = ts.transpileModule(
  fs.readFileSync(path.join(root, "src/lib/api/server.ts"), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(
  (name) =>
    name === "@/types/backend" ? { BACKEND_ROLE_MAP: {} } : require(name),
  loaded,
  loaded.exports,
);
const { browserRedirectUrl } = loaded.exports;
for (const [internal, host, expected] of [
  [
    "https://localhost:3001/private",
    "edugrade.45.77.168.110.sslip.io",
    "https://edugrade.45.77.168.110.sslip.io/login?next=%2Fteacher",
  ],
  [
    "http://localhost:3001/private",
    "localhost:3001",
    "http://localhost:3001/login?next=%2Fteacher",
  ],
  [
    "https://localhost:3001/private",
    "example.test:8443",
    "https://example.test:8443/login?next=%2Fteacher",
  ],
  [
    "https://localhost:3001/private",
    "[::1]",
    "https://[::1]/login?next=%2Fteacher",
  ],
])
  test(`redirect preserves browser authority ${host}`, () => {
    assert.equal(
      browserRedirectUrl(
        {
          url: internal,
          nextUrl: new URL(internal),
          headers: new Headers({ host }),
        },
        "/login?next=%2Fteacher",
      ).href,
      expected,
    );
  });
