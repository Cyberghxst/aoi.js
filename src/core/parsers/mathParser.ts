const mathFunctionRegex =
    /#MATH_FUNCTION_START#[#$._0-9a-\s*+-/%^&|?()]*#MATH_FUNCTION_END#/gi;

/**
 * Turns `#MATH_FUNCTION_START#...#MATH_FUNCTION_END#` markers back into
 * `${...}` interpolations so math expressions are evaluated when the
 * generated code runs, instead of being sent as plain text.
 */
export default function fixMath(code: string) {
    const matches = code.match(mathFunctionRegex);
    if (!matches) return code;
    let result = code;
    matches.forEach((match) => {
        result = result.replace(
            match,
            "${" +
                match
                    .replaceAll("#MATH_FUNCTION_END#", "")
                    .replaceAll("#MATH_FUNCTION_START#", "") +
                "}",
        );
    });
    return result;
}
