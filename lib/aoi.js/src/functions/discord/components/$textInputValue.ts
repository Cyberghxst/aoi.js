import FunctionBuilder from '@aoi.js/core/builders/Function.js';
import AoiError from '@aoi.js/core/Error.js';
import { ErrorCode, FunctionType, ReturnType } from '@aoi.js/typings/enum.js';
import { escapeResult } from '@aoi.js/utils/Helpers/core.js';
import type { ModalSubmitInteraction } from 'discord.js';

/**
 * Returns the value of a modal text input by its custom id
 * @example
 * ```aoi
 * ---
 * name: form
 * type: component
 * ---
 *
 * Me has dicho: $textInputValue[nombre]
 * ```
 */
const $textInputValue = new FunctionBuilder()
	.setName('$textInputValue')
	.setBrackets(true)
	.setOptional(false)
	.setType(FunctionType.Getter)
	.setReturns(ReturnType.String)
	.setFields([
		{
			name: 'inputId',
			type: ReturnType.String,
			required: true,
			description: 'The custom id of the text input to read.',
		},
	])
	.setCode((data, scopes, thisArg) => {
		const currentScope = thisArg.getCurrentScope(scopes);
		const [inputId] = thisArg.getParams(data);

		if (!inputId && !thisArg.canSuppressAtComp(data, currentScope)) {
			throw AoiError.FunctionError(
				ErrorCode.MissingParameter,
				"Missing parameter 'inputId' in function $textInputValue",
				data,
			);
		}

		// El nombre es casi siempre un literal ("nombre"). Si viene de otra
		// función, se usa la expresión generada tal cual.
		const clean = inputId.trim().replace(/^(['"])(.*)\1$/, '$2');
		const nameExpr = clean.includes('__$DISCORD_DATA$__')
			? clean
			: JSON.stringify(clean);

		// Los paréntesis son necesarios: ?? tiene menos precedencia que +.
		// El `as` solo existe en TypeScript: al compilar se borra y el
		// código generado queda limpio.
		const resultString = `(${thisArg.getResultString(
			(discord) =>
				(discord?.interaction as ModalSubmitInteraction | undefined)
					?.fields?.getTextInputValue("$0") ?? '',
			[nameExpr],
		)})`;

		const escaped = escapeResult(resultString);

		return {
			code: escaped,
			scope: scopes,
		};
	})
	.build();

export { $textInputValue };
