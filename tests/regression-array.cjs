/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS script, so require() is the correct way to load
// the built library (see tests/index.js for the same exemption).

/**
 * Regression checks for the $array* callback codegen (bugs 1-3, fixed
 * 2026-11-12, and the bare-`array_element`-in-nested-$function bug, fixed
 * 2026-11-12): the doc examples of $arrayMap / $arrayForEach must transpile
 * and run, and $arrayFilter / $arrayEvery / $arrayFind must generate
 * predicates that compare the element instead of a string.
 *
 * Each check transpiles aoi code with the real Transpiler (minified, as a
 * command would be) and EXECUTES the generated function with a fake client
 * that captures sent messages, asserting on the message content (or on
 * console.log lines for $arrayForEach). Transpiling alone is not enough:
 * bug 3 transpiled fine and only evaluated wrong at runtime.
 *
 * Run it with:
 *   REGRESSION_DIST=/tmp/dist-array node tests/regression-array.cjs
 * (after building to a scratch dir: npx tsc -p tsconfig.cjs.json --outDir /tmp/dist-array)
 * or, after a full build, with the default dist:
 *   node tests/regression-array.cjs
 */
const path = require("path");

const distDir =
    process.env.REGRESSION_DIST ||
    path.join(__dirname, "..", "dist", "cjs");
const { Transpiler } = require(distDir + "/index.js");

let passed = 0;
let failed = 0;
const failures = [];

/**
 * Runs one aoi-code snippet through the transpiler and the generated
 * function, then checks the sent message content (or the console.log
 * lines when `wantLogs` is given).
 * @param {string} label - What the check proves.
 * @param {string} code - The aoi code to transpile and run.
 * @param {string | null} want - The expected sent content, or null when
 * nothing should be sent.
 * @param {string[]} [wantLogs] - The expected console.log lines, in order.
 */
async function check(label, code, want, wantLogs) {
    const sent = [];
    const client = {
        createMessage: async (_channelId, payload) => {
            sent.push(payload);
            return payload;
        },
    };
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));
    try {
        const result = Transpiler(code, {
            minify: true,
            sendMessage: true,
            client,
        });
        await result.func({ client, message: { channelId: "123" } });
    } catch (error) {
        console.log = originalLog;
        failed++;
        failures.push(`${label}: threw ${error}`);
        return;
    }
    console.log = originalLog;

    const content = sent.length ? sent[0].content : null;
    if (wantLogs !== undefined) {
        const got = logs.join("|");
        const expected = wantLogs.join("|");
        if (got === expected && sent.length === 0) {
            passed++;
        } else {
            failed++;
            failures.push(
                `${label}: expected logs ${JSON.stringify(expected)} (no message), got logs ${JSON.stringify(got)} and content ${JSON.stringify(content)}`,
            );
        }
        return;
    }
    if (content === want) {
        passed++;
    } else {
        failed++;
        failures.push(
            `${label}: expected content ${JSON.stringify(want)}, got ${JSON.stringify(content)}`,
        );
    }
}

(async () => {
    // Bug 1 — $arrayMap doc example: nested $functions in the query used to
    // produce `${...}` outside any template literal (SyntaxError).
    await check(
        "$arrayMap doc example",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayMap[myArray;$sum[$env[array_element];1]]",
        "2,3,4,5,6",
    );
    // Same bug, plain query without $functions (the map callback used to
    // drop the value instead of returning it).
    await check(
        "$arrayMap plain query",
        "$arrayCreate[myArray;1;2;3]\n$arrayMap[myArray;array_element]",
        "1,2,3",
    );

    // Bug 2 — $arrayForEach doc example: the body went through the condition
    // solver, which wrapped the $log call in a template literal (SyntaxError).
    await check(
        "$arrayForEach doc example",
        "$arrayCreate[myArray;hello;world;nya]\n$arrayForEach[myArray;$log[$env[array_element]]]",
        null,
        ["hello", "world", "nya"],
    );

    // Bug 3 — $arrayFilter: `<=` used to split as `<` + "`=;5`".
    await check(
        "$arrayFilter doc example (<=;5)",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFilter[myArray;$env[array_element]<=;5]",
        "1,2,3,4,5",
    );
    await check(
        "$arrayFilter stricter predicate",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFilter[myArray;array_element>2]",
        "3,4,5",
    );
    await check(
        "$arrayFilter string equality still quotes the operand",
        "$arrayCreate[myArray;hello;world;nya]\n$arrayFilter[myArray;$env[array_element]==;world]",
        "world",
    );

    // Bug 3 — $arrayEvery: a bare `array_element` used to be quoted as the
    // string "array_element", so the comparison was always false.
    await check(
        "$arrayEvery element>0 is true",
        "$arrayCreate[myArray;1;2;3]\n$arrayEvery[myArray;array_element>0]",
        "true",
    );
    await check(
        "$arrayEvery element>1 is false",
        "$arrayCreate[myArray;1;2;3]\n$arrayEvery[myArray;array_element>1]",
        "false",
    );
    await check(
        "$arrayEvery doc example (<=;5)",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayEvery[myArray;$env[array_element]<=;5]",
        "true",
    );
    await check(
        "$arrayEvery doc example (>=;5)",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayEvery[myArray;$env[array_element]>=;5]",
        "false",
    );

    // $arrayFind shares the same codegen path and must keep working.
    await check(
        "$arrayFind doc example (>=;5)",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFind[myArray;$env[array_element]>=;5]",
        "5",
    );
    await check(
        "$arrayFind bare predicate",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFind[myArray;array_element>3]",
        "4",
    );

    // Bare `array_element` inside a nested $function's arguments used to
    // resolve to empty: math Getters turned it into `Number("array_element")`
    // = NaN and `$log` quoted it as a string, because the nested transpiler
    // ran before the condition solver's protection. The query is now
    // rewritten to `$env[...]` before the nested transpiler sees it.
    await check(
        "$arrayFilter nested $sum with bare element",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFilter[myArray;$sum[array_element;1]>2]",
        "2,3,4,5",
    );
    await check(
        "$arrayMap nested $sum with bare element",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayMap[myArray;$sum[array_element;1]]",
        "2,3,4,5,6",
    );
    await check(
        "$arrayEvery nested $sum with bare element",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayEvery[myArray;$sum[array_element;1]>0]",
        "true",
    );
    // Same bug, different nested functions: it was never $sum-specific.
    await check(
        "$arrayFind nested $sum with bare element",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFind[myArray;$sum[array_element;1]>3]",
        "3",
    );
    await check(
        "$arrayFilter nested $sub with bare element",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFilter[myArray;$sub[array_element;1]>2]",
        "4,5",
    );
    await check(
        "$arrayForEach nested $log with bare element",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayForEach[myArray;$log[array_element]]",
        null,
        ["1", "2", "3", "4", "5"],
    );
    await check(
        "$arrayForEach $if condition with bare element",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayForEach[myArray;$if[array_element>2;$log[big]]]",
        null,
        ["big", "big", "big"],
    );
    await check(
        "$arrayMap nested $sum with bare element property",
        "$arrayCreate[myArray;hello;world]\n$arrayMap[myArray;$sum[array_element.length;1]]",
        "6,6",
    );
    // The rewrite must not touch `array_element` inside string literals:
    // there it is text, and the log keeps the quotes (pre-existing behavior).
    await check(
        "$arrayForEach $log with quoted array_element stays literal",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayForEach[myArray;$log[\"array_element\"]]",
        null,
        [
            '"array_element"',
            '"array_element"',
            '"array_element"',
            '"array_element"',
            '"array_element"',
        ],
    );

    // The `<=` / `>=` operator fix lives in the shared Condition solver, so
    // $if must compare correctly too ($if runs its code only when taken, so
    // a $log inside it proves which branch ran).
    await check(
        "$if 1<=2 is taken",
        "$if[1<=2;$log[yes]]",
        null,
        ["yes"],
    );
    await check(
        "$if 2<=1 is not taken",
        "$if[2<=1;$log[yes]]",
        null,
        [],
    );
    await check(
        "$if 2>=1 is taken",
        "$if[2>=1;$log[yes]]",
        null,
        ["yes"],
    );
    await check(
        "$if 1>=2 is not taken",
        "$if[1>=2;$log[yes]]",
        null,
        [],
    );

    console.log(`\nregression-array: ${passed} passed, ${failed} failed`);
    if (failures.length) {
        for (const failure of failures) console.log(`  FAIL: ${failure}`);
        process.exit(1);
    }
})();
