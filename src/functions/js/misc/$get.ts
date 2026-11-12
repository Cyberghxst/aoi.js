import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    assertVariableExists,
    escapeResult,
    escapeVars,
    removeSetFunc,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const get = new AoiJSFunction()
    .setName("$get")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the variable to get",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Any)
    .setDescription("Gets the value of the variable")
    .setExample(`
        $let[hello;world]
        $get[hello] // returns world
    `);

get.setCode((data: funcData, scope: Scope[], thisArg) => {
    const splits = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    if (thisArg.brackets) {
        if (
            !data.total.startsWith(thisArg.name + "[") &&
                (!currentScope.name.startsWith("$try_") ||
                    !currentScope.name.startsWith("$catch_"))
        ) {
            throw new TranspilerError(
                `${data.name} requires closure brackets`,
            );
        }
    }
    if (
        splits.length !== 1 &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name} requires 1 argument`);
    }
    const name = removeSetFunc(splits[0]);
    if (
        name === "" &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name} requires a name`);
    }
    assertVariableExists(currentScope, name, `${data.name} cannot find ${name}`);
    const res = `${escapeResult(escapeVars(name))}`;

    return thisArg.finishResult(scope, data, res);
}, get);

export const $get = get.build();
