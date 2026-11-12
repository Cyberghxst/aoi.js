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

export { default as Transpiler } from './Transpiler.js';
export { default as AoiReader } from './AoiReader.js';
export { default as AoijsErrorHandler } from './Error.js';
export { default as FunctionBuilder } from './builders/Function.js';
export { default as CustomFunction } from './builders/CustomFunction.js';
export { default as Scope } from './builders/Scope.js';
export {
	default as Condition,
	OPERATORS,
} from './builders/Condition.js';
export { default as TextBlock } from './builders/TextBlock.js';
export { default as StringObject } from './builders/StringObject.js';
export { default as proxyBuilder } from './builders/typeProxy.js';

export { default } from './Transpiler.js';
