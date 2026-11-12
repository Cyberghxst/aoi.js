import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import {
    escapeResult,
} from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const authorAvatar = new AoiJSFunction()
    .setName("$authorAvatar")
    .setType(FunctionType.Getter)
    .setBrackets(false)
    .setOptional(true)
    .setFields([
        {
            name: "size",
            type: "number",
            description: "The size of the avatar",
            required: false,
        },
        {
            name: "dynamic",
            type: "boolean",
            description: "Whether the avatar is dynamic",
            required: false,
        },
        {
            name: "format",
            type: "string",
            description: "The format of the avatar",
            required: false,
        }
    ])
    .setVersion("7.0.0")
    .setDefault(["1024", "true", "'png'"])
    .setReturns(ReturnType.String)
    .setDescription("Returns the avatar of the author")
    .setExample(`
        $authorAvatar // returns the avatar of the author

        $authorAvatar[4096;true;png] // returns the avatar of the author with size 4096, dynamic true and format png
    `);

authorAvatar.setCode((data, scope, thisArg) => {

    const [size=1024,dynamic=true,format="'png'"] = data.splits;

    const avatar = `__$DISCORD_DATA$__.author?.avatarUrl({size: ${size}, dynamic: ${dynamic}, format: ${format} })`;

    const res = escapeResult(`(${avatar})`);
    return thisArg.finishResult(scope, data, res);
}, authorAvatar);

export const $authorAvatar = authorAvatar.build();
