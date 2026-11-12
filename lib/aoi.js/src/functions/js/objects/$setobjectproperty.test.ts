import { describe, it } from 'node:test';
import assert from 'node:assert';

import TestClient from '@aoi.js/testing/testClient.js';
import { $createobject } from './$createobject.js';
import { $getobjectproperty } from './$getobjectproperty.js';
import { $setobjectproperty } from './$setobjectproperty.js';
import type { ITranspileOptions } from '@aoi.js/typings/interface.js';
import TestCommand from '@aoi.js/testing/testCommand.js';

const client = new TestClient();
client.transpiler.addFunctions({
	$createobject,
	$getobjectproperty,
	$setobjectproperty,
});

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

const codeToFail = '$setobjectproperty';
// El objeto tiene que existir antes: $setobjectproperty tira
// ObjectDoesNotExist si no se creó con $createobject.
const codeToPass = '$createobject[test;{a:1}]\n$setobjectproperty[test;a;2]';

void describe('$setobjectproperty', () => {
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

	void it('should set the property value', async () => {
		const orignalLog = console.log;
		let logged: unknown;
		console.log = (log: Record<string, string>) => {
			logged = client.parseData(log.content, $getobjectproperty.returns);
		};
		const { func } = client.transpiler.transpile(
			'$createobject[test;{a:1}]\n$setobjectproperty[test;a;2]\n$getobjectproperty[test;a]',
			transpilerOptions,
		);
		// @ts-expect-error: func is a function
		await func?.();
		console.log = orignalLog;

		assert.strictEqual(logged, '2');
	});
});
