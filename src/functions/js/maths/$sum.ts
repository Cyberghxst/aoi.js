import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, ReturnType, TranspilerCustoms } from "../../../typings/enums.js";
import { escapeMathResult, parseResult } from "../../../util/transpilerHelpers.js";

const sum = new AoiJSFunction()
    .setName("$sum")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "numbers",
            type: "number",
            description: "The numbers to add",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the sum of the numbers")
    .setExample(`
    $sum[1;2] // returns 3
    $sum[7;4;3] // returns 14
    `);

sum.setCode((data, scope, thisArg) => {
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
    const sum = numbers
        .map((x) =>
            x.includes(TranspilerCustoms.FS) ||
                x.includes("__$DISCORD_DATA$__") ||
                x.includes(TranspilerCustoms.MFS)
                ? parseResult(x.trim())
                : Number(x),
        )
        .join("+");

    const res = escapeMathResult(`(${sum})`);
    return thisArg.finishResult(scope, data, res);
}, sum);

export const $sum = sum.build();
