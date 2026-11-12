import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError,Scope } from "../../../core/index.js";

import { funcData } from "../../../typings/interfaces.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const passData = new AoiJSFunction()
    .setName("$passData")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "passData",
            type: "string",
            description: "access the data passed to the command from another command",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.StringOptional)
    .setDescription("return the data passed to the command from another command")
    .setExample(`
    $passData[hello] // returns the data passed to the command from another command
`);

passData.setCode((data: funcData, scope: Scope[], thisArg) => {
    const passData = data.inside;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        !passData &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: PASSDATA Not Provided.`);
    }
    const res = escapeResult(`__$DISCORD_DATA$__${passData}`);
    return thisArg.finishResult(scope, data, res);
}, passData);

export const $passData = passData.build();
