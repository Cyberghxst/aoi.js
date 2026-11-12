import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const message = new AoiJSFunction()
    .setName("$message")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "argsIndex",
            description: "The index of the argument",
            type: "number",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["all"])
    .setReturns("string")
    .setDescription("Returns the author's message")
    .setExample(`
        $message // returns the author's message

        $message[1] // returns the first argument
        `);

message.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const argsIndex = data.inside;
    const message = argsIndex
        ? `__$DISCORD_DATA$__.args?.[${argsIndex}]`
        : "__$DISCORD_DATA$__.args?.join(' ')";

    const res = escapeResult(`(${message})`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, message);

export const $message = message.build();
