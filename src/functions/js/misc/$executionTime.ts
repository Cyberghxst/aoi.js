import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const executionTime = new AoiJSFunction()
    .setName("$executionTime")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(false)
    .setFields([])
    .setVersion("7.0.0")
    .setDefault([])
    .setReturns(ReturnType.Number)
    .setDescription("Returns the execution time of the code")
    .setExample(`
        $executionTime // returns the execution time of the code
    `);

executionTime.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);

    currentScope.setters = `const startTime = performance.now();\n${currentScope.setters}`;
    const res = `${escapeResult("((performance.now() - startTime).toFixed(3))")}`;
    return thisArg.finishResult(scope, data, res);
}, executionTime);

export const $executionTime = executionTime.build();
