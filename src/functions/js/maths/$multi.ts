import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, TranspilerCustoms } from "../../../typings/enums.js";
import {
    escapeMathResult,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const multi = new AoiJSFunction()
    .setName("$multi")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "numbers",
            type: "number",
            description: "The numbers to multiply",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("number")
    .setDescription("Returns the multiplication of the numbers")
    .setExample(`
    $multi[1;2] // returns 2
    $multi[1;2;3] // returns 6
    `);

multi.setCode((data, scope, thisArg) => {
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
    const multi = numbers
        .map((x) =>
            x.includes(TranspilerCustoms.FS) ||
                x.includes("__$DISCORD_DATA$__") ||
                x.includes(TranspilerCustoms.MFS)
                ? parseResult(x.trim())
                : Number(x),
        )
        .join("*");

    const res = escapeMathResult(`(${multi})`);
    currentScope.rest = currentScope.rest.replace(data.total, res);
    return {
        code: res,
        scope,
    };
}, multi);

export const $multi = multi.build();
