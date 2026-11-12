import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const ping = new AoiJSFunction()
    .setName("$ping")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the Ping of client")
    .setExample("client ping is `$pingms`");

ping.setCode((data, scope, thisArg) => {
    const resultString = thisArg.getResultString(
        (discord) => discord.client.ws.data.ping,
        [],
    );
    const res = escapeResult(resultString as string);
    return thisArg.finishResult(scope, data, res);
}, ping);

export const $ping = ping.build();
