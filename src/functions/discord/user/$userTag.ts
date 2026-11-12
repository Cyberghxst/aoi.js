import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult, parseResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const userTag = new AoiJSFunction()
    .setName("$userTag")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "user",
            type: "bigint",
            required: false,
        }
    ])
    .setVersion("7.0.0")
    .setDefault(["authorId"])
    .setReturns(ReturnType.String)
    .setDescription("Returns the tag of the user")
    .setExample(`
        $userTag // returns the tag of the author

        $userTag[123456789012345678] // returns the tag of the user with id 123456789012345678
    `);

userTag.setCode((data, scope, thisArg) => {

    const userTag = data.inside ? `(await __$DISCORD_DATA$__.bot.util.getUser(${parseResult(data.inside)}))?.tag` : "__$DISCORD_DATA$__.author?.tag";

    const res = escapeResult(`(${userTag})`);
    return thisArg.finishResult(scope, data, res);
}, userTag);

export const $userTag = userTag.build();
