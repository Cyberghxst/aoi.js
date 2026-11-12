import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const clientToken = new AoiJSFunction()
    .setName("$clientToken")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.String)
    .setDescription("Returns the token of client")
    .setExample("client token is `$clientToken`");

clientToken.setCode((data, scope, thisArg) => {
    const resultString = thisArg.getResultString(
        (discord) => discord.client.token,
        [],
    );
    const res = escapeResult(resultString as string);
    return thisArg.finishResult(scope, data, res);
}, clientToken);

export const $clientToken = clientToken.build();
