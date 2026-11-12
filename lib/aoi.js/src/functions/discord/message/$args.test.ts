import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $args } from './$args.js';
import type {
	ITranspileOptions,
	ITranspilerData,
} from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $args });

const transpilerOptions: ITranspileOptions = {
	scopeData: {
		name: 'global',
		vars: [],
		embeds: [],
		env: [],
		object: {},
		embeddedJS: [],
		sendFunction: 'console.log',
	},
	command: new TestCommand(client),
};

const codeToPassWithoutArg = '$args';
const codeToPass = '$args[1]';
const codeToFailWithArg = '$args[abc]';

async function ejecutar(
	codigo: string,
	datos?: ITranspilerData,
): Promise<unknown> {
	const orignalLog = console.log;
	let logged: unknown;
	console.log = (log: Record<string, string>) => {
		logged = client.parseData(log.content, $args.returns);
	};
	const { func } = client.transpiler.transpile(codigo, transpilerOptions);
	// @ts-expect-error: func is a function
	await func?.(datos);
	console.log = orignalLog;

	return logged;
}

void describe('$args', () => {
	void it('should compile successfully without arg', () => {
		const { func } = client.transpiler.transpile(
			codeToPassWithoutArg,
			transpilerOptions,
		);
		assert.ok(func);
		assert.strictEqual(typeof func, 'function');
	});

	void it('should not compile successfully with arg', () => {
		// expect this to throw an error
		assert.throws(() => {
			client.transpiler.transpile(codeToFailWithArg, transpilerOptions);
		});
	});

	void it('should compile successfully with arg', () => {
		const { func } = client.transpiler.transpile(
			codeToPass,
			transpilerOptions,
		);
		assert.ok(func);
		assert.strictEqual(typeof func, 'function');
	});

	void it('should return all the arguments joined by a space', async () => {
		const logged = await ejecutar(codeToPassWithoutArg, {
			args: ['hola', 'mundo'],
		} as unknown as ITranspilerData);

		assert.strictEqual(logged, 'hola mundo');
	});

	void it('should return the first argument with index 1', async () => {
		const logged = await ejecutar(codeToPass, {
			args: ['hola', 'mundo'],
		} as unknown as ITranspilerData);

		assert.strictEqual(logged, 'hola');
	});

	void it('should return the second argument with index 2', async () => {
		const logged = await ejecutar('$args[2]', {
			args: ['hola', 'mundo'],
		} as unknown as ITranspilerData);

		assert.strictEqual(logged, 'mundo');
	});

	void it('should return an empty string for an out of range index', async () => {
		// Entre corchetes: un resultado vacío ya no se envía (guarda en
		// Scope.generate), así que el valor vacío se observa dentro de texto.
		const logged = await ejecutar('[$args[3]]', {
			args: ['hola', 'mundo'],
		} as unknown as ITranspilerData);

		assert.strictEqual(logged, '[]');
	});

	void it('should return an empty string without data', async () => {
		// Entre corchetes: ver el comentario del test anterior.
		const logged = await ejecutar('[$args]');

		assert.strictEqual(logged, '[]');
	});
});
