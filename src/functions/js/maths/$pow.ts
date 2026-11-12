import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, TranspilerCustoms } from "../../../typings/enums.js";
import {
    escapeMathResult,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const pow = new AoiJSFunction()
    .setName("$pow")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "numbers",
            type: "number",
            description: "The numbers to get the power from",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("number")
    .setDescription("Returns the power of the numbers")
    .setExample(`
    $pow[1;2] // returns 1
    $pow[7;4;3] // returns 2401
    `);

pow.setCode((data, scope, thisArg) => {
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
    const pow = numbers
        .map((x) =>
            x.includes(TranspilerCustoms.FS) ||
                x.includes("__$DISCORD_DATA$__") ||
                x.includes(TranspilerCustoms.MFS)
                ? parseResult(x.trim())
                : Number(x),
        )
        .join("**");

    const res = escapeMathResult(`(${pow})`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, pow);

export const $pow = pow.build();
