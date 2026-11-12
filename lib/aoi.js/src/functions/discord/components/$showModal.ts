import FunctionBuilder from '@aoi.js/core/builders/Function.js';
import AoiError from '@aoi.js/core/Error.js';
import { parseString } from '@aoi.js/core/parsers/string.js';
import {
	ErrorCode,
	FunctionType,
	ReturnType,
	TranspilerCustoms,
} from '@aoi.js/typings/enum.js';
import { escapeResult } from '@aoi.js/utils/Helpers/core.js';

/**
 * Convierte un texto a una expresión JS: un literal entre comillas, o un
 * template literal si trae funciones anidadas ya resueltas.
 */
function textoJs(raw: string): string {
	const limpio = raw.trim().replace(/^(['"])(.*)\1$/, '$2');
	if (
		limpio.includes(TranspilerCustoms.FS) ||
		limpio.includes('__$DISCORD_DATA$__')
	) {
		return parseString(limpio);
	}
	return JSON.stringify(limpio);
}

function estiloInput(raw: string | undefined): string {
	if (!raw) return '1';
	const limpio = raw.trim().toLowerCase();
	if (limpio === '1' || limpio === 'short') return '1';
	if (limpio === '2' || limpio === 'paragraph') return '2';
	if (limpio.includes('__$DISCORD_DATA$__')) return limpio;
	throw new Error(
		`Estilo de input inválido: "${raw}". Usa 1 (short) o 2 (paragraph).`,
	);
}

function boolOCrudo(
	raw: string | undefined,
	defecto: boolean,
	nombre: string,
): string {
	if (!raw) return String(defecto);
	const limpio = raw.trim().toLowerCase();
	if (limpio === 'true') return 'true';
	if (limpio === 'false') return 'false';
	if (limpio.includes('__$DISCORD_DATA$__')) return `(${limpio})`;
	throw new Error(
		`Expected true or false for '${nombre}', received ${raw}.`,
	);
}

/**
 * Shows a modal (a form) to the user
 * @example
 * ```aoi
 * ---
 * name: formulario
 * type: interaction
 * ---
 *
 * $showModal[form;Cuéntame algo;nombre;Tu nombre;1;Escribe tu nombre]
 * ```
 */
const $showModal = new FunctionBuilder()
	.setName('$showModal')
	.setBrackets(true)
	.setOptional(false)
	.setType(FunctionType.Function)
	.setReturns(ReturnType.Void)
	.setFields([
		{
			name: 'customId',
			type: ReturnType.String,
			required: true,
			description:
				'The custom id of the modal. A component command with this name answers the submit.',
		},
		{
			name: 'title',
			type: ReturnType.String,
			required: true,
			description: 'The title of the modal.',
		},
		{
			name: 'inputId',
			type: ReturnType.String,
			required: true,
			description: 'The custom id of the text input.',
		},
		{
			name: 'inputLabel',
			type: ReturnType.String,
			required: true,
			description: 'The label of the text input.',
		},
		{
			name: 'style',
			type: ReturnType.String | ReturnType.Number,
			required: false,
			description:
				'The style of the text input: 1/short or 2/paragraph. Default: 1.',
		},
		{
			name: 'placeholder',
			type: ReturnType.String,
			required: false,
			description: 'The placeholder of the text input.',
		},
		{
			name: 'required',
			type: ReturnType.Boolean,
			required: false,
			description: 'Whether the input is required. Default: true.',
		},
	])
	.setCode((data, scopes, thisArg) => {
		const currentScope = thisArg.getCurrentScope(scopes);
		const [customId, title, inputId, inputLabel, style, placeholder, required] =
			thisArg.getParams(data);

		for (const [nombre, valor] of [
			['customId', customId],
			['title', title],
			['inputId', inputId],
			['inputLabel', inputLabel],
		] as const) {
			if (!valor && !thisArg.canSuppressAtComp(data, currentScope)) {
				throw AoiError.FunctionError(
					ErrorCode.MissingParameter,
					`Missing parameter '${nombre}' in function $showModal`,
					data,
				);
			}
		}

		let estilo: string;
		let requerido: string;
		try {
			estilo = estiloInput(style);
			requerido = boolOCrudo(required, true, 'required');
		} catch (e) {
			if (!thisArg.canSuppressAtComp(data, currentScope)) {
				throw AoiError.FunctionError(
					ErrorCode.InvalidArgumentType,
					(e as Error).message,
					data,
				);
			}
			estilo = '1';
			requerido = 'true';
		}

		const input = `{ type: 4, custom_id: ${textoJs(inputId)}, label: ${textoJs(inputLabel)}, style: ${estilo}${placeholder ? `, placeholder: ${textoJs(placeholder)}` : ''}, required: ${requerido} }`;
		const modal = `{ custom_id: ${textoJs(customId)}, title: ${textoJs(title)}, components: [{ type: 1, components: [${input}] }] }`;

		// El modal es la respuesta a la interacción: si no hay interacción
		// (un comando con prefijo) no hace nada en vez de romper.
		const codigo = `await __$DISCORD_DATA$__?.interaction?.showModal(${modal});`;
		const escaped = escapeResult(codigo);

		return {
			code: escaped,
			scope: scopes,
		};
	})
	.build();

export { $showModal };
