import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { Transpiler, functions } from "../../../index.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
    getFunctionList,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const arrayMap = new AoiJSFunction()
    .setName("$arrayMap")
    .setType(FunctionType.ScopeGetter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            required: true,
        },
        {
            name: "query",
            type: "function",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns("array")
    .setDescription("maps the array based on the code")
    .setExample(`
        $arrayCreate[myArray;1;2;3;4;5]
        $arrayMap[myArray;$sum[$env[array_element];1]] // returns [2,3,4,5,6]
    `);

arrayMap.setCode((data: funcData, scope: Scope[], thisArg) => {
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

    const code = values.join(";");

    const codeFunctionList = getFunctionList(code, Object.keys(functions));

    let executedCode;
    if (codeFunctionList.length) {
        executedCode = Transpiler(code, {
            sendMessage: false,
            scopeData: {
                variables: currentScope.variables,
                name: currentScope.name,
                objects: currentScope.objects,
                env: [...currentScope.env, "array_element"],
            },
            client: currentScope.client,
        });
        currentScope.functions += executedCode.scope[0].functions + "\n";
        currentScope.packages += executedCode.scope[0].packages;
        executedCode = executedCode.code;
    } else {
        executedCode = code;
    }

    const res = escapeResult(`
                ${escapeVars(name)}.map(array_element => {
                    ${executedCode}
                    })`);

    currentScope.update(res, data);

    return {
        code: res,
        scope,
        data,
    };
}, arrayMap);

export const $arrayMap = arrayMap.build();
