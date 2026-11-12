import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const username = new AoiJSFunction()
    .setName("$username")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "user",
            type: "bigint",
            required: true,
        }
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.String)
    .setDescription("Returns the name of the user")
    .setExample(`
        $username[$authorId] // returns the name of the author

        $username[123456789012345678] // returns the name of the user with id 123456789012345678
    `);

username.setCode((data, scope, thisArg) => {

    const id = data.inside;

    const username = `(await __$DISCORD_DATA$__.bot.util.getUser(${id}))?.username`;

    const res = escapeResult(`(${username})`);
    return thisArg.finishResult(scope, data, res);
}, username);

export const $username = username.build();
