import BaseObject from "@graphing/BaseObject.ts";

/**
 * Defined in LaTeX as:
 * \left\{[START]\le x\le[END]\right\}
 * or
 * \left\{[START]\le y\le[END]\right\}
 */
class Restriction extends BaseObject {
    /**
     * Creates a new restriction object.
     *
     * @param working This is the expression which will be directly modified.
     * @param usingY Whether to use 'y' or 'x' in the restriction.
     */
    constructor(
        private readonly working: ExpressionState & { type: "expression" },
        private readonly usingY: boolean = false
    ) {
        super();
    }

    /**
     * @inheritDoc
     */
    public shouldRender(): boolean {
        return this.points.length >= 2;
    }

    /**
     * @inheritDoc
     */
    public render(): void {
        // Check if enough points are defined.
        if (this.points.length < 2) {
            throw new Error("Not enough points to create a restriction.");
        }

        // Get the first and second points.
        const [first, second] = this.points;

        // Determine the minimum and maximum 'x' or 'y' values.
        let min: number, max: number;
        if (!this.usingY) {
            min = Math.min(first.x, second.x);
            max = Math.max(first.x, second.x);
        } else {
            min = Math.min(first.y, second.y);
            max = Math.max(first.y, second.y);
        }

        // Create the restriction.
        const restriction = `\\left\\{${min}\\le ${this.usingY ? "y" : "x"}\\le${max}\\right\\}`;

        // Update the working expression.
        Calc.setExpression({
            ...this.working,
            latex: this.working.latex + restriction
        });
    }
}

export default Restriction;