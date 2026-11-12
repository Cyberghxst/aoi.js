import FunctionBuilder from '@aoi.js/core/builders/Function.js';
import AoiError from '@aoi.js/core/Error.js';
import { ErrorCode, FunctionType, ReturnType } from '@aoi.js/typings/enum.js';
import { escapeResult } from '@aoi.js/utils/Helpers/core.js';
import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Returns the value of a slash command option by its name
 * @example
 * ```aoi
 * ---
 * name: saludar
 * type: interaction
 * ---
 *
 * $option[nombre] // returns the value of the "nombre" option
 * $option[edad] // returns the value of the "edad" option
 * ```
 */
const $option = new FunctionBuilder()
	.setName('$option')
	.setBrackets(true)
	.setOptional(false)
	.setType(FunctionType.Getter)
	.setReturns(ReturnType.Any)
	.setFields([
		{
			name: 'name',
			type: ReturnType.String,
			required: true,
			description: 'The name of the option to get.',
		},
	])
	.setCode((data, scopes, thisArg) => {
		const currentScope = thisArg.getCurrentScope(scopes);
		const [name] = thisArg.getParams(data);

		if (!name && !thisArg.canSuppressAtComp(data, currentScope)) {
			throw AoiError.FunctionError(
				ErrorCode.MissingParameter,
				'Missing option name.',
				data,
			);
		}

		// El nombre es casi siempre un literal ("nombre"). Si viene de otra
		// función, se usa la expresión generada tal cual.
		const clean = name.trim().replace(/^(['"])(.*)\1$/, '$2');
		const nameExpr = clean.includes('__$DISCORD_DATA$__')
			? clean
			: JSON.stringify(clean);

		// Los paréntesis son necesarios: ?? tiene menos precedencia que +,
		// así que sin ellos $sum[$option[a];$option[b]] se evaluaría mal
		// (el ?? se comería la suma). El `as` solo existe en TypeScript:
		// al compilar se borra y el código generado queda limpio.
		const resultString = `(${thisArg.getResultString(
			(discord) =>
				(discord?.interaction as ChatInputCommandInteraction | undefined)
					?.options?.get("$0")?.value ?? '',
			[nameExpr],
		)})`;

		const escaped = escapeResult(resultString);

		return {
			code: escaped,
			scope: scopes,
		};
	})
	.build();

export { $option };
