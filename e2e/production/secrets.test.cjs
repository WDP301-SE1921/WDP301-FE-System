const assert = require("node:assert/strict");
const { test } = require("node:test");

test("local runs never print a credential while registering masks", () => {
  const { maskValues } = require("./secrets.cjs");
  const output = [];
  maskValues(["synthetic-secret"], {
    ci: false,
    write: (line) => output.push(line),
  });
  assert.deepEqual(output, []);
});

test("Actions masks escape workflow command delimiters and cover encoded credentials", () => {
  const { maskValues } = require("./secrets.cjs");
  const output = [];
  maskValues(["test%token\nline\rvalue"], {
    ci: true,
    write: (line) => output.push(line),
  });
  assert.ok(output.includes("::add-mask::test%25token%0Aline%0Dvalue\n"));
  assert.ok(
    output.some((line) => line.includes("test%2525token%250Aline%250Dvalue")),
  );
  assert.ok(
    output.every(
      (line) =>
        line.startsWith("::add-mask::") && line.split("\n").length === 2,
    ),
  );
});
