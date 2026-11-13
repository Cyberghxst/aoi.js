/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS script, so require() is the correct way to load
// the built library (see tests/index.js for the same exemption).

/**
 * Regression checks for the Condition solver (fixed 2026-11-12):
 * parenthesized math/code groups inside a condition used to be wrapped in
 * backticks and compared as strings, so `$if[$sum[2;2]>2;...]` generated
 * `if((`2+2`)>2)` — the string "2+2" > 2 is false — and never ran.
 *
 * Root causes, both in the shared solver used by $if/$elseif/$onlyif/
 * $switch/$while/$and/$or/$checkCondition and the array condition
 * functions: (1) `conditionLexer` only masked parentheses inside
 * `#FUNCTION_START#...#` segments, so the `(2+2)` inside a
 * `#MATH_FUNCTION_START#...#` math result was read as a nested condition
 * and solved as a string literal; (2) `Condition._solve` did not recognize
 * math-marked operands as code, so `parseString` quoted them; (3) its
 * no-operator branch quoted any bare string, including a numeric
 * expression like `2+1` from user-typed `(2+1)`.
 *
 * Each check transpiles aoi code with the real Transpiler (minified, as a
 * command would be) and EXECUTES the generated function with a fake client
 * that captures sent messages, asserting on the message content (or on
 * console.log lines when `wantLogs` is given). Transpiling alone is not
 * enough: the bug transpiled fine and only evaluated wrong at runtime.
 *
 * Run it with:
 *   REGRESSION_DIST=/tmp/dist-conditions node tests/regression-conditions.cjs
 * (after building to a scratch dir: npx tsc -p tsconfig.cjs.json --outDir /tmp/dist-conditions)
 * or, after a full build, with the default dist:
 *   node tests/regression-conditions.cjs
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
        ws: { data: { ping: 42 } },
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
    // The bug, case 1 — a nested $function result on the left of the
    // operator used to generate `if((`2+2`)>2)` and never run.
    await check(
        "$if[$sum[2;2]>2] is taken",
        "$if[$sum[2;2]>2;$log[big]]",
        null,
        ["big"],
    );
    // The bug, case 2 — user-typed parenthesized math used to generate
    // `if((`2+1`)>2)` and never run.
    await check(
        "$if[(2+1)>2] is taken",
        "$if[(2+1)>2;$log[big]]",
        null,
        ["big"],
    );
    // The bug, case 3 — a nested $function result on the RIGHT of the
    // operator used to generate `array_element>(`1+1`)`.
    await check(
        "$arrayFilter element>$sum[1;1]",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayFilter[myArray;array_element>$sum[1;1]]",
        "3,4,5",
    );
    // The bug, case 4 — the same defect inside an array callback's $if.
    // Elements 2, 3, 4, 5 satisfy element+1 > 2, so "big" logs 4 times
    // (not 3: element 2 gives 3 > 2 as well).
    await check(
        "$arrayForEach $if[$sum[element;1]>2]",
        "$arrayCreate[myArray;1;2;3;4;5]\n$arrayForEach[myArray;$if[$sum[array_element;1]>2;$log[big]]]",
        null,
        ["big", "big", "big", "big"],
    );
    // Control — a plain comparison never had the bug.
    await check(
        "$if[3>2] is taken",
        "$if[3>2;$log[big]]",
        null,
        ["big"],
    );

    // `==` proves the fix is real code, not string coercion: the string
    // "4" === 4 would be false, the number 4 === 4 is true.
    await check(
        "$if[$sum[2;2]==4] is taken",
        "$if[$sum[2;2]==4;$log[four]]",
        null,
        ["four"],
    );
    await check(
        "$if[$sum[1;1]==3] is not taken",
        "$if[$sum[1;1]==3;$log[no]]",
        null,
        [],
    );
    // Parentheses around the $function itself (not just its math).
    await check(
        "$if[($sum[2;2])>2] is taken",
        "$if[($sum[2;2])>2;$log[big]]",
        null,
        ["big"],
    );
    // More parenthesized math: multiply, divide.
    await check(
        "$if[(2*3)>5] is taken",
        "$if[(2*3)>5;$log[si]]",
        null,
        ["si"],
    );
    await check(
        "$if[(10/2)==5] is taken",
        "$if[(10/2)==5;$log[si]]",
        null,
        ["si"],
    );
    // A Discord-data value inside the math (its markers used to be
    // stripped by the lexer split, leaving a backticked string).
    await check(
        "$if[$sum[$ping;0]>0] is taken",
        "$if[$sum[$ping;0]>0;$log[p]]",
        null,
        ["p"],
    );

    // The shared solver: $checkCondition, $and and $or return the solved
    // condition as message content.
    await check(
        "$checkCondition[$sum[2;2]>2] is true",
        "$checkCondition[$sum[2;2]>2]",
        "true",
    );
    await check(
        "$checkCondition[$sum[1;1]>2] is false",
        "$checkCondition[$sum[1;1]>2]",
        "false",
    );
    await check(
        "$and[$sum[1;1]==2;3>2] is true",
        "$and[$sum[1;1]==2;3>2]",
        "true",
    );
    await check(
        "$and[$sum[1;1]==3;3>2] is false",
        "$and[$sum[1;1]==3;3>2]",
        "false",
    );
    await check(
        "$or[$sum[1;1]==3;$sum[2;2]==4] is true",
        "$or[$sum[1;1]==3;$sum[2;2]==4]",
        "true",
    );

    // Controls — string comparisons must still quote their operands, and
    // must not change behavior.
    await check(
        "$if[Jeff==Jeff] is taken",
        "$if[Jeff==Jeff;$log[yo]]",
        null,
        ["yo"],
    );
    await check(
        "$if[Jeff==Ana] is not taken",
        "$if[Jeff==Ana;$log[no]]",
        null,
        [],
    );
    await check(
        "$if[Jeff!=Ana] is taken",
        "$if[Jeff!=Ana;$log[si]]",
        null,
        ["si"],
    );
    // A hyphenated word is text, not math: it must keep being quoted.
    await check(
        "$if[hello-world] stays a truthy string",
        "$if[hello-world;$log[yes]]",
        null,
        ["yes"],
    );
    // The other solver users must keep working with math conditions.
    await check(
        "$onlyif[$sum[1;1]==2] lets execution continue",
        "$onlyif[$sum[1;1]==2;ok]\n$log[after]",
        null,
        ["after"],
    );
    await check(
        "$onlyif[$sum[1;1]==3] sends its message and stops",
        "$onlyif[$sum[1;1]==3;ok]\n$log[after]",
        "ok",
    );
    await check(
        "$while[$get[i]<3] with $sum increments",
        "$let[i;0]\n$while[$get[i]<3;$let[i;$sum[$get[i];1]];$log[loop]]",
        null,
        ["loop", "loop", "loop"],
    );
    await check(
        "$elseif[$sum[1;1]==2] is taken",
        "$if[1>2;$log[no]]\n$elseif[$sum[1;1]==2;$log[si]]",
        null,
        ["si"],
    );
    await check(
        "$switch[$sum[1;1]] matches $case[2]",
        "$switch[$sum[1;1];\n$case[2;\n$log[dos]\n]\n$case[3;\n$log[tres]\n]\n]",
        null,
        ["dos"],
    );

    console.log(`\nregression-conditions: ${passed} passed, ${failed} failed`);
    if (failures.length) {
        for (const failure of failures) console.log(`  FAIL: ${failure}`);
        process.exit(1);
    }
})();
