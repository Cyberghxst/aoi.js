import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { funcData, TranspilerError } from "../../../index.js";
import Scope from "../../../core/structs/Scope.js";
import { escapeFunctionResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const inc = new AoiJSFunction()
    .setName("$inc")
    .setType(FunctionType.Function)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "variable",
            type: "string",
            description: "The variable to increment",
            required: true,
        },
        {
            name: "incrementFunction",
            type: "function",
            description: "The function to increment the variable",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "++"])
    .setReturns("void")
    .setDescription("Increments the variable")
    .setExample("$inc[$get[i]]");

inc.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [variable, ...incrementFunction] = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        variable === "" &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name} requires a variable`);
    }
    if (incrementFunction.length === 0) {
        incrementFunction.push("++");
    }
    const incrementFunctionString = incrementFunction.join(";");
    const res = escapeFunctionResult(
        `${variable}${incrementFunctionString};`,
    );
    currentScope.update( res, data );
    return {
        code: res,
        scope: scope,
    };
}, inc);

export const $inc = inc.build();
