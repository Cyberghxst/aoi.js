import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $textInputValue } from './$textInputValue.js';
import type { ITranspileOptions } from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $textInputValue });

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

const codeToFail = '$textInputValue';
const codeToPass = 'Me has dicho: $textInputValue[nombre]';

async function ejecutar(
	codigo: string,
	interaction?: unknown,
): Promise<string> {
	const { func } = client.transpiler.transpile(codigo, transpilerOptions);
	const orignalLog = console.log;
	let contenido: string | undefined;
	console.log = (log: { content: string }) => {
		contenido = log.content;
	};
	// @ts-expect-error: func is a function
	await func?.({ interaction });
	console.log = orignalLog;

	assert.ok(contenido !== undefined, 'No se envió ningún mensaje');
	return contenido;
}

void describe('$textInputValue', () => {
	void it('should not compile successfully without arg', () => {
		// expect this to throw an error
		assert.throws(() => {
			client.transpiler.transpile(codeToFail, transpilerOptions);
		});
	});

	void it('should compile successfully with arg', () => {
		const func = client.transpiler.transpile(codeToPass, transpilerOptions);
		assert.ok(func);
		assert.strictEqual(typeof func.func, 'function');
	});

	void it('should return the input value', async () => {
		const contenido = await ejecutar(codeToPass, {
			fields: {
				getTextInputValue: (id: string) =>
					id === 'nombre' ? 'Jeff' : '',
			},
		});

		assert.strictEqual(contenido, 'Me has dicho: Jeff');
	});

	void it('should return empty string without an interaction', async () => {
		const contenido = await ejecutar(codeToPass);

		assert.strictEqual(contenido, 'Me has dicho: ');
	});
});
