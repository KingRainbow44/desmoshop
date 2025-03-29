import Interaction from "@app/Interaction.ts";
import Desmos from "@graphing/Desmos.tsx";
import BaseObject from "@graphing/BaseObject.ts";
import useGlobal from "@stores/Global.ts";

/**
 * The color used for lines.
 */
const COLOR = "#000000";

/**
 * Defined in LaTeX as:
 * `y-{{Y_START}}={{SLOPE}}\\left(x-{{X_MIN}}\\right)\\left\\{{{X_MIN}}\\le x\\le{{X_MAX}}\\right\\}`
 */
class Line extends BaseObject {
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
            throw new Error("Not enough points to create a line.");
        }

        // Get the first and second points.
        const [first, second] = this.points;

        // Calculate the slope.
        // \frac{y_{2}-y_{1}}{x_{2}-x_{1}}
        const m = (
            (second.y - first.y) /
            (second.x - first.x)
        );
        const validSlope = !isNaN(m) && isFinite(m);

        // If the slope is undefined or infinite, use a horizontal line equation.
        const transaction = Desmos.transaction();
        if (!validSlope || Interaction.isHoldingModifier()) {
            // Determine the minimum and maximum 'y' values.
            const minY = Math.min(first.y, second.y);
            const maxY = Math.max(first.y, second.y);

            // graphed using x=x_{1}
            // restricted by minY <= y <= maxY
            transaction.expression(id => ({
                type: "expression", id,
                latex: `x=${first.x}\\left\\{${minY}\\le y\\le${maxY}\\right\\}`,
                color: COLOR
            }), "line");
        } else {
            // Determine the minimum and maximum 'x' values.
            const minX = Math.min(first.x, second.x);
            const maxX = Math.max(first.x, second.x);

            // Round the slope to the precision value.
            const { precision } = useGlobal.getState();
            const roundedSlope = m.toFixed(precision);

            // graphed using y-y_{1}=m\left(x-x_{1}\right)
            // restricted by minX <= x <= maxX
            transaction.expression(id => ({
                type: "expression", id,
                latex: `y-${first.y}=${roundedSlope}\\left(x-${first.x}\\right)\\left\\{${minX}\\le x\\le${maxX}\\right\\}`,
                color: COLOR
            }), "line");
        }

        // Push the state to the graph.
        transaction.commit();
    }
}

export default Line;