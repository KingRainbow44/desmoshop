import BaseObject from "@graphing/BaseObject.ts";
import Desmos from "@graphing/Desmos.tsx";
import Actions from "@graphing/Actions.ts";

/**
 * A table does not have a LaTeX representation.
 *
 * It is represented as a JSON object.
 */
class Table extends BaseObject {
    private canRender: boolean = false;

    constructor() {
        super();

        window.addEventListener("keydown", this.onKeyPress.bind(this));
    }

    /**
     * Invoked when a key is pressed.
     *
     * @param event The key press event.
     * @private
     */
    private onKeyPress(event: KeyboardEvent): void {
        // If no points are defined, do not render.
        if (this.points.length === 0) {
            return;
        }

        if (event.key === "Enter") {
            this.canRender = true;

            Actions.tryRender();
        }
    }

    /**
     * @inheritDoc
     */
    public shouldRender(): boolean {
        return this.canRender;
    }

    /**
     * @inheritDoc
     */
    public render(): void {
        const t= Desmos.transaction();

        // Create the table.
        t.expression(id => ({
            type: "table", id,
            columns: [
                {
                    hidden: true,
                    id: t.nextId,
                    latex: "x_{1}",
                    values: this.points.map(p => p.x.toString())
                },
                {
                    hidden: true,
                    id: t.nextId,
                    latex: "y_{1}",
                    values: this.points.map(p => p.y.toString())
                }
            ]
        }));

        t.commit();
    }

    /**
     * @inheritDoc
     */
    public destroy(): void {
        window.removeEventListener("keydown", this.onKeyPress);
    }
}

export default Table;