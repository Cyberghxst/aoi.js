/* eslint-disable @typescript-eslint/no-var-requires */
// Regression checks for bugs 5, 6 and 7 on the old v7 branch.
//
// Run from the repository root:
//   node tests/regression-misc.cjs
//
// The checks require the built CJS output. It is taken from the
// REGRESSION_DIST environment variable, or from ../dist/cjs relative to
// this file by default (so run `npm run build` first for the default, or
// point at a private build, e.g.):
//   REGRESSION_DIST=/tmp/dist-misc node tests/regression-misc.cjs
// Note: CustomEvent.load() dynamically imports chalk/boxen, which resolve
// as ES modules from the build directory — if REGRESSION_DIST points
// outside this repository, node_modules must resolve from there (e.g.
// symlink the repo's node_modules into the build directory).
//
// Bug 5: the CustomEvent load report must show the file name, not
//   "[object Object]".
// Bug 6: Time.parse() and Time.format() must agree on one month constant,
//   so a parsed month formats back to a month.
// Bug 7: tests/src/package.json must not declare "type": "module", since
//   tests/src/index.js (and config.js) are CommonJS (require()).

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const distDir = path.resolve(
    __dirname,
    process.env.REGRESSION_DIST || "../dist/cjs",
);
const { parse, format, MS_PER_MONTH } = require(path.join(distDir, "util/Time.js"));
const { CustomEvent } = require(path.join(distDir, "index.js"));

let failures = 0;

function check(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    } catch (e) {
        failures++;
        console.log(`FAIL - ${name}: ${e.message}`);
    }
}

async function checkAsync(name, fn) {
    try {
        await fn();
        console.log(`ok - ${name}`);
    } catch (e) {
        failures++;
        console.log(`FAIL - ${name}: ${e.message}`);
    }
}

// --- Bug 6: Time month round-trips ---------------------------------------

check("bug 6: MS_PER_MONTH is the mean Gregorian month (2629746000 ms)", () => {
    assert.strictEqual(MS_PER_MONTH, 2629746000);
});

check("bug 6: parse(\"1mon\") is exactly one MS_PER_MONTH", () => {
    assert.strictEqual(parse("1mon").ms, MS_PER_MONTH);
});

check("bug 6: parse(\"1mon\") formats back to \"1 month\"", () => {
    const ms = parse("1mon").ms;
    assert.strictEqual(format(ms).object.months, 1);
    assert.strictEqual(format(ms).toString(), "1 month");
});

check("bug 6: parse(\"2d 3h\") formats back to \"2 days, 3 hours\"", () => {
    assert.strictEqual(format(parse("2d 3h").ms).toString(), "2 days, 3 hours");
});

check("bug 6: parse(\"1y\") formats back to \"1 year\"", () => {
    assert.strictEqual(format(parse("1y").ms).toString(), "1 year");
});

check("bug 6: parse(number) goes through format().toString() (humanize path)", () => {
    // parse(ms) formats via format(ms).toString(), which re-parses the
    // humanized string, so this also covers that path.
    assert.strictEqual(parse(MS_PER_MONTH).format, "1 month");
});

// --- Bug 5: CustomEvent load report --------------------------------------
// A real AoiClient cannot be built offline (zeneth connects to the
// Discord gateway in its constructor), so a minimal fake client is used:
// load() only needs client.managers.functions.functions.toJSON() (via the
// Command constructor) and passes the client through to the Transpiler.

async function captureLoadReport() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aoi-events-"));
    try {
        fs.writeFileSync(
            path.join(dir, "hello.aoi"),
            "[exportCommand: basic] {\n" +
                "    name: hello\n" +
                "    code: @{\n" +
                "        Hello!\n" +
                "    }\n" +
                "}",
        );
        const fakeClient = {
            managers: { functions: { functions: { toJSON: () => [] } } },
        };
        const captured = [];
        const origLog = console.log;
        console.log = (...args) => captured.push(args.join(" "));
        try {
            const events = new CustomEvent(fakeClient);
            await events.load({ path: dir, usingAoi: true });
        } finally {
            console.log = origLog;
        }
        // Strip ANSI colour codes (built from the ESC character so the
        // regex literal itself contains no control character).
        const ansiEscape = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");
        return captured.join("\n").replace(ansiEscape, "");
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

(async () => {
    let report = "";
    await checkAsync("bug 5: load report shows the file name, not [object Object]", async () => {
        report = await captureLoadReport();
        assert.ok(
            report.includes("hello.aoi"),
            `report does not contain "hello.aoi":\n${report}`,
        );
        assert.ok(
            !report.includes("[object Object]"),
            `report contains "[object Object]":\n${report}`,
        );
        assert.ok(report.includes("Loaded"), `report has no "Loaded" line:\n${report}`);
    });

    // --- Bug 7: tests/src module system ----------------------------------
    check("bug 7: tests/src/package.json does not declare \"type\": \"module\"", () => {
        const pkg = JSON.parse(
            fs.readFileSync(path.join(__dirname, "src/package.json"), "utf-8"),
        );
        assert.ok(
            pkg.type === undefined || pkg.type === "commonjs",
            `tests/src/package.json has "type": ${JSON.stringify(pkg.type)}`,
        );
        const indexJs = fs.readFileSync(path.join(__dirname, "src/index.js"), "utf-8");
        assert.ok(
            indexJs.includes("require(\"aoi.js\")"),
            "tests/src/index.js does not use require() (no longer CommonJS?)",
        );
    });

    if (failures > 0) {
        console.log(`\n${failures} check(s) failed`);
        process.exit(1);
    }
    console.log("\nAll regression-misc checks passed");
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
