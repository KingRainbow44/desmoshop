import Logger from "@app/Logger.ts";
import { createRoot } from "react-dom/client";

import Settings from "@ui/Settings.tsx";
import Transaction from "@graphing/Transaction.ts";

type Point = Coordinates & {
    reference?: boolean | undefined;
};

class Desmos {
    private static container: HTMLDivElement | undefined = undefined;

    /**
     * Loads all elements needed for the Desmos library.
     */
    public static init(): void {
        Desmos.container = document.getElementById("graph-container") as HTMLDivElement;

        // Create settings window.
        const settingsWindow = document.createElement("div");
        settingsWindow.id = "settings-window";
        settingsWindow.style.display = "flex";
        settingsWindow.style.position = "absolute";
        settingsWindow.style.bottom = "16px";
        settingsWindow.style.right = "16px";
        settingsWindow.style.zIndex = "100";

        document.body.appendChild(settingsWindow);

        // Mount the settings window.
        const root = createRoot(settingsWindow);
        root.render(<Settings />);

        Logger.info("Loaded Desmos library.");
    }

    /**
     * Returns the container element for the Desmos graphing calculator UI.
     */
    public static getContainer(): HTMLDivElement {
        if (Desmos.container == undefined) {
            throw new Error("Desmos container is not initialized.");
        }

        return Desmos.container;
    }

    /**
     * Creates a state transaction.
     */
    public static transaction(): Transaction {
        return new Transaction(Calc.getState());
    }

    /**
     * Returns the index of the expression with the given ID.
     *
     * @param id The ID of the expression.
     */
    public static indexOf(id: string): number {
        return Calc.getState()
            .expressions
            .list
            .findIndex((expr) => expr.id == id);
    }

    /**
     * Creates a new point.
     */
    public static newPoint(point: Point): void {
        const { x, y } = point;

        Desmos.transaction()
            .expression((id) => ({
                type: "expression",
                latex: `(${x}, ${y})`,
                id
            }))
            .cond(
                point.reference == true,
                (t, id) => t.parent(id, "reference-points")
            )
            .commit();
    }

    /**
     * Creates a new folder.
     *
     * @param name The name of the folder.
     * @param id The ID of the folder.
     * @param settings Other settings for the folder.
     */
    public static newFolder(
        name: string,
        id: string,
        settings?: {
            collapsed?: boolean;
        }
    ): void {
        Calc.setExpression({
            type: "folder",
            title: name,
            id
        });

        // Check if the folder should be collapsed.
        if (settings?.collapsed) {
            Calc.controller.dispatcher.dispatch({
                type: "set-folder-collapsed",
                id,
                isCollapsed: true
            });
        }
    }
}

export default Desmos;