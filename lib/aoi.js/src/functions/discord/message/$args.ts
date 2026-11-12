import FunctionBuilder from '@aoi.js/core/builders/Function.js';
import AoiError from '@aoi.js/core/Error.js';
import { ErrorCode, FunctionType, ReturnType } from '@aoi.js/typings/enum.js';
import { escapeResult } from '@aoi.js/utils/Helpers/core.js';

/**
 * Returns the arguments of the command
 * @example
 * ```aoi
 * ---
 * name: eco
 * type: basic
 * ---
 *
 * $args // returns all the arguments joined by a space
 * $args[1] // returns the first argument
 * $args[2] // returns the second argument
 * ```
 */
const $args = new FunctionBuilder()
	.setName('$args')
	.setBrackets(true)
	.setOptional(true)
	.setType(FunctionType.Getter)
	.setReturns(ReturnType.String)
	.setFields([
		{
			name: 'index',
			type: ReturnType.Number,
			required: false,
			description:
				'The index of the argument to get, starting at 1. If not provided, it will return all the arguments joined by a space.',
		},
	])
	.setCode((data, scopes, thisArg) => {
		const currentScope = thisArg.getCurrentScope(scopes);
		const [index] = thisArg.getParams(data);

		let resultString: string;
		if (!index) {
			// Los paréntesis son necesarios: ?? tiene menos precedencia
			// que +, así que sin ellos $sum[$args[1];$args[2]] (o un
			// $option dentro de una suma) se evaluaría mal.
			resultString = `(${thisArg.getResultString(
				(discord) => discord?.args?.join(' ') ?? '',
			)})`;
		} else {
			if (
				(isNaN(Number(index)) ||
					Number(index) < 1 ||
					!Number.isInteger(Number(index))) &&
				!thisArg.canSuppressAtComp(data, currentScope)
			) {
				throw AoiError.FunctionError(
					ErrorCode.InvalidArgumentType,
					`Expected a positive integer for index, received ${index}.`,
					data,
				);
			}

			// $args es 1-based, como en aoi.js v6 y BDFD: $args[1] es el
			// primer argumento (args[0] en el array de JavaScript).
			resultString = `(${thisArg.getResultString(
				(discord) => discord?.args?.['$0' as unknown as number] ?? '',
				[String(Number(index) - 1)],
			)})`;
		}

		const escaped = escapeResult(resultString);

		return {
			code: escaped,
			scope: scopes,
		};
	})
	.build();

export { $args };
