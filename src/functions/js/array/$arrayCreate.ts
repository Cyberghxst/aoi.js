import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { StringObject, parseStringObject } from "../../../index.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
    parseData,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const arrayCreate = new AoiJSFunction()
    .setName("$arrayCreate")
    .setType(FunctionType.Setter)
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
            name: "values",
            type: "unknown",
            description: "The values to create the array with",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns("void")
    .setDescription("creates an array with the specified values")
    .setExample(`
        $arrayCreate[myArray;hello;world;nya]
        $arrayCreate[myNextArray;1;2;3]
    `);

arrayCreate.setCode((data: funcData, scope: Scope[], thisArg) => {
    const [name, ...values] = data.splits;
    const currentScope = thisArg.getCurrentScope(scope);
    if (
        currentScope.objects[name] &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    )
        throw new TranspilerError(
            `${data.name}: Variable ${name} already exists`,
        );
    const parsedValues = values.map((v) => parseData(v));
    const currentObj = new StringObject("[");
    currentObj.addEnd("]");

    const array = parseStringObject(
        `[${parsedValues.join(" , ")}]`,
        currentObj,
    );

    currentScope.objects[name] = <StringObject>array;
    currentScope.variables.push(name);

    const res = escapeResult(
        `const ${escapeVars(name)} = ${array.solve()};`,
    );
    currentScope.update(res, data);

    return {
        code: "",
        scope,
    };
}, arrayCreate);

export const $arrayCreate = arrayCreate.build();
