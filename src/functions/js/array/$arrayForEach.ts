import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { Transpiler, conditionLexer, functions } from "../../../index.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
    getFunctionList,
    parseResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const arrayForEach = new AoiJSFunction()
    .setName("$arrayForEach")
    .setType(FunctionType.Scope)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the array",
            required: true,
        },
        {
            name: "code",
            type: "function",
            description: "The code to execute",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns("void")
    .setDescription("for each element in the array, execute the condition")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayForEach[myArray;$log[$env[array_element]]] // logs "hello", "world", "nya"
    `);

arrayForEach.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [name, ...values] = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        !currentScope.variables.includes(name) &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    )
        throw new TranspilerError(
            `${data.name}: Variable ${name} does not exists`,
        );

    const condition = values.join(";");
    const conditionFunctionList = getFunctionList(
        condition,
        Object.keys(functions),
    );
    let executedCondition;
    if (conditionFunctionList.length) {
        executedCondition = Transpiler(condition, {
            sendMessage: false,
            scopeData: {
                variables: currentScope.variables,
                name: currentScope.name,
                objects: currentScope.objects,
                env: [...currentScope.env, "array_element"],
            },
            client: currentScope.client,
        });
        currentScope.functions +=
                executedCondition.scope[0].functions + "\n";
        currentScope.packages += executedCondition.scope[0].packages;
        executedCondition = executedCondition.code;
    } else {
        executedCondition = condition;
    }
    executedCondition = conditionLexer(executedCondition);

    executedCondition = executedCondition.solve();

    const res = escapeResult(
        `${escapeVars(name)}.forEach(async array_element => {
                ${parseResult(executedCondition)}
            })`,
    );

    currentScope.update(res, data);
    return {
        code: res,
        scope,
        data,
    };
}, arrayForEach);

export const $arrayForEach = arrayForEach.build();
