/*
 Copyright 2024 Akarui Development

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
 
		http://www.apache.org/licenses/LICENSE-2.0
 
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

export { default as AoiClient } from './classes/AoiClient.js';
export { default as Command } from './classes/Command.js';
export { default as Macro } from './classes/Macro.js';
export { Util } from './classes/Util.js';

export { default as Transpiler } from './core/Transpiler.js';
export { default as AoiReader } from './core/AoiReader.js';
export { default as AoijsErrorHandler } from './core/Error.js';
export { default as FunctionBuilder } from './core/builders/Function.js';
export { default as CustomFunction } from './core/builders/CustomFunction.js';
export { default as Scope } from './core/builders/Scope.js';
export {
	default as Condition,
	OPERATORS,
} from './core/builders/Condition.js';
export { default as TextBlock } from './core/builders/TextBlock.js';
export { default as StringObject } from './core/builders/StringObject.js';
export { default as proxyBuilder } from './core/builders/typeProxy.js';

export { CommandManager } from './managers/Command.js';
export { default as FunctionManager } from './managers/Function.js';
export { MacrosManager } from './managers/Macro.js';

export * from './events/index.js';
export * from './functions/index.js';

export * from './typings/enum.js';
export type * from './typings/interface.js';
export type * from './typings/type.js';

export { default } from './classes/AoiClient.js';
