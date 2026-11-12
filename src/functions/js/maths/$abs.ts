import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, ReturnType, TranspilerCustoms } from "../../../typings/enums.js";
import {
    escapeMathResult,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const abs = new AoiJSFunction()
    .setName("$abs")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "number",
            type: "number",
            description: "The number to get the absolute value from",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the Absolute value of the number")
    .setExample(`
    $abs[1] // returns 1
    $abs[-1] // returns 1
    `);

abs.setCode((data, scope, thisArg) => {
    const numbers = data.inside;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        data.splits.length === 0 &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(
            `${data.name} requires at least 1 argument`,
        );
    }
    if(!numbers) throw new TranspilerError(`${data.name} requires at least 1 argument`);
    let abs =
            numbers.includes( TranspilerCustoms.FS ) ||
                numbers.includes( "__$DISCORD_DATA$__" ) ||
                numbers.includes( TranspilerCustoms.MFS )
                ? parseResult( numbers.trim() )
                : Number( numbers );
    abs = `Math.abs(${abs})`;

    const res = escapeMathResult(`(${abs})`);
    return thisArg.finishResult(scope, data, res);
}, abs);

export const $abs = abs.build();
