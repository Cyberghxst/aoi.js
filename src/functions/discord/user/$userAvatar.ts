import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType } from "../../../typings/enums.js";

const userAvatar = new AoiJSFunction()
    .setName("$userAvatar")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(false)
    .setFields([
        {
            name: "user",
            type: "bigint",
            description: "Id of the user",
            required: false,
        },
        {
            name: "size",
            type: "number",
            description: "Size of the avatar",
            required: false,
        }   ,{
            name: "dynamic",
            type: "boolean",
            description: "Whether the avatar is dynamic",
            required: false,
        },{
            name: "format",
            type: "string",
            description: "The format of the avatar",
            required: false,
        }
    ])
    .setVersion("7.0.0")
    .setDefault([
        "void",
        "1024",
        "true",
        "'png'",
    ])
    .setReturns("string")
    .setDescription("Returns the avatar of the user")
    .setExample(`
        $userAvatar // returns the avatar of the user

        $userAvatar[123456789012345678n;4096;true;png] // returns the avatar of the user with size 4096, dynamic true and format png
    `);

userAvatar.setCode((data, scope, thisArg) => {
    const currentScope = thisArg.getCurrentScope(scope);

    const [id,size=1024,dynamic=true,format="'png'"] = data.splits;

    const avatar = `(await __$DISCORD_DATA$__.bot.util.getUser(${id}))?.avatarUrl({size: ${size}, dynamic: ${dynamic}, format: ${format} }`;

    const res = escapeResult(`${avatar}`);
    currentScope.update(res, data);
    return {
        code: res,
        scope,
    };
}, userAvatar);

export const $userAvatar = userAvatar.build();
