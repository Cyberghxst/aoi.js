import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const clientPrefixes = new AoiJSFunction()
    .setName("$clientPrefixes")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.String)
    .setDescription("Returns the Prefixes of client").setExample(`
$clientPrefixes // returns the Prefixes of client
    `);

clientPrefixes.setCode((data, scope, thisArg) => {
    const resultString = thisArg.getResultString(
        (discord) =>
            Array.isArray(discord.bot.options.prefixes)
                ? discord.bot.options.prefixes.join(", ")
                : discord.bot.options.prefixes,
        [],
    );
    const res = escapeResult(resultString as string);
    return thisArg.finishResult(scope, data, res);
}, clientPrefixes);

export const $clientPrefixes = clientPrefixes.build();
