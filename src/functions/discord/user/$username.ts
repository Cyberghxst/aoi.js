import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

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
    .setReturns("string")
    .setDescription("Returns the name of the user")
    .setExample(`
        $username[$authorId] // returns the name of the author

        $username[123456789012345678] // returns the name of the user with id 123456789012345678
    `);

username.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);

    const id = data.inside;

    const username = `(await __$DISCORD_DATA$__.bot.util.getUser(${id}))?.username`;

    const res = escapeResult(`(${username})`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, username);

export const $username = username.build();
