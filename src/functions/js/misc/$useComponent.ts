import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { StringObject, parseStringObject } from "../../../index.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const useComponent = new AoiJSFunction()
    .setName("$useComponent")
    .setType(FunctionType.FunctionGetter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the component to use",
            required: true,
        },
        {
            name: "data",
            type: "object",
            description: "The data to pass to the component",
            required: false,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "undefined"])
    .setReturns("any")
    .setDescription("use a component in the code")
    .setExample(`
        $useComponent[hello;{hello: world}] // executes the component hello with the data {hello: world}
    `);

useComponent.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    //code here

    const [name,...rest] = data.splits;
    const actualRestData = rest.join(";");

    const currentObj = new StringObject("{");
    currentObj.addEnd("}");

    const obj = parseStringObject(actualRestData, currentObj);

    const res= escapeResult(`
         ${currentScope.client.returnComponent(name,obj.solve())}
          `
    );

    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, useComponent);

export const $useComponent = useComponent.build();
