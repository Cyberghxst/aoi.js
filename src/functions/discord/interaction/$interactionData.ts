import AoiJSFunction from "../../../structures/AoiJSFunction.js";
import { escapeResult } from "../../../util/transpilerHelpers.js";
import { FunctionType, ReturnType } from "../../../typings/enums.js";

const interactionData = new AoiJSFunction()
    .setName("$interactionData")
    .setType(FunctionType.Getter)
    .setBrackets(true)
    .setOptional(true)
    .setFields([
        {
            name: "property",
            type: "string",
            required: false,
            description: "The property to get from the interaction data",
        },
    ])
    .setVersion("7.0.0")
    .setDefault(["void"])
    .setReturns(ReturnType.Any)
    .setDescription("gets the interaction data").setExample(`
        $interactionData[user.id] // returns the user's id of the interaction
    `);

interactionData.setCode((data, scope, thisArg) => {
    const property = data.inside;

    const res = escapeResult(
        !property?.trim()
            ? "__$Discord_Data$__.interaction"
            : `__$Discord_Data$__.interaction?.${property}`,
    );

    return thisArg.finishResult(scope, data, res);
}, interactionData);

export const $interactionData = interactionData.build();
