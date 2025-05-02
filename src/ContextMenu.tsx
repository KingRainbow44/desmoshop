import { createRoot } from "react-dom/client";
import { contextMenu, Item, ItemParams, Menu, Separator } from "react-contexify";

import Logger from "@app/Logger.ts";
import Desmos from "@graphing/Desmos.tsx";
import Actions from "@graphing/Actions.ts";
import Interaction from "@app/Interaction.ts";

class ContextMenu {
    /**
     * Prepares the context menu.
     */
    public static init(): void {
        // Create a context menu element.
        const menu = document.createElement("div");
        menu.id = "context-menu";
        menu.style.position = "absolute";
        menu.style.zIndex = "100";

        // Add the context menu to the body.
        document.body.appendChild(menu);

        // Mount the context menu.
        const root = createRoot(menu);
        root.render(<ItemContextMenu />);
    }

    /**
     * Mounts a context menu at the given point for the given expression.
     *
     * @param event The mouse event.
     * @param expr The expression state.
     */
    public static mountMenu(event: MouseEvent, expr: ExpressionState): void {
        // Move the context menu to the mouse position.
        const menu = document.getElementById("context-menu") as HTMLDivElement;
        menu.style.top = `${event.clientY}px`;
        menu.style.left = `${event.clientX}px`;

        // Show the context menu.
        contextMenu.show({ id: "context", event, props: { expr } });
    }
}

type ActionParams = ItemParams<{ expr: ExpressionState & { type: "expression"; } }>;

/**
 * The context menu component.
 */
function ItemContextMenu() {
    /**
     * Copies the LaTeX expression to the clipboard.
     *
     * @param props The item parameters.
     */
    async function copy({ props }: ActionParams) {
        if (!props) return;
        const { expr } = props;

        try {
            // Copy the LaTeX expression to the clipboard.
            await navigator.clipboard.writeText(expr.latex ?? "undefined");
        } catch (error) {
            Logger.error("Failed to copy the LaTeX expression to the clipboard.", error);
        }
    }

    /**
     * Creates a point at the point.
     * This only executes if the point is a point.
     *
     * @param props The item parameters.
     */
    function createPoint({ props }: ActionParams) {
        if (!props) return;
        const { expr } = props;

        const point = Desmos.parsePoint(expr.latex ?? "");
        if (point == undefined) return;

        // Create the point.
        Actions.snapPoint(point);
    }

    /**
     * Creates a parabola at the point.
     * This only executes if the point is a point.
     *
     * @param props The item parameters.
     */
    function createParabola({ props }: ActionParams) {
        if (!props) return;
        const { expr } = props;

        const point = Desmos.parsePoint(expr.latex ?? "");
        if (point == undefined) return;

        // Create the parabola.
        // We can use the manual method to create a parabola.
        Desmos.transaction()
            .expression(id => ({
                type: "expression", id,
                latex: `(x-${point.x})^2=4p(y-${point.y})`
            }), "parabola")
            .commit();
    }

    /**
     * Prepares to restrict an expression.
     *
     * @param props The item parameters.
     */
    function restrict({ props }: ActionParams) {
        if (!props) return;
        const { expr } = props;

        // Check if something is being worked on.
        if (Actions.isWorking()) {
            alert("You are currently working on something!");
            return;
        }

        // Create a new restriction object.
        const usingY = Interaction.isHoldingCtrl();
        Actions.restriction(expr, usingY);
    }

    /**
     * Prepares to exclude an expression.
     *
     * @param props The item parameters.
     */
    function exclude({ props }: ActionParams) {
        if (!props) return;
        const { expr } = props;

        // Check if something is being worked on.
        if (Actions.isWorking()) {
            alert("You are currently working on something!");
            return;
        }

        // Create a new exclusion object.
        Actions.exclusion(expr);
    }

    return (
        <Menu id={"context"}>
            <Item onClick={copy}>Copy</Item>
            <Item onClick={createPoint}>Snap From</Item>

            <Separator />

            <Item onClick={createParabola}>New Parabola</Item>
            <Item onClick={restrict}>Restrict</Item>
            <Item onClick={exclude}>Exclude ('x' only)</Item>
        </Menu>
    );
}

export default ContextMenu;