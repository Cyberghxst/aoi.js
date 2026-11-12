/**
 * A parsed `{...}` / `[...]` literal found inside user code, kept as a tree
 * of keys, values and nested objects so each part can be resolved (strings
 * parsed, functions executed) before the literal is reassembled.
 */
export default class StringObject {
    parent: StringObject | undefined;
    children: StringObject[];
    start: "{" | "[";
    end?: "}" | "]";
    keys: string[];
    values: string[];
    name: number;
    constructor(start: "{" | "[", parent?: StringObject) {
        this.parent = parent;
        this.name = Math.random() * 999999;
        this.keys = [];
        this.values = [];
        this.start = start;
        this.end = undefined;
        this.children = [];
    }
    addKey(text: string) {
        this.keys.push(text);
    }
    addValue(text: string) {
        this.values.push(text);
    }
    addEnd(text: "}" | "]") {
        this.end = text;
    }
    pushChild(child: StringObject) {
        this.children.push(child);
    }
    solve() {
        if (this.children) {
            this.children.forEach((child) => {
                const result = child.solve();
                const index = this.values.indexOf(`#StringObject_${child.name}#`);
                const keyIndex = this.keys.indexOf(`#StringObject_${child.name}#`);
                this.keys[keyIndex] = result;
                this.values[index] = result;
            });
            const keys = this.keys;
            const values = this.values;
            let i = 0;
            let text = "";
            if (this.start === "[") {
                text = values.join(",");
                return `${this.start}${text}${this.end}`;
            }
            while (i < keys.length) {
                text += `${keys[i]} : ${values[i]},`;
                i++;
            }
            text = text.slice(0, text.length - 1);
            return `${this.start}${text}${this.end}`;
        } else {
            const keys = this.keys;
            const values = this.values;
            let i = 0;
            let text = "";
            if (this.start === "[") {
                text = values.join(",");
                return `${this.start}${text}${this.end}`;
            }
            while (i < keys.length) {
                text += `${keys[i]} : ${values[i]},`;
                i++;
            }
            text = text.slice(0, text.length - 1);
            return `${this.start}${text}${this.end}`;
        }
    }
}
