import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../index.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const userId = new AoiJSFunction()
    .setName("$userId")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([{ name: "username", type: "string", required: true,description: "The username of the user" }])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.BigInt)
    .setDescription("Returns the id of the user ( provided user should have mutual servers with the bot )")
    .setExample(`
        $userId[leref] // returns the id of the user with provided username
        `);

userId.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const name = data.inside;
    if (
        name === "" &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name} requires a username.`);
    }
    const userId = `(await __$DISCORD_DATA$__.bot.util.findUser(\`${name}\`))?.id`;

    const res = escapeResult(`(${userId})`);
    return thisArg.finishResult(scope, data, res);
}, userId);

export const $userId = userId.build();
