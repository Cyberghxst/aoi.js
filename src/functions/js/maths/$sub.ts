import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, ReturnType, TranspilerCustoms } from "../../../typings/enums.js";
import {
    escapeMathResult,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const sub = new AoiJSFunction()
    .setName("$sub")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "numbers",
            type: "number",
            description: "The numbers to subtract",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the sub of the numbers")
    .setExample(`
    $sub[1;2] // returns -1
    $sub[7;4;3] // returns 0
    `);

sub.setCode((data, scope, thisArg) => {
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
    const sub = numbers
        .map((x) =>
            x.includes(TranspilerCustoms.FS) ||
                x.includes("__$DISCORD_DATA$__") ||
                x.includes(TranspilerCustoms.MFS)
                ? parseResult(x.trim())
                : Number(x),
        )
        .join("-");

    const res = escapeMathResult(`(${sub})`);
    return thisArg.finishResult(scope, data, res);
}, sub);

export const $sub = sub.build();
