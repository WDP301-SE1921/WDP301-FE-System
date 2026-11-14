import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import environment from "./environment.cjs";

const { root } = environment;
const repos = [
  ["WDP301-BE-System", "origin/dev"],
  ["WDP301-FE-System", "origin/dev"],
  ["WDP301-ADMIN-System", "origin/dev"],
  ["WDP301-FEM-System", "origin/develop"],
];
const git = (cwd, args) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  }).trim();
const audit = repos.map(([name, testedRemote]) => {
  const cwd = path.resolve(root, "..", name);
  const branches = git(cwd, [
    "for-each-ref",
    "--format=%(refname:short)",
    "refs/remotes/origin",
  ])
    .split("\n")
    .filter((ref) => ref !== "origin" && ref !== "origin/HEAD");
  return {
    repository: name,
    checkout: git(cwd, ["branch", "--show-current"]),
    testedRemote,
    testedCommit: git(cwd, ["rev-parse", testedRemote]),
    localHead: git(cwd, ["rev-parse", "HEAD"]),
    changes: git(cwd, ["status", "--short"]),
    branches: branches.map((ref) => {
      const [selectedOnlyCommits, candidateOnlyCommits] = git(cwd, [
        "rev-list",
        "--left-right",
        "--count",
        `${testedRemote}...${ref}`,
      ])
        .split(/\s+/)
        .map(Number);
      return {
        ref,
        commit: git(cwd, ["rev-parse", ref]),
        selectedOnlyCommits,
        candidateOnlyCommits,
        sameTree:
          git(cwd, ["rev-parse", `${ref}^{tree}`]) ===
          git(cwd, ["rev-parse", `${testedRemote}^{tree}`]),
        candidateOnlyHistory: candidateOnlyCommits
          ? git(cwd, [
              "log",
              "--format=%h %s",
              `${testedRemote}..${ref}`,
            ]).split("\n")
          : [],
      };
    }),
  };
});
const output = path.join(root, "e2e/demo/branch-audit.json");
fs.writeFileSync(
  output,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      policy:
        "Fetched all remotes, fast-forwarded clean main/dev/develop branches. Divergent feature branches were inspected, never silently merged.",
      repositories: audit,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Branch audit saved: ${path.relative(root, output)}`);
