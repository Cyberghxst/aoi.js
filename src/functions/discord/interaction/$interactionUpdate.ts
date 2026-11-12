import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { Transpiler, TranspilerError, functions } from "../../../index.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    getFunctionList,
    parseResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const interactionUpdate = new AoiJSFunction()
    .setName("$interactionUpdate")
    .setType(FunctionType.Scope)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "msg",
            type: "string",
            description: "The message to send",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Void)
    .setDescription("updates the original message of the interaction (only for message components)")
    .setExample(`
        $interactionUpdate[hello world] // updates the original message with "hello world"

        $interactionUpdate[
            $title[hello world]
            $description[hello world]
        ] // updates the original message with an embed
    `);

interactionUpdate.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const funcs = [
        ...Object.keys(functions),
        ...currentScope.client.managers.functions.functions.K(),
    ];
        //code here

    const msg = data.inside as string;

    if (
        !msg &&
            (currentScope?.name.startsWith("$try") ||
                currentScope?.name.startsWith("$catch"))
    )
        throw new TranspilerError(
            `${data.name} requires a message or content`,
        );

    let msgExecute;
    const msgFunctionList = getFunctionList(msg, funcs);
    const hash = Math.floor(Math.random() * 1000000);
    const newscope = new Scope(
        `${data.name}_${hash}`,
        currentScope.client,
        currentScope.name,
        parseResult(msg),
        false,
    );
    if (msgFunctionList.length) {
        msgExecute = Transpiler(msg, {
            client: currentScope.client,
            customFunctions:
                    currentScope.client.managers.functions.functions.toJSON(),
            sendMessage: false,
            scopeData: {
                variables: currentScope.variables,
                embeds: currentScope.embeds,
                name: newscope.name,
                objects: currentScope.objects,
            },
        });
        newscope.functions = msgExecute.scope[0].functions + "\n";
        newscope.packages = msgExecute.scope[0].packages + "\n";
        newscope.setters = msgExecute.scope[0].setters + "\n";
        newscope.rest = msgExecute.scope[0].rest + "\n";
        newscope.sendData = msgExecute.scope[0].sendData;
        newscope.embeds = msgExecute.scope[0].embeds;
        newscope.components = msgExecute.scope[0].components;
        newscope.files = msgExecute.scope[0].files;
        newscope.stickers = msgExecute.scope[0].stickers;
        newscope.variables = msgExecute.scope[0].variables;
    }

    const res = escapeResult(
        `await __$DISCORD_DATA$__.client.createInteractionResponse(__$DISCORD_DATA$__.interaction.id, __$DISCORD_DATA$__.interaction.token, 7, ${newscope.toString(
            false,
        )});`,
    );

    return thisArg.finishResult(scope, data, res);
}, interactionUpdate);

export const $interactionUpdate = interactionUpdate.build();
