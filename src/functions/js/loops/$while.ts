import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError, Transpiler, conditionLexer } from "../../../index.js";
import Scope from "../../../core/structs/Scope.js";
import { AsyncFunction } from "../../../typings/types.js";
import { getFunctionList, escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";
import funcs from "../../index.js";

const whileFunction = new AoiJSFunction()
    .setName("$while")
    .setType(FunctionType.Scope)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "condition",
            type: "string",
            description: "The condition to check",
            required: true,
        },
        {
            name: "code",
            type: "string",
            description: "The code to execute if the while statement is true",
            required: true,
        },
    ])
    .setVersion("1.0.0")
    .setDefault(["void", "void"])
    .setReturns(ReturnType.Void)
    .setDescription("While statement")
    .setExample(`
        $let[num;1]
        $while[$get[num] < 5;
            $log[hello world]
            $inc[$get[num]]
        ]
    `);

whileFunction.setCode((data, scope, thisArg) => {
    const splits = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        data.inside?.trim() === "" ||
            (!data.inside &&
                (!currentScope.name.startsWith("$try_") ||
                    !currentScope.name.startsWith("$catch_")))
    ) {
        throw new TranspilerError(
            `${data.name} function requires condition and code`,
        );
    }
    if (
        data.splits.length < 2 &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(
            `${data.name} function requires condition and code`,
        );
    }
    const [ condition, ...code ] = splits;

    const conditionFunctionList = getFunctionList(
        condition,
        Object.keys(funcs),
    );
    let executedCondition;
    if (conditionFunctionList.length) {
        executedCondition = Transpiler(condition, {
            sendMessage: false,
            scopeData: {
                variables: currentScope.variables,
                name: currentScope.name,
                objects: currentScope.objects,
                env: currentScope.env,
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

    let executedCode;
    const codeFunctionList = getFunctionList(
        code.join(";"),
        Object.keys(funcs),
    );
    if (codeFunctionList.length) {
        executedCode = Transpiler(code.join(";"), {
            sendMessage: false,
            scopeData: {
                variables: currentScope.variables,
                embeds: currentScope.embeds,
                name: currentScope.name,
                objects: currentScope.objects,
                env: currentScope.env,
            },
            client: currentScope.client,
        });
    } else {
        executedCode = code.join(";");
    }
    const res = escapeResult(`
while(${executedCondition}) {
   ${
    typeof executedCode === "string"
        ? executedCode
        : (<{ code: string; scope: Scope[]; func: AsyncFunction }>(
                 executedCode
             ))?.scope[0].toString(false)
}
}
`);
    return thisArg.finishResult(scope, data, res);
}, whileFunction);

export const $while = whileFunction.build();
