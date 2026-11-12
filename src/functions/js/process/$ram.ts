import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { funcData, Scope } from "../../../index.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const ram = new AoiJSFunction()
    .setName("$ram")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "type",
            type: "rss|heapUsed|heapTotal|external|arrayBuffer",
            description: "The type of ram to get",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["rss"])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the bot's ram usage")
    .setExample(`
        $ram // returns the rss ram usage
        $ram[heapUsed] // returns the heapUsed ram usage
        $ram[heapTotal] // returns the heapTotal ram usage
        $ram[external] // returns the external ram usage
        $ram[arrayBuffer] // returns the arrayBuffer ram usage
        `);

ram.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const type = data.inside ?? "rss";

    const res = escapeResult(
        `(process.memoryUsage().${type} / 1024 / 1024).toFixed(2)`,
    );
    currentScope.rest = currentScope.rest.replace(data.total, res);
    return {
        code: res,
        scope: scope,
    };
}, ram);

export const $ram = ram.build();
