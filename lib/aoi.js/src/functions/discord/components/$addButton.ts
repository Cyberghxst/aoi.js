import FunctionBuilder from '@aoi.js/core/builders/Function.js';
import AoiError from '@aoi.js/core/Error.js';
import { parseString } from '@aoi.js/core/parsers/string.js';
import {
	ErrorCode,
	FunctionType,
	ReturnType,
	TranspilerCustoms,
} from '@aoi.js/typings/enum.js';
import { escapeResult, escapeVars } from '@aoi.js/utils/Helpers/core.js';

const ESTILOS: Record<string, number> = {
	'1': 1,
	primary: 1,
	'2': 2,
	secondary: 2,
	'3': 3,
	success: 3,
	'4': 4,
	danger: 4,
};

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

function estiloBoton(raw: string | undefined): string {
	if (!raw) return '1';
	const limpio = raw.trim().toLowerCase();
	if (limpio in ESTILOS) return String(ESTILOS[limpio]);
	if (limpio.includes('__$DISCORD_DATA$__')) return limpio;
	throw new Error(
		`Estilo de botón inválido: "${raw}". Usa 1 (primary), 2 (secondary), 3 (success) o 4 (danger).`,
	);
}

function emojiBoton(raw: string | undefined): string {
	if (!raw) return '';
	const limpio = raw.trim().replace(/^(['"])(.*)\1$/, '$2');
	if (limpio.includes('__$DISCORD_DATA$__')) {
		return `, emoji: { name: ${limpio} }`;
	}
	// Emoji personalizado <:nombre:id> o animado <a:nombre:id>.
	const personalizado = limpio.match(/^<(a)?:(\w+):(\d+)>$/);
	if (personalizado) {
		const [, animado, nombre, id] = personalizado;
		return `, emoji: { name: ${JSON.stringify(nombre)}, id: ${JSON.stringify(id)}${animado ? ', animated: true' : ''} }`;
	}
	return `, emoji: { name: ${JSON.stringify(limpio)} }`;
}

/**
 * Adds a button to the message
 * @example
 * ```aoi
 * ---
 * name: boton
 * type: interaction
 * ---
 *
 * Pulsa el botón $addButton[saludar;¡Salúdame!;1]
 * $addButton[no;No, gracias;2]
 * ```
 */
const $addButton = new FunctionBuilder()
	.setName('$addButton')
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
				'The custom id of the button. A component command with this name answers the click.',
		},
		{
			name: 'label',
			type: ReturnType.String,
			required: true,
			description: 'The text of the button.',
		},
		{
			name: 'style',
			type: ReturnType.String | ReturnType.Number,
			required: false,
			description:
				'The style of the button: 1/primary, 2/secondary, 3/success or 4/danger. Default: 1.',
		},
		{
			name: 'disabled',
			type: ReturnType.Boolean,
			required: false,
			description: 'Whether the button is disabled. Default: false.',
		},
		{
			name: 'emoji',
			type: ReturnType.String,
			required: false,
			description:
				'An emoji for the button, unicode or <:name:id>.',
		},
	])
	.setCode((data, scopes, thisArg) => {
		const currentScope = thisArg.getCurrentScope(scopes);
		const [customId, label, style, disabled, emoji] =
			thisArg.getParams(data);

		if (!customId && !thisArg.canSuppressAtComp(data, currentScope)) {
			throw AoiError.FunctionError(
				ErrorCode.MissingParameter,
				"Missing parameter 'customId' in function $addButton",
				data,
			);
		}

		if (!label && !thisArg.canSuppressAtComp(data, currentScope)) {
			throw AoiError.FunctionError(
				ErrorCode.MissingParameter,
				"Missing parameter 'label' in function $addButton",
				data,
			);
		}

		let estilo: string;
		try {
			estilo = estiloBoton(style);
		} catch (e) {
			if (!thisArg.canSuppressAtComp(data, currentScope)) {
				throw AoiError.FunctionError(
					ErrorCode.InvalidArgumentType,
					(e as Error).message,
					data,
				);
			}
			estilo = '1';
		}

		let deshabilitado = '';
		if (disabled) {
			const limpio = disabled.trim().toLowerCase();
			if (limpio === 'true') deshabilitado = ', disabled: true';
			else if (limpio === 'false') deshabilitado = '';
			else if (limpio.includes('__$DISCORD_DATA$__')) {
				deshabilitado = `, disabled: (${limpio})`;
			} else if (!thisArg.canSuppressAtComp(data, currentScope)) {
				throw AoiError.FunctionError(
					ErrorCode.InvalidArgumentType,
					`Expected true or false for 'disabled', received ${disabled}.`,
					data,
				);
			}
		}

		const boton = `{ type: 2, custom_id: ${textoJs(customId)}, label: ${textoJs(label)}, style: ${estilo}${deshabilitado}${emojiBoton(emoji)} }`;
		const arr = escapeVars(`${currentScope.name}_components`);

		// Los botones se agrupan solos en filas de hasta 5, como hace
		// Discord: si la última fila tiene hueco, el botón va ahí.
		const codigo = `{
			const __$aoi_row$__ = ${arr}.at(-1);
			if (__$aoi_row$__ && __$aoi_row$__.components.length < 5) {
				__$aoi_row$__.components.push(${boton});
			} else {
				${arr}.push({ type: 1, components: [${boton}] });
			}
		}`;

		const escaped = escapeResult(codigo);

		return {
			code: escaped,
			scope: scopes,
		};
	})
	.build();

export { $addButton };
