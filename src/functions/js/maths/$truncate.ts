import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import { FunctionType, TranspilerCustoms } from "../../../typings/enums.js";
import {
    escapeMathResult,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const truncate = new AoiJSFunction()
    .setName("$truncate")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "number",
            type: "number",
            description: "The number to truncate off",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns("number")
    .setDescription("Returns the Truncate off value of the number")
    .setExample(`
    $truncate[1.22342] // returns 1
`);

truncate.setCode((data, scope, thisArg) => {
    const number = data.inside ?? "";
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
    let truncate =
            number.includes(TranspilerCustoms.FS) ||
            number.includes("__$DISCORD_DATA$__") ||
            number.includes(TranspilerCustoms.MFS)
                ? parseResult(number.trim())
                : Number(number);

    truncate = `(Math.trunc(${truncate}))`;

    const res = escapeMathResult(`(${truncate})`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, truncate);

export const $truncate = truncate.build();
