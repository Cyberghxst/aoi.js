import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $addButton } from './$addButton.js';
import type { ITranspileOptions } from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $addButton });

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

const codeToFail = '$addButton';
const codeToPass = 'Pulsa el botón $addButton[saludar;¡Salúdame!;1]';

type Payload = {
	content: string;
	components: Array<{
		type: number;
		components: Array<Record<string, unknown>>;
	}>;
};

async function ejecutar(codigo: string): Promise<Payload> {
	const { func } = client.transpiler.transpile(codigo, transpilerOptions);
	const orignalLog = console.log;
	let payload: Payload | undefined;
	console.log = (log: Payload) => {
		payload = log;
	};
	// @ts-expect-error: func is a function
	await func?.({});
	console.log = orignalLog;

	assert.ok(payload, 'No se envió ningún mensaje');
	return payload;
}

void describe('$addButton', () => {
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

	void it('should add the button to the message components', async () => {
		const payload = await ejecutar(
			'Pulsa el botón $addButton[saludar;¡Salúdame!;1] $addButton[no;No, gracias;secondary]',
		);

		assert.strictEqual(payload.content, 'Pulsa el botón');
		assert.strictEqual(payload.components.length, 1);
		assert.strictEqual(payload.components[0].type, 1);
		assert.deepStrictEqual(payload.components[0].components, [
			{ type: 2, custom_id: 'saludar', label: '¡Salúdame!', style: 1 },
			{ type: 2, custom_id: 'no', label: 'No, gracias', style: 2 },
		]);
	});

	void it('should group up to 5 buttons per row', async () => {
		const payload = await ejecutar(
			'Botones $addButton[a;A;1] $addButton[b;B;1] $addButton[c;C;1] $addButton[d;D;1] $addButton[e;E;1] $addButton[f;F;1]',
		);

		assert.strictEqual(payload.components.length, 2);
		assert.strictEqual(payload.components[0].components.length, 5);
		assert.strictEqual(payload.components[1].components.length, 1);
	});

	void it('should support emoji and disabled', async () => {
		const payload = await ejecutar(
			'Pulsa $addButton[si;Sí;3;true;👍]',
		);

		assert.deepStrictEqual(payload.components[0].components, [
			{
				type: 2,
				custom_id: 'si',
				label: 'Sí',
				style: 3,
				disabled: true,
				emoji: { name: '👍' },
			},
		]);
	});
});
