import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const arrayConcat = new AoiJSFunction()
    .setName("$arrayConcat")
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
            type: "string[]",
            description: "The arrays to concatenate",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns("void")
    .setDescription("concatenates the specified values to the array")
    .setExample(`
        $arrayCreate[myArray;hello;world]
        $arrayCreate[myNextArray;nya]

        $arrayConcat[myArray;myNextArray] // myArray is now ["hello", "world", "nya"]
    `);

arrayConcat.setCode((data: funcData, scope: Scope[], thisArg) => {
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
    if (
        !currentScope.variables.every((x) => values.includes(x)) &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    )
        throw new TranspilerError(
            `${data.name}: array ${values
                .filter((x) => !currentScope.variables.includes(x))
                .join(", ")} do(es) not exist`,
        );

    currentScope.variables.push(name);
    const parsedValues = values.map((v) => escapeVars(v));
    const res = escapeResult(
        `const ${escapeVars(name)} = [...${parsedValues.join(", ...")}];`,
    );
    currentScope.update(res, data);

    return {
        code: "",
        scope,
    };
}, arrayConcat);

export const $arrayConcat = arrayConcat.build();
