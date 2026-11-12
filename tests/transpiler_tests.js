/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS script, so require() is the correct way to load
// the built library and js-beautify (see generators/readme.js for the same exemption).

/**
 * Demo script for the aoi.js transpiler (not part of the automated regression
 * check in tests/index.js). It transpiles a small aoi-code program — a $while
 * loop that sums sines — with minification, prints the original aoi code and
 * the beautified JavaScript output, then runs the generated function so its
 * console output can be inspected. Run it manually with:
 * `node tests/transpiler_tests.js`.
 */
const { Transpiler } = require("../dist/cjs/index.js");
const beautify = require("js-beautify").js;
const codeToTranspile = `
$let[i;0]
$let[maths;0]
$while[ $get[i] < 10;
  $let[maths;$math[( $get[maths] + ( sin( $get[maths] )+1 ) )/2]]
  $log[sum@$get[i]: $get[maths]]
  $inc[$get[i];++]
] 
`;

const transpiledCode = Transpiler(codeToTranspile,{
    minify: true,
});

// js-beautify's option keys are snake_case by design; renaming them to
// camelCase would make beautify silently ignore them, so they stay as-is.
const beautifiedCode = beautify(transpiledCode.func.toString(), { indent_size: 2, space_in_empty_paren: true }); // eslint-disable-line camelcase
console.log("-------------------------------------");
console.log("Original code:\n", codeToTranspile);
console.log("\n\n\nTranspiled code:\n", beautifiedCode);
console.log("-------------------------------------");
console.log("Output:\n");
transpiledCode.func();
