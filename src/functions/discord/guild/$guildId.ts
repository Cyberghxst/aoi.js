import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const guildId = new AoiJSFunction()
    .setName("$guildId")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.BigInt)
    .setDescription("Returns the guildId of current guild")
    .setExample("current guild id is `$guildId`");

guildId.setCode((data, scope, thisArg) => {
    const guildId = thisArg.getResultString((discord) => discord.guild?.id, []);

    const res = escapeResult(`(${guildId})`);
    return thisArg.finishResult(scope, data, res);
}, guildId);

export const $guildId = guildId.build();
