import { inspect } from "util";
import { parseData } from "../../util/transpilerHelpers.js";
import { parseString } from "../parsers/stringParser.js";
import { BundlerCustoms, TranspilerCustoms } from "../../typings/enums.js";
/**
 * Comparison operators, longest first: `find` returns the first operator
 * contained in the condition, so `<=` must be checked before `<` (and
 * `>=` before `>`, `===` before `==`), otherwise `a<=b` is split as
 * `a < "=b"` and the right side is stringified.
 */
const operators = ["===", "!==", ">=", "<=", "==", "!=", ">", "<"];

/**
 * Whether a value is generated code wrapped in the transpiler's math
 * markers (`#MATH_FUNCTION_START#...#MATH_FUNCTION_END#`), e.g. the
 * `(2+2)` a `$sum` produced. Like a `#FUNCTION_START#`-wrapped value it
 * is code, not text, so the string quoting below must leave it alone.
 */
function isMathResult(value: string): boolean {
    const trimmed = value.trim();
    return (
        trimmed.startsWith(TranspilerCustoms.MFS) &&
        trimmed.endsWith(TranspilerCustoms.MFE)
    );
}

/**
 * A bare numeric expression like `2+1` or `(2*3)+4`: only digits, parens,
 * spaces, dots and math operators, with at least one digit and one
 * operator. Anything with letters is treated as text, so hyphenated
 * words (`hello-world`) keep the old behavior.
 */
function isNumericExpression(value: string): boolean {
    return (
        /[+\-*/%]/.test(value) &&
        /^[\d\s().+\-*/%]+$/.test(value) &&
        /\d/.test(value)
    );
}

/**
 * One node of a parsed condition (e.g. the inside of `$if[...]`).
 *
 * Nested parentheses become child conditions, which are solved first and
 * substituted back as `(#CONDITION#)` placeholders, so each comparison is
 * resolved against already-computed values. `&&` binds looser than `||`
 * here: a top-level `&&` splits first and each side is checked for `||`.
 */
export default class Condition {
    condition: string;
    nest: Condition[];
    parent: Condition | null;
    constructor(condition: string, parent?: Condition) {
        this.condition = condition;
        this.nest = [];
        this.parent = parent ?? null;
    }
    solve() {
        if (this.nest.length) {
            return this._solve(this.condition);
        } else return this.solveAnd(this.condition);
    }
    solveAnd(condition: string) {
        const conditions = condition.split("&&");
        const solvedConditions = [];
        for (const conditionPart of conditions) {
            if (condition.includes("||")) {
                solvedConditions.push(this.solveOr(conditionPart));
            } else {
                solvedConditions.push(this._solve(conditionPart));
            }
        }
        return solvedConditions.join("&&");
    }
    solveOr(condition: string) {
        const conditions = condition.split("||");
        const solvedConditions = [];
        for (const conditionPart of conditions) {
            solvedConditions.push(this._solve(conditionPart));
        }
        return solvedConditions.join("||");
    }
    _solve(condition: string): string {
        condition = condition
            .replaceAll("#SMOOTH_BRACKET_LEFT#", "(")
            .replaceAll("#SMOOTH_BRACKET_RIGHT#", ")");
        if (this.nest.length) {
            for (const nestedCondition of this.nest) {
                const solvedData = nestedCondition.solve();
                condition = condition.replace("#CONDITION#", `(${solvedData})`);
            }
            return condition;
        } else {
            const operator = operators.find((o) => condition.includes(o));
            let result;
            if (operator) {
                const [left, right] = condition.split(operator);
                let leftData, rightData;
                if (left.trim().split(" ").length === 1) {
                    leftData = parseData(left.trim());
                    if (typeof leftData === "object") {
                        try {
                            leftData = JSON.stringify(leftData);
                        } catch {
                            leftData = inspect(leftData);
                        }
                    } else if (typeof leftData === "string") {
                        if (
                            !((leftData.startsWith("#FUNCTION_START#") &&
                                leftData.endsWith("#FUNCTION_END#")) ||
                            leftData.startsWith("__$DISCORD_DATA$__") ||
                            leftData.trim() === BundlerCustoms.EJS ||
                            isMathResult(leftData))
                        ) {
                            leftData = parseString(leftData);
                            if (
                                typeof parseData(
                                    leftData.substring(1, leftData.length - 1),
                                ) !== "string"
                            ) {
                                leftData = parseData(
                                    leftData.substring(1, leftData.length - 1),
                                );
                            }
                        }
                    } else if (typeof leftData === "bigint") {
                        leftData = leftData.toString() + "n";
                    }
                } else {
                    // A math result with spaces inside (e.g. from `$math`)
                    // is code, not text: leave it alone.
                    leftData = isMathResult(left.trim())
                        ? left.trim()
                        : parseString(left.trim());
                }
                if (right.trim().split(" ").length === 1) {
                    rightData = parseData(right.trim());
                    if (typeof rightData === "object") {
                        try {
                            rightData = JSON.stringify(rightData);
                        } catch {
                            rightData = inspect(rightData);
                        }
                    } else if (typeof rightData === "string") {
                        if (
                            !((rightData.startsWith("#FUNCTION_START#") &&
                                rightData.endsWith("#FUNCTION_END#")) ||
                            (rightData.startsWith("__$") &&
                                rightData.includes("$__")) ||
                            rightData.startsWith("__$DISCORD_DATA$__") || rightData.trim() === BundlerCustoms.EJS ||
                            isMathResult(rightData))
                        ) {
                            rightData = parseString(rightData);
                            if (
                                typeof parseData(
                                    rightData.substring(
                                        1,
                                        rightData.length - 1,
                                    ),
                                ) !== "string"
                            ) {
                                rightData = parseData(
                                    rightData.substring(
                                        1,
                                        rightData.length - 1,
                                    ),
                                );
                            }
                        }
                    } else if (typeof rightData === "bigint") {
                        rightData = rightData.toString() + "n";
                    }
                    result = `${leftData}${operator}${rightData}`;
                } else {
                    // A math result with spaces inside (e.g. from `$math`)
                    // is code, not text: leave it alone.
                    rightData = isMathResult(right.trim())
                        ? right.trim()
                        : parseString(right.trim());
                    result = `${leftData}${operator}${rightData}`;
                }
            } else {
                result = parseData(condition);
                if (
                    typeof result === "string" &&
                    (!result.endsWith("#FUNCTION_END#") ||
                        result.trim().split(" ").length > 1) &&
                    !result.startsWith("#FUNCTION_START#") && result.trim() !== BundlerCustoms.EJS &&
                    !isMathResult(result) &&
                    !isNumericExpression(result)
                ) {
                    result = parseString(result);
                }
            }

            return result;
        }
    }
    add(part: string) {
        this.condition += part;
    }
}
