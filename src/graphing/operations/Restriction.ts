import BaseObject from "@graphing/BaseObject.ts";

/**
 * Defined in LaTeX as:
 * \left\{[START]\le x\le[END]\right\}
 */
class Restriction extends BaseObject {
    /**
     * Creates a new restriction object.
     *
     * @param working This is the expression which will be directly modified.
     */
    constructor(
        private readonly working: ExpressionState & { type: "expression" }
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

        // Determine the minimum and maximum 'x' values.
        const minX = Math.min(first.x, second.x);
        const maxX = Math.max(first.x, second.x);

        // Create the restriction.
        const restriction = `\\left\\{${minX}\\le x\\le${maxX}\\right\\}`;

        // Update the working expression.
        Calc.setExpression({
            ...this.working,
            latex: this.working.latex + restriction
        });
    }
}

export default Restriction;