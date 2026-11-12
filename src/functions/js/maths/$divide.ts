import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, ReturnType, TranspilerCustoms } from "../../../typings/enums.js";
import {
    escapeMathResult,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const divide = new AoiJSFunction()
    .setName("$divide")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "numbers",
            type: "number",
            description: "The numbers to divide",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the division of the numbers")
    .setExample(`
    $divide[1;2] // returns 0.5
    $divide[1;2;3] // returns 0.16666666666666666
    `);

divide.setCode((data, scope, thisArg) => {
    const numbers = data.splits;
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
    const divide = numbers
        .map((x) =>
            x.includes(TranspilerCustoms.FS) ||
                x.includes("__$DISCORD_DATA$__") ||
                x.includes(TranspilerCustoms.MFS)
                ? parseResult(x.trim())
                : Number(x),
        )
        .join("/");

    const res = escapeMathResult(`(${divide})`);
    return thisArg.finishResult(scope, data, res);
}, divide);

export const $divide = divide.build();
