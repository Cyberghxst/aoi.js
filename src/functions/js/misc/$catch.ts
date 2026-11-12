import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { funcData, Scope, TranspilerError, Transpiler } from "../../../index.js";
import { parseResult, getFunctionList, escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";
import funcs from "../../index.js";

const catchFunction = new AoiJSFunction()
    .setName("$catch")
    .setType(FunctionType.Scope)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "code",
            type: "string",
            description: "The code to execute if the try statement fails",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Void)
    .setDescription("catch statement that executes when try fails")
    .setExample(`
        $try[
            $let[;1]
        ]
        $catch[
            $log[ 
                $env[catch_error]
            ]
        ]
    `);

catchFunction.setCode((data: funcData, scope: Scope[], thisArg) => {
    const code = data.inside;
    if (!code) {
        throw new TranspilerError(`${data.name}: Code Not Provided.`);
    }
    const currentScope = thisArg.getCurrentScope(scope);
    const hash = Math.floor(Math.random() * 1000000);
    const newscope = new Scope(
        `${data.name}_${hash}`,
        currentScope.client,
        currentScope.name,
        parseResult(code),
        true,
    );
    let codeexe;
    const funcList = getFunctionList(code, Object.keys(funcs));
    if ( !funcList.length )
    {
        codeexe = code;
    } else
    {
        codeexe = Transpiler(code, {
            sendMessage: true,
            scopeData: {
                variables: currentScope.variables,
                embeds: currentScope.embeds,
                name: newscope.name,
                env: ["catch_error"],
            },
            client: currentScope.client,
        });
        newscope.functions = codeexe.scope[ 0 ].functions + "\n";
        newscope.packages = codeexe.scope[ 0 ].packages + "\n";
        newscope.setters = codeexe.scope[ 0 ].setters + "\n";
        newscope.rest = codeexe.scope[ 0 ].rest + "\n";
        newscope.sendData = codeexe.scope[ 0 ].sendData;
        newscope.embeds = codeexe.scope[ 0 ].embeds;
        newscope.components = codeexe.scope[ 0 ].components;
        newscope.files = codeexe.scope[ 0 ].files;
        newscope.stickers = codeexe.scope[ 0 ].stickers;
        newscope.variables = codeexe.scope[ 0 ].variables;
    }
    const res = escapeResult(`catch(catch_error) {
        ${newscope.toString(true)}
    }`);
    currentScope.rest = currentScope.rest.replace(data.total, res);
    data.funcs = [];
    return {
        code: res,
        scope: scope,
        data,
    };
}, catchFunction);

export const $catch = catchFunction.build();
