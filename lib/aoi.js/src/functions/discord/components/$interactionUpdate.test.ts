import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $addButton } from './$addButton.js';
import { $interactionUpdate } from './$interactionUpdate.js';
import type { ITranspileOptions } from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $addButton, $interactionUpdate });

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

type Payload = {
	content: string;
	components: Array<{
		type: number;
		components: Array<Record<string, unknown>>;
	}>;
};

async function ejecutar(
	codigo: string,
	datos: Record<string, unknown>,
): Promise<{ actualizado?: Payload; logLlamadas: number }> {
	const { func } = client.transpiler.transpile(codigo, transpilerOptions);
	const orignalLog = console.log;
	let logLlamadas = 0;
	console.log = () => {
		logLlamadas++;
	};
	let actualizado: Payload | undefined;
	const interaction = {
		update: async (p: Payload) => {
			actualizado = p;
		},
	};
	// @ts-expect-error: func is a function
	await func?.({ ...datos, interaction });
	console.log = orignalLog;

	return { actualizado, logLlamadas };
}

void describe('$interactionUpdate', () => {
	void it('should compile successfully', () => {
		const func = client.transpiler.transpile(
			'¡Hola! $interactionUpdate',
			transpilerOptions,
		);
		assert.ok(func);
		assert.strictEqual(typeof func.func, 'function');
	});

	void it('should update the message instead of replying', async () => {
		const { actualizado, logLlamadas } = await ejecutar(
			'¡Hola! Has pulsado el botón. $interactionUpdate',
			{},
		);

		assert.strictEqual(actualizado?.content, '¡Hola! Has pulsado el botón.');
		// La función de envío original (console.log) no se llama: la
		// respuesta sale por interaction.update.
		assert.strictEqual(logLlamadas, 0);
	});

	void it('should include buttons in the update', async () => {
		const { actualizado } = await ejecutar(
			'Pulsa $addButton[volver;Volver;1] $interactionUpdate',
			{},
		);

		assert.strictEqual(actualizado?.content, 'Pulsa');
		assert.deepStrictEqual(actualizado?.components, [
			{
				type: 1,
				components: [
					{ type: 2, custom_id: 'volver', label: 'Volver', style: 1 },
				],
			},
		]);
	});

	void it('should do nothing without an interaction', async () => {
		const { func } = client.transpiler.transpile(
			'Hola $interactionUpdate',
			transpilerOptions,
		);
		const orignalLog = console.log;
		let logLlamadas = 0;
		console.log = () => {
			logLlamadas++;
		};
		// @ts-expect-error: func is a function
		await func?.({});
		console.log = orignalLog;

		assert.strictEqual(logLlamadas, 0);
	});
});
