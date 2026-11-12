import { BundlerCustoms, TranspilerCustoms } from "../../typings/enums.js";
import Block from "../structs/Block.js";

/**
 * Builds a nesting tree of {@link Block}s from raw text.
 *
 * `#FUNCTION_START#` / `#FUNCTION_END#` (and the math equivalents) delimit
 * generated code that must become a `${...}` interpolation inside the final
 * template literal, so each marker pair opens a nested block instead of
 * being left as plain text.
 */
export function createStringAST(text: string) {
    let block = new Block(-1, true);
    let i = 0;
    let buffer = "";
    i = 0;
    buffer = "";
    while (i <= text.length) {
        if (buffer.includes("#FUNCTION_START#")) {
            const nest = new Block(block.nest.length, false, block);
            block.text = block.text.replace("#FUNCTION_START#", "");
            block.add(`#NEST_POSITION_${block.nest.length}#`);
            block.addBlock(nest);
            block = nest;
            block.add(text[i]);
            buffer = text[i] ?? "";
        } else if (buffer.includes("#FUNCTION_END#")) {
            block.text = block.text.replace("#FUNCTION_END#", "");
            block = block.parent ? block.parent : block;
            block.add(text[i] ?? "");
            buffer = text[i] ?? "";
        } else if (buffer.includes(TranspilerCustoms.MFS)) {
            const nest = new Block(block.nest.length, false, block);
            block.text = block.text.replace(TranspilerCustoms.MFS, "");
            block.add(`#NEST_POSITION_${block.nest.length}#`);
            block.addBlock(nest);
            block = nest;
            block.add(text[i]);
            buffer = text[i] ?? "";
        } else if (buffer.includes(TranspilerCustoms.MFE)) {
            block.text = block.text.replace(TranspilerCustoms.MFE, "");
            block = block.parent ? block.parent : block;
            block.add(text[i] ?? "");
            buffer = text[i] ?? "";
        } else {
            buffer += text[i];
            block.add(text[i] ?? "");
        }
        i++;
    }
    return block;
}

/**
 * Parses raw text into a JavaScript template literal, nesting generated
 * function calls as `${...}` interpolations.
 */
export function parseString(text: string) {
    const ast = createStringAST(text);
    return ast.parse().replaceAll(BundlerCustoms.EJS, `\${${BundlerCustoms.EJS}}`);
}
