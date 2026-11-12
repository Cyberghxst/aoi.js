/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS script, so require() is the correct way to load
// the built library (see generators/readme.js for the same exemption).

/**
 * Regression check for the aoi.js transpiler (run with `node tests`, i.e. `npm test`).
 *
 * It transpiles the same two aoi-code statements in both orders and prints the
 * minified JavaScript function produced for each. The two printed functions
 * must be identical: the second snippet is transpiled with `reverse: true`,
 * which makes the transpiler emit the statements in the same order as the
 * first snippet.
 *
 * The exact console output is the regression baseline (saved at
 * ~/workspace/v7-baseline-tests-output.txt). Keep the aoi-code snippets, the
 * Transpiler options, and the console.log format byte-identical.
 */
const { Transpiler } = require("../dist/cjs/index.js");

// $log first, then $onlyif ("bottom to top" relative to the other snippet).
const bottomToTopCode = `
$log[hi]
$onlyif[$ping<100;Pong!]
`;

// $onlyif first, then $log ("top to bottom").
const topToBottomCode = `
$onlyif[$ping<100;Pong!]
$log[hi]
`;

const topToBottomResult = Transpiler(topToBottomCode,{
    minify: true,
});

const bottomToTopReversedResult = Transpiler(bottomToTopCode,{
    reverse: true,
    minify: true,
});

console.log(topToBottomResult.func.toString());
console.log("-------------------");
console.log(bottomToTopReversedResult.func.toString());
