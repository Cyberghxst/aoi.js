import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $switch } from './$switch.js';
import { $case } from './$case.js';
import { $default } from './$default.js';
import type {
	ITranspileOptions,
	ITranspilerData,
} from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $switch, $case, $default });

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

const codeToFail = '$default';
// $default solo tiene sentido dentro de un $switch: fuera de él genera
// un `default` sin switch, que es JavaScript inválido.
const codeToPass = '$switch[test;$default[test]]';

void describe('$default', () => {
	void it('should not compile successfully without arg', () => {
		// expect this to throw an error
		assert.throws(() => {
			client.transpiler.transpile(codeToFail, transpilerOptions);
		});
	});

	void it('should compile successfully inside $switch', () => {
		const func = client.transpiler.transpile(codeToPass, transpilerOptions);
		assert.ok(func);
		assert.strictEqual(typeof func.func, 'function');
	});

	void it('should run the default case when nothing matches', async () => {
		const enviados: string[] = [];
		const datos = {
			channel: {
				send: async (payload: { content: string }) => {
					enviados.push(payload.content);
				},
			},
		} as unknown as ITranspilerData;
		const { func } = client.transpiler.transpile(
			'$switch[zzz;$case[hi;hello]$case[bye;goodbye]$default[good day]]',
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.(datos);

		assert.deepStrictEqual(enviados, ['good day']);
	});
});
