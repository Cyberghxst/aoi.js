// Escribe los marcadores de tipo de módulo dentro de dist/, igual que
// hace bin/build.mjs en la raíz del monorepo: dist/esm es ESM y dist/cjs
// es CommonJS, aunque el package.json de lib/aoi.js diga "type": "module".
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'..',
	'dist',
);

await fs.writeFile(
	path.join(root, 'esm', 'package.json'),
	JSON.stringify({ type: 'module' }, null, 2),
);
await fs.writeFile(
	path.join(root, 'cjs', 'package.json'),
	JSON.stringify({ type: 'commonjs' }, null, 2),
);
