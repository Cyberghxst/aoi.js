import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $createobject } from './$createobject.js';
import { $getobject } from './$getobject.js';
import { $removeobjectproperty } from './$removeobjectproperty.js';
import type { ITranspileOptions } from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({ $createobject, $getobject, $removeobjectproperty });

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

const codeToFail = '$removeobjectproperty';
// El objeto tiene que existir antes: $removeobjectproperty tira
// ObjectDoesNotExist si no se creó con $createobject.
const codeToPass = '$createobject[test;{a:1}]\n$removeobjectproperty[test;a]';

void describe('$removeobjectproperty', () => {
	void it('should not compile successfully without arg', () => {
		// expect this to throw an error
		assert.throws(() => {
			client.transpiler.transpile(codeToFail, transpilerOptions);
		});
	});

	void it('should compile successfully after $createobject', () => {
		const func = client.transpiler.transpile(codeToPass, transpilerOptions);
		assert.ok(func);
		assert.strictEqual(typeof func.func, 'function');
	});

	void it('should not leak the delete result into the message', async () => {
		const orignalLog = console.log;
		let logged: unknown;
		console.log = (log: Record<string, string>) => {
			logged = client.parseData(log.content, $getobject.returns);
		};
		const { func } = client.transpiler.transpile(
			'$createobject[test;{a:1}]\n$removeobjectproperty[test;a]\n$getobject[test]',
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.();
		console.log = orignalLog;

		assert.strictEqual(logged, '{}');
	});
});
