import FunctionBuilder from '@aoi.js/core/builders/Function.js';
import { FunctionType, ReturnType } from '@aoi.js/typings/enum.js';
import { escapeResult } from '@aoi.js/utils/Helpers/core.js';

/**
 * Updates the original message of the interaction instead of replying
 * with a new one
 * @example
 * ```aoi
 * ---
 * name: saludo_btn
 * type: component
 * ---
 *
 * ¡Hola! Has pulsado el botón. $interactionUpdate
 * ```
 */
const $interactionUpdate = new FunctionBuilder()
	.setName('$interactionUpdate')
	.setBrackets(false)
	.setFields([])
	.setOptional(false)
	.setType(FunctionType.Function)
	.setReturns(ReturnType.Void)
	.setCode((data, scopes, thisArg) => {
		const currentScope = thisArg.getCurrentScope(scopes);
		// La respuesta del comando pasa de ser un mensaje nuevo (reply) a
		// editar el mensaje original de la interacción (update). El
		// contenido y los botones son los mismos del comando: solo cambia
		// el transporte. Sin interacción no hace nada en vez de romper.
		currentScope.sendFunction =
			'await __$DISCORD_DATA$__?.interaction?.update';
		// No genera código: el cambio está en el scope, y Scope.generate
		// lo usa al construir el envío.
		return {
			code: escapeResult(''),
			scope: scopes,
		};
	})
	.build();

export { $interactionUpdate };
