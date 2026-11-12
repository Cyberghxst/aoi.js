import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $showModal } from './$showModal.js';
import type { ITranspileOptions } from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $showModal });

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

const codeToFail = '$showModal';
const codeToPass =
	'$showModal[form;Cuéntame algo;nombre;Tu nombre;1;Escribe tu nombre]';

void describe('$showModal', () => {
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

	void it('should call interaction.showModal with the modal', async () => {
		let modal: unknown;
		const interaction = {
			showModal: async (m: unknown) => {
				modal = m;
			},
		};
		const { func } = client.transpiler.transpile(
			codeToPass,
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.({ interaction });

		assert.deepStrictEqual(modal, {
			custom_id: 'form',
			title: 'Cuéntame algo',
			components: [
				{
					type: 1,
					components: [
						{
							type: 4,
							custom_id: 'nombre',
							label: 'Tu nombre',
							style: 1,
							placeholder: 'Escribe tu nombre',
							required: true,
						},
					],
				},
			],
		});
	});

	void it('should support paragraph style', async () => {
		let modal: Record<string, unknown> | undefined;
		const interaction = {
			showModal: async (m: Record<string, unknown>) => {
				modal = m;
			},
		};
		const { func } = client.transpiler.transpile(
			'$showModal[form;Título;texto;Texto;paragraph]',
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.({ interaction });

		const input = (
			modal?.components as Array<{
				components: Array<Record<string, unknown>>;
			}>
		)[0].components[0];
		assert.strictEqual(input.style, 2);
	});

	void it('should do nothing without an interaction', async () => {
		const orignalLog = console.log;
		let llamadas = 0;
		console.log = () => {
			llamadas++;
		};
		const { func } = client.transpiler.transpile(
			codeToPass,
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.({});
		console.log = orignalLog;

		// El modal es la respuesta: sin interacción no se envía nada.
		assert.strictEqual(llamadas, 0);
	});
});
