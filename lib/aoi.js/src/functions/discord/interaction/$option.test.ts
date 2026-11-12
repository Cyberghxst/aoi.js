import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $option } from './$option.js';
import type {
	ITranspileOptions,
	ITranspilerData,
} from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $option });

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

const codeToFail = '$option';
const codeToPass = '$option[nombre]';
const codeToValue = '$option[nombre]';

const interactionCon = (valores: Record<string, unknown>) =>
	({
		interaction: {
			options: {
				get: (name: string) =>
					name in valores ? { value: valores[name] } : null,
			},
		},
	}) as unknown as ITranspilerData;

void describe('$option', () => {
	void it('should not compile successfully without arg', () => {
		assert.throws(() => {
			client.transpiler.transpile(codeToFail, transpilerOptions);
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

	void it('should return the option value', async () => {
		const orignalLog = console.log;
		let logged: unknown;
		console.log = (log: Record<string, string>) => {
			logged = client.parseData(log.content, $option.returns);
		};
		const { func } = client.transpiler.transpile(
			codeToValue,
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.(interactionCon({ nombre: 'Jeff' }));
		console.log = orignalLog;

		assert.strictEqual(logged, 'Jeff');
	});

	void it('should return a number option as its value', async () => {
		const orignalLog = console.log;
		let logged: unknown;
		console.log = (log: Record<string, string>) => {
			logged = client.parseData(log.content, $option.returns);
		};
		const { func } = client.transpiler.transpile(
			'$option[edad]',
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.(interactionCon({ edad: 18 }));
		console.log = orignalLog;

		assert.strictEqual(logged, '18');
	});

	void it('should return an empty string when the option is missing', async () => {
		const orignalLog = console.log;
		let logged: unknown;
		console.log = (log: Record<string, string>) => {
			logged = client.parseData(log.content, $option.returns);
		};
		// Entre corchetes: un resultado vacío ya no se envía (guarda en
		// Scope.generate), así que el valor vacío se observa dentro de texto.
		const { func } = client.transpiler.transpile(
			`[${codeToValue}]`,
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.(interactionCon({}));
		console.log = orignalLog;

		assert.strictEqual(logged, '[]');
	});

	void it('should return an empty string without an interaction', async () => {
		const orignalLog = console.log;
		let logged: unknown;
		console.log = (log: Record<string, string>) => {
			logged = client.parseData(log.content, $option.returns);
		};
		// Entre corchetes: ver el comentario del test anterior.
		const { func } = client.transpiler.transpile(
			`[${codeToValue}]`,
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.();
		console.log = orignalLog;

		assert.strictEqual(logged, '[]');
	});
});
