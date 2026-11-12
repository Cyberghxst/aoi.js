import Condition from "../structs/Condition.js";

/**
 * Splits a condition string into a tree of nested {@link Condition}s.
 *
 * Parentheses already consumed by a generated function call are masked first
 * (as `#SMOOTH_BRACKET_LEFT#` / `#SMOOTH_BRACKET_RIGHT#`) so the lexer only
 * splits on grouping parentheses that belong to the condition itself.
 */
export function conditionLexer(condition: string) {
    let conditionToLex;
    if (condition.includes("#FUNCTION_START#")) {
        const matches = condition.match(
            /((#FUNCTION_START#([$a-z.0-9\s?(){}[\]._:'"`;=><,!-]|\n)+#FUNCTION_END#)|(__\$[a-z_?.()]+\$__))/gim,
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
