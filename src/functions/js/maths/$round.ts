import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, ReturnType, TranspilerCustoms } from "../../../typings/enums.js";
import {
    escapeMathResult,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const round = new AoiJSFunction()
    .setName("$round")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "number",
            type: "number",
            description: "The number to round off",
            required: true,
        }, {
            name: "decimal",
            type: "number",
            description: "The decimal to round off",
            required: false,
        }
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the Roundo off value of the number")
    .setExample(`
    $round[1;2] // returns 1.00
    $round[1.2;0] // returns 1
    `);

round.setCode((data, scope, thisArg) => {
    const [number,decimal = "0"] = data.splits;
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
    if (!number)
        throw new TranspilerError(
            `${data.name} requires at least 1 argument`,
        );
    let round =
            number.includes(TranspilerCustoms.FS) ||
            number.includes("__$DISCORD_DATA$__") ||
            number.includes(TranspilerCustoms.MFS)
                ? parseResult(number.trim())
                : Number( number );
    const rounddecimal =
            decimal.includes( TranspilerCustoms.FS ) ||
            decimal.includes( "__$DISCORD_DATA$__" ) ||
            decimal.includes( TranspilerCustoms.MFS )
                ? parseResult( decimal.trim() )
                : Number( decimal );

    round = `((${round}).toFixed(${rounddecimal}))`;

    const res = escapeMathResult(`(${round})`);
    return thisArg.finishResult(scope, data, res);
}, round);

export const $round = round.build();
