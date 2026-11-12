/* eslint-disable @typescript-eslint/no-var-requires */
// This is a plain CommonJS script, so require() is the correct way to load
// the fs module (see generators/readme.js for the same exemption).

/**
 * Post-build helper, run by `npm run createpack` at the end of `npm run build`.
 *
 * The TypeScript compiler emits both a CommonJS and an ESM bundle into
 * dist/cjs and dist/esm, but it does not write the package.json "type"
 * markers Node needs to load each bundle with the right module system.
 * This script writes those two tiny marker files, so `require("aoi.js")`
 * resolves to the CommonJS bundle and `import ... from "aoi.js"` to the ESM
 * bundle.
 */
const { writeFileSync } = require("fs");

writeFileSync(
    "./dist/cjs/package.json",
    `{
    "type" : "commonjs"
}`,
);
writeFileSync(
    "./dist/esm/package.json",
    `{
    "type" : "module"
}`,
);
