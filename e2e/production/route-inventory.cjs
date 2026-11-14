const fs = require("node:fs");
const path = require("node:path");
const { root } = require("./settings.cjs");
function walk(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
}
const directory = path.join(root, "src/app");
const routes = walk(directory)
  .filter((file) => path.basename(file) === "page.tsx")
  .map((file) => {
    const segments = path
      .relative(directory, path.dirname(file))
      .split(path.sep)
      .filter((segment) => segment && !segment.startsWith("("));
    const route = "/" + segments.join("/");
    const role = route.startsWith("/manager/system/managers")
      ? "admin"
      : route.startsWith("/manager/curriculum")
        ? "designer"
        : route.startsWith("/manager/")
          ? "manager"
          : route.startsWith("/staff/")
            ? "staff"
            : route.startsWith("/teacher/")
              ? "teacher"
              : "guest";
    return {
      route,
      role,
      dynamic: route.includes("["),
      source: path.relative(root, file).split(path.sep).join("/"),
    };
  })
  .sort((a, b) => a.route.localeCompare(b.route));
module.exports = { routes };
