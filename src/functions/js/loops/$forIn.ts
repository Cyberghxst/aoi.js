import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError, Transpiler } from "../../../index.js";
import Scope from "../../../core/structs/Scope.js";
import { getFunctionList, escapeResult, escapeVars } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";
import funcs from "../../index.js";

const forIn = new AoiJSFunction()
    .setName("$forIn")
    .setType(FunctionType.Scope)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "variable",
            type: "string",
            description: "The variable to use",
            required: true,
        }, {
            name: "objectName",
            type: "string",
            description: "The object to use",
            required: true,
        },
        {
            name: "code",
            type: "string",
            description: "The code to execute",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void","void", "void"])
    .setReturns("void")
    .setDescription("ForIn statement")
    .setExample(`
        $createObject[object;{
            name: hello,
            age: 12
        }]
        $forIn[key;object;$log[key is $env[key]]
    `);

forIn.setCode((data, scope, thisArg) => {
    const splits = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        data.inside?.trim() === "" ||
            (!data.inside &&
                (!currentScope.name.startsWith("$try_") ||
                    !currentScope.name.startsWith("$catch_")))
    ) {
        throw new TranspilerError(
            `${data.name} function requires variable ,objectName and code`,
        );
    }
    if (
        data.splits.length < 2 &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(
            `${data.name} function requires objectName and code`,
        );
    }
    const [ variable,objectName, ...code ] = splits;

    currentScope.env.push( variable );
    if ( currentScope.objects[ objectName ] === undefined && !currentScope.name.startsWith( "$try_" ) && !currentScope.name.startsWith( "$catch_" ) )
    {
        throw new TranspilerError(
            `${ data.name } function requires objectName field as string`,
        );
    }

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
        executedCode = code.join( ";" );
    }
    const res = escapeResult(`
for(let ${variable} in ${escapeVars(objectName)}){
       ${
    typeof executedCode === "string"
        ? executedCode
        : (<{ code: string; scope: Scope[]; func: unknown }>(
                     executedCode
                 ))?.scope[0].toString(false)
}
}
`);
    currentScope.update(res,data);
    return { code: res, scope: scope, data };
}, forIn);

export const $forIn = forIn.build();
