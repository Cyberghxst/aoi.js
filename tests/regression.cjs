/* eslint-disable @typescript-eslint/no-var-requires */
// Runs every regression suite in this directory against the same build.
//
// Usage:
//   node tests/regression.cjs
//     Builds first (`npm run build`), then runs all suites against dist/cjs.
//   REGRESSION_DIST=/tmp/dist-foo node tests/regression.cjs
//     Runs all suites against the build in /tmp/dist-foo instead.
//
// Each suite is a standalone file (tests/regression-*.cjs) that reads the
// same REGRESSION_DIST variable and exits non-zero when a check fails.
// This runner exits non-zero when any suite fails.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const suites = fs
    .readdirSync(__dirname)
    .filter((file) => file.startsWith("regression-") && file.endsWith(".cjs"))
    .sort()
    .map((file) => path.join(__dirname, file));

if (!suites.length) {
    console.log("No regression suites found.");
    process.exit(0);
}

let failedSuites = 0;
for (const suite of suites) {
    console.log(`\n===== ${path.basename(suite)} =====`);
    const result = spawnSync(process.execPath, [suite], {
        stdio: "inherit",
        env: process.env,
    });
    if (result.status !== 0) {
        failedSuites++;
        console.log(`FAILED: ${path.basename(suite)} (exit ${result.status})`);
    }
}

console.log(
    `\n${suites.length - failedSuites}/${suites.length} regression suites passed.`,
);
process.exit(failedSuites ? 1 : 0);
