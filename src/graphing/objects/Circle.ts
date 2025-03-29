import Desmos from "@graphing/Desmos.tsx";
import BaseObject from "@graphing/BaseObject.ts";
import useGlobal from "@stores/Global.ts";

/**
 * The color used for circles.
 */
const COLOR = "#0000FF";

enum State {
    PLOT_CENTER,
    DEFINE_RADIUS,
    FINISHED
}

/**
 * Defined in LaTeX as:
 * `\left(x-{{X}}\right)^{2}+\left(y-{{Y}}\right)^{2}={{RADIUS}}`
 */
class Circle extends BaseObject {
    private state = State.PLOT_CENTER;

    /**
     * This value is used when working on the radius.
     * @private
     */
    private radius = 0;

    constructor() {
        super();

        // Add event listeners.
        window.addEventListener("mousemove", this.handleMouse.bind(this));
    }

    /**
     * Generates the LaTeX representation of the circle.
     * @private
     */
    private get latex(): string {
        if (this.points.length < 1) {
            throw new Error("Not enough points to create a circle.");
        }

        // Get the center point.
        const [first] = this.points;

        // Calculate the radius.
        const rad = Math.pow(this.radius, 2);

        const { precision } = useGlobal.getState();
        const radius = rad.toFixed(precision);

        return `\\left(x-${first.x}\\right)^{2}+\\left(y-${first.y}\\right)^{2}=${radius}`;
    }

    /**
     * Invoked when the user moves the mouse.
     *
     * @param event The mouse event.
     * @private
     */
    private handleMouse(event: MouseEvent): void {
        // We only handle mouse movement when the user is defining the radius.
        if (this.state != State.DEFINE_RADIUS) {
            return;
        }

        // Get the first point.
        const [first] = this.points;

        // Convert the mouse coordinates into graph coordinates.
        const cursor = Desmos.resolvePoint(event);

        // Set the radius.
        this.radius = Desmos.distance(first, cursor);

        // Finally, render the preview.
        this.renderPreview();
    }

    /**
     * @inheritDoc
     */
    public addPoint(point: Coordinates): BaseObject {
        // Update the state.
        switch (this.state) {
            case State.PLOT_CENTER: {
                // Plot the point temporarily.
                Calc.setExpression({
                    id: "circle-center",
                    type: "expression",
                    latex: `(${point.x},${point.y})`,
                    color: COLOR
                });

                this.state = State.DEFINE_RADIUS;
                break;
            }
            case State.DEFINE_RADIUS: {
                this.state = State.FINISHED;
                return this;
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
        if (this.points.length < 1) {
            throw new Error("Not enough points to create a circle.");
        }

        // Render the equation.
        Desmos.transaction()
            .expression(id => ({
                type: "expression", id,
                latex: this.latex,
                color: COLOR
            }), "circle")
            .commit();
    }

    /**
     * @inheritDoc
     */
    public renderPreview() {
        // Here, we use the raw Desmos API to insert equations.
        // This will update the equation if it already exists.
        // It also doesn't require a transaction.
        Calc.setExpression({
            id: "circle-preview",
            type: "expression",
            latex: this.latex,
            color: COLOR
        });
    }

    /**
     * @inheritDoc
     */
    public destroy() {
        // Remove the preview.
        Calc.removeExpressions([
            { id: "circle-preview" },
            { id: "circle-center" }
        ]);

        // Un-register the event listener.
        window.removeEventListener("mousemove", this.handleMouse.bind(this));

        // Set the state.
        this.state = State.FINISHED;
    }
}

export default Circle;