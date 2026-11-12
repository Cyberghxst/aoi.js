import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $if } from './$if.js';
import { $else } from './$else.js';
import type {
	ITranspileOptions,
	ITranspilerData,
} from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $if, $else });

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

const codeToFail = '$else';
// $else solo tiene sentido tras un $if: solo genera un `else` sin if,
// que es JavaScript inválido.
const codeToPass = '$if[true;hi]\n$else[test]';

void describe('$else', () => {
	void it('should not compile successfully without arg', () => {
		// expect this to throw an error
		assert.throws(() => {
			client.transpiler.transpile(codeToFail, transpilerOptions);
		});
	});

	void it('should compile successfully after $if', () => {
		const func = client.transpiler.transpile(codeToPass, transpilerOptions);
		assert.ok(func);
		assert.strictEqual(typeof func.func, 'function');
	});

	void it('should run the else block when the condition is false', async () => {
		const enviados: string[] = [];
		const datos = {
			channel: {
				send: async (payload: { content: string }) => {
					enviados.push(payload.content);
				},
			},
		} as unknown as ITranspilerData;
		const { func } = client.transpiler.transpile(
			'$if[false;hi]\n$else[test]',
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.(datos);

		assert.deepStrictEqual(enviados, ['test']);
	});

	void it('should not run the else block when the condition is true', async () => {
		const enviados: string[] = [];
		const datos = {
			channel: {
				send: async (payload: { content: string }) => {
					enviados.push(payload.content);
				},
			},
		} as unknown as ITranspilerData;
		const { func } = client.transpiler.transpile(
			'$if[true;hi]\n$else[test]',
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.(datos);

		assert.deepStrictEqual(enviados, ['hi']);
	});
});
