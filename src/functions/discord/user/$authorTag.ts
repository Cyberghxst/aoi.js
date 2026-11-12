import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const authorTag = new AoiJSFunction()
    .setName("$authorTag")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.String)
    .setDescription("Returns the tag of the author")
    .setExample("author tag is `$authorTag`");

authorTag.setCode((data, scope, thisArg) => {

    const authorTag = "__$DISCORD_DATA$__.author?.tag";

    const res = escapeResult(`(${authorTag})`);
    return thisArg.finishResult(scope, data, res);
}, authorTag);

export const $authorTag = authorTag.build();
