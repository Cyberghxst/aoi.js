import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { Scope, parseString } from "../../../index.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    convertToBool,
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const evalFunction = new AoiJSFunction()
    .setName("$eval")
    .setType(FunctionType.Function)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "output",
            type: "boolean",
            description: "Whether to send the output to the channel",
            required: true,
        },
        {
            name: "code",
            type: "string",
            description: "The code to evaluate",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Any)
    .setDescription("Evaluates the aoi.js code")
    .setExample(`
    $eval[true;$ping] // sends the ping to the channel
    `);

evalFunction.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [output, ...code] = data.splits;
    const parsedOutput = convertToBool(output);
    const currentScope = thisArg.getCurrentScope(scope);
    const executedCode = `Transpiler(${parseString(
        code.join(";"),
    )}, {sendMessage: ${parsedOutput} ,minify: false }).func(__$DISCORD_DATA$__);\n`;
    const res = escapeResult(`
    ${executedCode}
    `);
    if (
        !currentScope.packages.includes(
            "const { Transpiler } = await import('./transpiler.js');",
        )
    ) {
        currentScope.packages += "const { Transpiler } = await import('./transpiler.js');\n";
    }
    currentScope.rest = currentScope.rest.replace(data.total, res);

    data.funcs = [];
    return {
        code: res,
        scope: scope,
        data: data,
    };
}, evalFunction);

export const $eval = evalFunction.build();
