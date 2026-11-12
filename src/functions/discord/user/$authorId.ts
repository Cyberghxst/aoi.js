import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const authorId = new AoiJSFunction()
    .setName("$authorId")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.BigInt)
    .setDescription("Returns the id of the author")
    .setExample("author id is `$authorId`");

authorId.setCode((data, scope, thisArg) => {

    const authorId = "__$DISCORD_DATA$__.author?.id";

    const res = escapeResult(`(${authorId})`);
    return thisArg.finishResult(scope, data, res);
}, authorId);

export const $authorId = authorId.build();
