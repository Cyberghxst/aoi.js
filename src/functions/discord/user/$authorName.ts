import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const authorName = new AoiJSFunction()
    .setName("$authorName")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.String)
    .setDescription("Returns the name of the author")
    .setExample("author name is `$authorName`");

authorName.setCode((data, scope, thisArg) => {

    const authorName = "__$DISCORD_DATA$__.author?.username";

    const res = escapeResult(`(${authorName})`);
    return thisArg.finishResult(scope, data, res);
}, authorName);

export const $authorName = authorName.build();
