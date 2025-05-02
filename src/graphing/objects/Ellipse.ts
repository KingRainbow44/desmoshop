import BaseObject from "@graphing/BaseObject.ts";
import useGlobal from "@stores/Global.ts";
import Interaction from "@app/Interaction.ts";
import Desmos from "@graphing/Desmos.tsx";

/**
 * THe color used for ellipses.
 */
const COLOR = "#388c46";

enum State {
    PLOT_CENTER,
    DEFINE_HORIZONTAL,
    DEFINE_VERTICAL,
    FINISHED
}

/**
 * Defined in LaTeX as:
 * \frac{\left(x-h\right)^{2}}{a^{2}}+\frac{\left(y-k\right)^{2}}{b^{2}}=1
 */
class Ellipse extends BaseObject {
    private state = State.PLOT_CENTER;

    /**
     * This value is used for the horizontal radius.
     * @private
     */
    private xRadius = 0.1;

    /**
     * This value is used for the vertical radius.
     * @private
     */
    private yRadius = 0.1;

    /**
     * Event handler for mouse events.
     * @private
     */
    private readonly _handleMouse = this.handleMouse.bind(this);

    constructor() {
        super();

        // Add event listeners.
        window.addEventListener("mousemove", this._handleMouse);
    }

    /**
     * Generates the LaTeX representation of the ellipse.
     * @private
     */
    private get latex(): string {
        if (this.points.length < 1) {
            throw new Error("Not enough points to create an ellipse.");
        }

        // Get the center point.
        const [first] = this.points;

        const { precision } = useGlobal.getState();

        const xRad = this.xRadius.toFixed(precision);
        const yRad = this.yRadius.toFixed(precision);

        return `\\frac{\\left(x-${first.x}\\right)^{2}}{${xRad}^{2}}+\\frac{\\left(y-${first.y}\\right)^{2}}{${yRad}^{2}}=1`;
    }

    /**
     * Invoked when the user moves the mouse.
     *
     * @param event The mouse event.
     * @private
     */
    private handleMouse(event: MouseEvent): void {
        // We only handle mouse movement when the user is defining the radius.
        if (this.state != State.DEFINE_VERTICAL && this.state != State.DEFINE_HORIZONTAL) {
            return;
        }

        // Get the center point.
        const [first] = this.points;

        // Convert the mouse coordinates into graph coordinates.
        const others = !Interaction.isHoldingShift();
        const cursor = Desmos.resolvePoint(event, others);

        // Set the correct radius.
        switch (this.state) {
            case State.DEFINE_HORIZONTAL: {
                // Set the horizontal radius.
                this.xRadius = Desmos.distance(first, cursor);
                break;
            }
            case State.DEFINE_VERTICAL: {
                // Set the vertical radius.
                this.yRadius = Desmos.distance(first, cursor);
                break;
            }
        }

        // Finally, render the preview.
        this.renderPreview();
    }

    /**
     * @inheritDoc
     */
    public addPoint(point: Coordinates): BaseObject {
        switch (this.state) {
            case State.PLOT_CENTER: {
                // Plot the temporary point.
                Calc.setExpression({
                    id: "ellipse-center",
                    type: "expression",
                    latex: `(${point.x}, ${point.y})`,
                    color: COLOR
                });

                this.state = State.DEFINE_HORIZONTAL;
                break;
            }
            case State.DEFINE_HORIZONTAL: {
                this.state = State.DEFINE_VERTICAL;
                return this;
            }
            case State.DEFINE_VERTICAL: {
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
            throw new Error("Not enough points to create an ellipse.");
        }

        // Render the equation.
        Desmos.transaction()
            .expression(id => ({
                type: "expression", id,
                latex: this.latex,
                color: COLOR
            }), "ellipse")
            .commit();
    }

    /**
     * @inheritDoc
     */
    public renderPreview(): void {
        // Here, we use the raw Desmos API to insert equations.
        // This will update the equation if it already exists.
        // It also doesn't require a transaction.
        Calc.setExpression({
            id: "ellipse-preview",
            type: "expression",
            latex: this.latex,
            color: COLOR
        });
    }

    /**
     * @inheritDoc
     */
    public destroy(): void {
        // Remove the previews.
        Calc.removeExpressions([
            { id: "ellipse-preview" },
            { id: "ellipse-center" }
        ]);

        // Unregister the event listeners.
        window.removeEventListener("mousemove", this._handleMouse);

        // Set the state.
        this.state = State.FINISHED;
    }
}

export default Ellipse;