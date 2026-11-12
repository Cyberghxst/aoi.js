import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { funcData, Scope } from "../../../index.js";
import { escapeFunctionResult, parseData, parseResult } from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

/**
 * Converts a value to its string representation: objects are inspected
 * with util.inspect, anything else uses its own toString().
 * @param data - The value to convert to a string.
 */
const toString = new AoiJSFunction()
    .setName("$toString")
    .setType(FunctionType.FunctionGetter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "data",
            type: "any",
            description: "The data to convert to string",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault([ "void"])
    .setReturns("string")
    .setDescription("Checks if the text toString the search")
    .setExample(`
        $toString[Hello World] // returns "Hello World"
        $toString[1] // returns "1"
        $toString[true] // returns "true"
        `);

toString.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const value = <string>data.inside;
    const parsedValue = parseResult(parseData(value));
    if(!currentScope.functions.includes("function __$toString$__(value) {")){
        currentScope.functions += `
function __$toString$__(value) {
    if(typeof value === "object") return UTIL.inspect(value,{depth:0});
    return value.toString();
}
`;
    }
    if(!currentScope.packages.includes("const UTIL = await import(\"util\");")){
        currentScope.packages += `
const UTIL = await import("util");
`;
    }

    const res = escapeFunctionResult(`__$toString$__(${parsedValue})`);
    currentScope.update(res, data);

    return {
        code: res,
        scope: scope,
    };
}, toString);

export const $toString = toString.build();
