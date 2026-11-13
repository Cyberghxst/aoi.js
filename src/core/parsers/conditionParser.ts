import Condition from "../structs/Condition.js";
import { TranspilerCustoms } from "../../typings/enums.js";

/**
 * Splits a condition string into a tree of nested {@link Condition}s.
 *
 * Parentheses already consumed by a generated function call or a math
 * result are masked first (as `#SMOOTH_BRACKET_LEFT#` /
 * `#SMOOTH_BRACKET_RIGHT#`) so the lexer only splits on grouping
 * parentheses that belong to the condition itself. Math results need the
 * same treatment as function calls: without it, the parentheses of
 * `(2+2)` inside `#MATH_FUNCTION_START#...#MATH_FUNCTION_END#` would be
 * read as a nested condition and the math solved as a string literal.
 */
export function conditionLexer(condition: string) {
    let conditionToLex;
    if (
        condition.includes("#FUNCTION_START#") ||
        condition.includes(TranspilerCustoms.MFS)
    ) {
        const matches = condition.match(
            /((#FUNCTION_START#([$a-z.0-9\s?(){}[\]._:'"`;=><,!-]|\n)+#FUNCTION_END#)|(#MATH_FUNCTION_START#[\s\S]+?#MATH_FUNCTION_END#)|(__\$[a-z_?.()]+\$__))/gim,
        );
        if (matches) {
            for (const match of matches) {
                const sanitizedMatch = match
                    .replaceAll("(", "#SMOOTH_BRACKET_LEFT#")
                    .replaceAll(")", "#SMOOTH_BRACKET_RIGHT#");
                condition = condition.replace(match, sanitizedMatch);
            }
            conditionToLex = condition;
        }
        conditionToLex = condition;
    } else {
        conditionToLex = condition;
    }
    let i = 0;
    let currentCondition = new Condition("");
    while (i < conditionToLex.length) {
        if (conditionToLex[i] === "(") {
            const nestedCondition = new Condition("", currentCondition);
            currentCondition.add("#CONDITION#");
            currentCondition.nest.push(nestedCondition);
            currentCondition = nestedCondition;
        } else if (conditionToLex[i] === ")") {
            if (currentCondition.parent) currentCondition = currentCondition.parent;
            else break;
        } else {
            currentCondition.add(conditionToLex[i]);
        }
        i++;
    }
    return currentCondition;
}
