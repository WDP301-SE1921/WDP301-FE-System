const path = require("node:path");
const {
  root: workspaceRoot,
  urls,
  productionLinks,
} = require("./settings.cjs");

function suite(title, type, project, location, parent) {
  const children = [];
  return {
    title,
    type,
    location,
    parent,
    children,
    get suites() {
      return children.filter((item) => item.type !== "test");
    },
    get tests() {
      return children.filter((item) => item.type === "test");
    },
    entries: () => children,
    project: () => project,
    allTests: () =>
      children.flatMap((item) =>
        item.type === "test" ? [item] : item.allTests(),
      ),
    titlePath: () => [...(parent?.titlePath() || []), title],
  };
}

function recordedModel(record, { publish = false } = {}) {
  const project = record.config.projects.find(
    (item) => item.name === "production",
  );
  if (!project)
    throw Error("Recorded results must belong to the production project.");
  const rootDir = record.config.rootDir;
  const config = {
    ...record.config,
    projects: [{ ...project, metadata: {} }],
    metadata: {
      environment: "production",
      mode: record.config.metadata?.mode || "full",
      ...productionLinks(urls),
      recordedRun: record.stats.startTime,
      evidence: publish
        ? "Public report: outcomes and durations; private evidence stays local."
        : "Restored from recorded JSON; no tests were executed to render this report.",
    },
  };
  const root = suite("", "root");
  const projectSuite = suite("production", "project", project, undefined, root);
  root.children.push(projectSuite);
  const location = (item) => ({
    file: path.resolve(rootDir, item.file),
    line: item.line || 1,
    column: item.column || 1,
  });
  const stdio = (entries) =>
    (entries || []).map((item) =>
      typeof item === "string"
        ? item
        : (item.text ?? Buffer.from(item.buffer || "", "base64")),
    );
  const build = (source, parent, type) => {
    const current = suite(
      source.title,
      type,
      project,
      location(source),
      parent,
    );
    parent.children.push(current);
    for (const spec of source.specs || []) {
      for (const saved of spec.tests || []) {
        if (saved.projectName !== "production")
          throw Error(
            "All recorded cases must belong to the production project.",
          );
        const item = {
          type: "test",
          id: spec.id,
          title: spec.title,
          location: location(spec),
          parent: current,
          expectedStatus: saved.expectedStatus,
          timeout: saved.timeout || 180000,
          annotations: publish ? [] : saved.annotations || [],
          tags: publish ? [] : spec.tags || [],
          retries: 0,
          repeatEachIndex: 0,
          outcome: () => saved.status,
          ok: () => ["expected", "flaky", "skipped"].includes(saved.status),
          titlePath: () => [...current.titlePath(), spec.title],
          results: saved.results.map((result) => ({
            ...(!publish ? result : {}),
            status: result.status,
            duration: result.duration,
            retry: result.retry || 0,
            workerIndex: result.workerIndex,
            startTime: new Date(result.startTime),
            steps: [],
            annotations: publish ? [] : result.annotations || [],
            errors: publish
              ? (result.errors || []).map(() => ({
                  message:
                    "Failure details are available in the private local report.",
                }))
              : result.errors || [],
            stdout: publish ? [] : stdio(result.stdout),
            stderr: publish ? [] : stdio(result.stderr),
            attachments: publish
              ? []
              : (result.attachments || []).map((attachment) => ({
                  ...attachment,
                  path: undefined,
                  body: attachment.body
                    ? Buffer.from(attachment.body, "base64")
                    : undefined,
                })),
          })),
        };
        current.children.push(item);
      }
    }
    for (const child of source.suites || []) build(child, current, "describe");
  };
  for (const file of record.suites) build(file, projectSuite, "file");
  const counts = root.allTests().reduce((out, item) => {
    out[item.outcome()] = (out[item.outcome()] || 0) + 1;
    return out;
  }, {});
  for (const key of ["expected", "unexpected", "skipped", "flaky"]) {
    if ((counts[key] || 0) !== (record.stats[key] || 0))
      throw Error(
        "Recorded case counts do not match the saved run; refusing to invent results.",
      );
  }
  const errors = publish
    ? (record.errors || []).map(() => ({
        message:
          "Run setup or cleanup failed; inspect the private local report.",
      }))
    : record.errors || [];
  return {
    config,
    suite: root,
    errors,
    result: {
      status: errors.length || counts.unexpected ? "failed" : "passed",
      startTime: new Date(record.stats.startTime),
      duration: record.stats.duration,
    },
  };
}

async function renderOneRecordedReport(
  record,
  { outputFolder, publish = false } = {},
) {
  const { html } = require(
    path.join(
      path.dirname(require.resolve("playwright/package.json")),
      "lib/runner/index.js",
    ),
  );
  const output = path.resolve(outputFolder);
  const allowed = path.resolve(workspaceRoot, "e2e") + path.sep;
  if (!output.startsWith(allowed))
    throw new Error(
      "Report output must stay inside this checkout's e2e directory.",
    );
  const overrides = Object.entries(process.env).filter(
    ([key]) =>
      key.startsWith("PLAYWRIGHT_HTML_") || key === "PW_TEST_HTML_REPORT_OPEN",
  );
  for (const [key] of overrides) delete process.env[key];
  try {
    const model = recordedModel(record, { publish });
    const reporter = new html.default({
      configDir: process.cwd(),
      outputFolder: output,
      open: "never",
      noSnippets: true,
      title: "EduGrade Production",
    });
    reporter.onConfigure(model.config);
    reporter.onBegin(model.suite);
    if (path.resolve(reporter._outputFolder) !== output)
      throw new Error(
        "Refuse to render outside the explicit report output folder.",
      );
    for (const error of model.errors) reporter.onError(error);
    await reporter.onEnd(model.result);
    return model;
  } finally {
    for (const [key, value] of overrides) process.env[key] = value;
  }
}

let renderQueue = Promise.resolve();
function renderRecordedReport(record, options) {
  const next = renderQueue.then(() => renderOneRecordedReport(record, options));
  renderQueue = next.catch(() => {});
  return next;
}

module.exports = { recordedModel, renderRecordedReport };
