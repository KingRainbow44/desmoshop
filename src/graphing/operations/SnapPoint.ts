import BaseObject from "@graphing/BaseObject.ts";
import Desmos from "@graphing/Desmos.tsx";
import useGlobal from "@stores/Global.ts";
import Interaction from "@app/Interaction.ts";
import Actions from "@graphing/Actions.ts";

/**
 * The color used for points.
 */
const COLOR = "#c74440";

enum Axis {
    Horizontal = "X",
    Vertical = "Y",
    Diagonal = "XY"
}

// TODO: Hold super to lock axis selected.

/**
 * Defined in LaTeX as:
 * ([X], [Y])
 */
class SnapPoint extends BaseObject {
    /**
     * This is the axis to move on.
     * @private
     */
    private axis: Axis = Axis.Vertical;

    /**
     * This is the distance to translate the new point.
     * The original point is used.
     *
     * @private
     */
    private distance: number = 0;

    private _handleMouse = this.handleMouse.bind(this);
    private _handleClick = this.handleClick.bind(this);

    /**
     * Creates a new point object.
     *
     * This point snaps to the reference point.
     */
    constructor(
        private readonly ref: Coordinates
    ) {
        super();

        // Add event listeners.
        window.addEventListener("mousemove", this._handleMouse);
        window.addEventListener("mouseup", this._handleClick);
    }

    /**
     * Generates the LaTeX representation of the point.
     * @private
     */
    private get latex(): string {
        let { x, y } = this.ref;

        switch (this.axis) {
            case Axis.Horizontal: {
                // Translate on the 'X' axis.
                x += this.distance;
                break;
            }
            case Axis.Vertical: {
                // Translate on the 'Y' axis.
                y += this.distance;
                break;
            }
            case Axis.Diagonal: {
                // Translate on both axes.
                x += this.distance;
                y += this.distance;
                break;
            }
        }

        // Format the coordinates.
        const { precision } = useGlobal.getState();
        const xStr = Desmos.toPrecision(x, precision);
        const yStr = Desmos.toPrecision(y, precision);

        // Return the LaTeX representation.
        return `(${xStr}, ${yStr})`;
    }

    /**
     * Invoked when the user moves the mouse.
     *
     * @param event The mouse event.
     * @private
     */
    private handleMouse(event: MouseEvent): void {
        // Get the cursor position.
        const resolveOthers = !Interaction.isHoldingShift();
        const cursor = Desmos.resolvePoint(event, resolveOthers);

        // Get the distance from the reference point.
        const rawXDistance = cursor.x - this.ref.x;
        const rawYDistance = cursor.y - this.ref.y;

        const xDistance = Math.abs(rawXDistance);
        const yDistance = Math.abs(rawYDistance);

        if (xDistance > yDistance) {
            this.axis = Axis.Horizontal;
            this.distance = rawXDistance;
        } else {
            this.axis = Axis.Vertical;
            this.distance = rawYDistance;
        }

        // Render the preview.
        this.renderPreview();
    }

    /**
     * Invoked when the user clicks the mouse.
     *
     * @param event The mouse event.
     * @private
     */
    private handleClick(event: MouseEvent): void {
        // Ensure the click was a left-click.
        if (event.button != 0) {
            return;
        }

        // Render the point.
        this.render();

        // Finish the operation.
        Actions.finish();
    }

    /**
     * Adds a point to the graph.
     *
     * @param _ The point to add. Un-used for this.
     */
    public addPoint(_: Coordinates): BaseObject {
        // We handle all the point logic.
        return this;
    }

    /**
     * @inheritDoc
     */
    public shouldRender(): boolean {
        return false;
    }

    /**
     * @inheritDoc
     */
    public render(): void {
        Desmos.transaction()
            .expression((id) => ({
                type: "expression", id,
                latex: this.latex,
                color: COLOR
            }), "reference-points")
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
            id: "point-preview",
            type: "expression",
            latex: this.latex,
            color: COLOR
        });
    }

    /**
     * @inheritDoc
     */
    public destroy(): void {
        // Remove the preview.
        Calc.removeExpression({ id: "point-preview" });

        // Remove the event listeners.
        window.removeEventListener("mousemove", this._handleMouse);
        window.removeEventListener("mouseup", this._handleClick);
    }
}

export default SnapPoint;