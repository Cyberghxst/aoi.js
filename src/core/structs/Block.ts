/**
 * One node of the template tree built by `createStringAST`.
 *
 * The root block renders as a `` `...` `` template literal, while nested
 * blocks render as `${...}` interpolations, so generated function calls end
 * up evaluated inside the final string instead of printed literally.
 */
export default class Block {
    position: number;
    isMain: boolean;
    parent?: Block;
    nest: Block[];
    text: string;
    constructor(position: number, isMain: boolean, parent?: Block) {
        this.position = position;
        this.isMain = isMain;
        this.parent = parent;
        this.nest = [];
        this.text = "";
    }
    add(text: string) {
        this.text += text;
    }
    addBlock(block: Block) {
        this.nest.push(block);
    }
    parse() {
        if (this.nest.length) {
            for (const childBlock of this.nest) {
                const parsedChild = childBlock.parse();
                this.text = this.text.replace(childBlock.parsed, parsedChild);
            }
        }
        return this.isMain ? `\`${this.text}\`` : `\${${this.text}}`;
    }
    get parsed() {
        return `#NEST_POSITION_${this.position}#`;
    }
}
