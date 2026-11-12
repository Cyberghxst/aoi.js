/**
 * Parses the ad-hoc format used by `.aoi` command files: a flat `key: value`
 * mapping where values are either plain text, `@{...}` string literals, or
 * nested `{...}` objects parsed recursively.
 */
export class JsonXYaml {
    obj: Record<string, unknown> = {};
    isInString = false;
    isObject = false;
    hasPotential = false;
    stringLiteralStarted = false;

    constructor(source: string) {
        source = source.trim();
        let buffer = "";
        let currentKey = "";
        for (const char of source) {
            if (char === ":" && !this.isInString && !this.isObject) {
                const key = buffer.trim();
                currentKey = key;
                buffer = "";
            } else if (
                char === "\n" &&
                !this.isInString &&
                !this.isObject &&
                buffer.trim() !== ""
            ) {
                const value = buffer.trim();
                this.obj[currentKey] = value;
                buffer = "";
                currentKey = "";
            } else if (char === "@" && !this.isInString) {
                this.hasPotential = true;
            } else if (char === "{" && this.hasPotential && !this.isInString) {
                this.isInString = true;
                this.stringLiteralStarted = true;
            } else if (char === "}" && this.isInString && this.hasPotential) {
                this.isInString = false;
                this.obj[currentKey] = `${buffer.trim()}`;
                buffer = "";
                this.stringLiteralStarted = false;
                this.hasPotential = false;
            } else if (char === "{" && !this.isInString && !this.hasPotential) {
                this.isObject = true;
                buffer += char;
            } else if (
                char === "}" &&
                !this.isInString &&
                !this.hasPotential &&
                this.isObject
            ) {
                this.isObject = false;
                buffer += char;
                this.obj[currentKey] = new JsonXYaml(
                    buffer
                        .trim()
                        .slice(1, buffer.length - 1)
                        .trim(),
                ).toObject();
                buffer = "";
                currentKey = "";
            } else {
                buffer += char;
                if (
                    this.hasPotential &&
                    char !== "{" &&
                    !this.stringLiteralStarted
                ) {
                    this.hasPotential = false;
                }
            }
        }
    }
    toObject() {
        return this.obj;
    }
}
