import Desmos from "@graphing/Desmos.tsx";
import BaseObject from "@graphing/BaseObject.ts";
import useGlobal from "@stores/Global.ts";

/**
 * The color used for parabolas.
 */
const COLOR = "#";

enum State {
    PLOT_VERTEX,
    DEFINE_SLOPE,
    FINISHED
}

/**
 * Defined in LaTeX as:
 * `\left(x-h\right)^{2}=4p\left(y-k\right)`
 */
class Parabola extends BaseObject {
    private state = State.PLOT_VERTEX;

    constructor() {
        super();

        // Add event listeners.
        window.addEventListener("mousemove", this.handleMouse.bind(this));
    }

    /**
     * Generates the LaTeX representation of the parabola.
     * @private
     */
    private latex(other?: Coordinates | undefined): string {
        if (this.points.length < 1) {
            throw new Error("Not enough points to create a circle.");
        }

        // Get the first and second points.
        const [first] = this.points;

        // If the second point is defined, use it.
        if (other == undefined) {
            if (this.points.length < 2) {
                throw new Error("Not enough points to create a circle.");
            }

            other = this.points[1];
        }

        // Equations:
        // (x1 - h)^2 = 4p(y1 - k)
        // (x2 - h)^2 = 4p(y2 - k)

        // Substitute p = 1
        // (x1 - h)^2 = 4(y1 - k)
        // (x2 - h)^2 = 4(y2 - k)

        // Subtract the two equations
        // (x1 - h)^2 - (x2 - h)^2 = 4(y1 - k) - 4(y2 - k)
        // (x1^2 - 2x1h + h^2) - (x2^2 - 2x2h + h^2) = 4y1 - 4k - 4y2 + 4k
        // x1^2 - 2x1h - x2^2 + 2x2h = 4y1 - 4y2
        // 2h(x2 - x1) = x2^2 - x1^2 + 4y1 - 4y2
        // h = (x2^2 - x1^2 + 4y1 - 4y2) / (2(x2 - x1))

        // Calculate the slope.
        const h = -(
            (
                (other.x ** 2) - (first.x ** 2) + (4 * first.y) - (4 * other.y)
            ) / (
                2 * (other.x - first.x)
            )
        );

        // Round the slope to the precision value.
        const { precision } = useGlobal.getState();
        const roundedSlope = h.toFixed(precision);

        return `(x-${first.x})^2=${roundedSlope}(y-${first.y})\\left\\{${first.x}\\le x\\le${other.x}\\right\\}`;
    }

    /**
     * Invoked when the user moves the mouse.
     *
     * @param event The mouse event.
     * @private
     */
    private handleMouse(event: MouseEvent): void {
        // If we do not have a point defined, return.
        if (this.state != State.DEFINE_SLOPE) {
            return;
        }

        // Convert the mouse coordinates into graph coordinates.
        const cursor = Desmos.resolvePoint(event);

        Calc.setExpression({
            id: "parabola-preview",
            type: "expression",
            latex: this.latex(cursor),
            color: COLOR
        });
    }

    /**
     * @inheritDoc
     */
    public addPoint(point: Coordinates): BaseObject {
        // Update the state.
        switch (this.state) {
            case State.PLOT_VERTEX: {
                // Plot the point temporarily.
                Calc.setExpression({
                    id: "parabola-vertex",
                    type: "expression",
                    latex: `(${point.x},${point.y})`,
                    color: COLOR
                });

                this.state = State.DEFINE_SLOPE;
                break;
            }
            case State.DEFINE_SLOPE: {
                this.state = State.FINISHED;
                break;
            }
        }

        return super.addPoint(point);
    }

    /**
     * @inheritDoc
     */
    public shouldRender(): boolean {
        return this.state == State.FINISHED;
    }

    /**
     * @inheritDoc
     */
    public render(): void {
        // Check if enough points are defined.
        if (this.points.length < 2) {
            throw new Error("Not enough points to create a parabola.");
        }

        // Graph the parabola.
        Desmos.transaction()
            .expression(id => ({
                type: "expression", id,
                latex: this.latex(),
                color: COLOR
            }), "parabola")
            .commit();
    }

    /**
     * @inheritDoc
     */
    public destroy(): void {
        // Remove the preview.
        Calc.removeExpressions([
            { id: "parabola-vertex" },
            { id: "parabola-preview" }
        ]);

        // Un-register the event listener.
        window.removeEventListener("mousemove", this.handleMouse.bind(this));

        // Set the state.
        this.state = State.FINISHED;
    }
}

export default Parabola;