import StringObject from "../structs/StringObject.js";
import { parseString } from "./stringParser.js";
import { parseData } from "../../util/transpilerHelpers.js";

export const ObjectQuoteRegex = /".*?"/g;

/**
 * Resolves one raw element of an object/array literal to its value.
 *
 * Quoted strings are unwrapped before parsing so separators inside them
 * (`:`, `{`, `,`, ...) are not mistaken for structure, and text that only
 * wraps generated functions is left untouched so the functions still run.
 */
function parseObjectValue(rawText: string) {
    let parsedValue = parseData(rawText.trim());
    if (typeof parsedValue === "string") {
        if (
            parsedValue.trim().startsWith("'") ||
            parsedValue.trim().startsWith("\"") ||
            parsedValue.trim().startsWith("`")
        ) {
            parsedValue = parseString(
                parsedValue.trim().slice(1, parsedValue.trim().length - 1),
            );
        } else if (parsedValue.includes("#FUNCTION_START#")) {
            if (
                parsedValue
                    .replaceAll(/#FUNCTION_START#(.+?)#FUNCTION_END#/g, "")
                    .trim() !== ""
            ) {
                parsedValue = parseString(parsedValue);
            }
        } else {
            parsedValue = parseString(parsedValue);
        }
    }
    return parsedValue;
}

/**
 * Walks a `{...}` / `[...]` literal character by character, building a
 * {@link StringObject} tree of keys, values and nested literals.
 */
export function getObjectData(objectSource: string, currentObject: StringObject) {
    let i = 0,
        buffer = "";
    let arrayEnded = false;
    while (i < objectSource.length) {
        const char = objectSource[i];
        if (char === "{" || char === "[") {
            const newObj = new StringObject(char, currentObject);
            currentObject.addValue(`#StringObject_${newObj.name}#`);
            currentObject = newObj;
        } else if (char === "}" || char === "]") {
            if (char === "]") arrayEnded = true;
            currentObject.addEnd(char);
            if (buffer.trim() !== "") {
                currentObject.addValue(parseObjectValue(buffer));
                buffer = "";
            }
            currentObject.parent?.pushChild(currentObject);
            currentObject = <StringObject>currentObject.parent;
        } else if (char === ":") {
            currentObject.addKey(buffer.trim());
            buffer = "";
        } else if (char === ",") {
            if (arrayEnded) {
                i++;
                arrayEnded = false;
                continue;
            }
            currentObject.addValue(parseObjectValue(buffer));
            buffer = "";
        } else {
            buffer += char;
        }
        i++;
    }
    if (buffer.trim() !== "") {
        currentObject.addValue(parseObjectValue(buffer));
    }
    return currentObject;
}

/**
 * Parses a `{...}` / `[...]` literal from user code into a
 * {@link StringObject} tree.
 *
 * Quoted strings are masked first so the structural characters inside them
 * (`:`, `{`, `}`, `[`, `]`, `,`) are not mistaken for object syntax.
 */
export function parseStringObject(
    stringObject: string,
    currentObj: StringObject,
) {
    const quotes = stringObject.match(ObjectQuoteRegex);
    if (quotes) {
        quotes.forEach((quotedString) => {
            const escapedQuote = quotedString
                .replaceAll(":", "#OBJECT_SEPARATOR#")
                .replaceAll("{", "#OBJECT_STARTER#")
                .replaceAll("}", "#OBJECT_ENDER#")
                .replaceAll("[", "#ARRAY_STARTER#")
                .replaceAll("]", "#ARRAY_ENDER#")
                .replaceAll(",", "#ARRAY_SEPARATOR#");
            stringObject = stringObject.replace(quotedString, escapedQuote);
        });
    }
    return getObjectData(
        stringObject.slice(1, stringObject.length - 1),
        currentObj,
    );
}
