import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { TranspilerError } from "../../../core/error.js";
import Scope from "../../../core/structs/Scope.js";
import { StringObject, parseStringObject } from "../../../index.js";
import { FunctionType, TranspilerCustoms } from "../../../typings/enums.js";
import { funcData } from "../../../typings/interfaces.js";
import {
    escapeResult,
    escapeVars,
    parseResult,
} from "../../../util/transpilerHelpers.js";

const createObject = new AoiJSFunction()
    .setName("$createObject")
    .setType(FunctionType.Setter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "name",
            type: "string",
            description: "The name of the object to create",
            required: true,
        },
        {
            name: "object",
            type: "json",
            description: "The object to create",
            required: true,
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void", "void"])
    .setReturns("void")
    .setDescription("creates an Object")
    .setExample(`
        $createObject[object;{key:value}]
        $getObjectProperty[object;key] // returns value
    `);

createObject.setCode((data: funcData, scope: Scope[], thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);
    const [name, ...obj] = data.splits;
    const parsedObj = obj.join(";").trim();
    if (
        !obj.length &&
            !currentScope.name.startsWith("$try_") &&
            !currentScope.name.startsWith("$catch_")
    ) {
        throw new TranspilerError(`${data.name}: No Object Provided`);
    }
    const currentObj = new StringObject("{");
    currentObj.addEnd("}");
    let object;
    try {
        if([TranspilerCustoms.FFS,TranspilerCustoms.FS].some(x => parsedObj.startsWith(x))){
            object = parsedObj;
        }
        else {
            if(parsedObj.startsWith("[") && parsedObj.endsWith("]")) currentObj.start = "[", currentObj.addEnd("]");
            object = parseStringObject(parsedObj, currentObj);
        }
    } catch (e) {
        throw new TranspilerError(`${data.name}: Invalid Object Provided`);
    }
    const res = escapeResult(
        `const ${escapeVars(name)} =  ${typeof object === "string" ? object : parseResult(object.solve())};`,
    );
    currentScope.objects[name] = <StringObject>object;
    currentScope.variables.push(name);
    currentScope.update( res, data );
    return {
        code: "",
        scope,
    };
}, createObject);

export const $createObject = createObject.build();
