import Logger from "@app/Logger.ts";
import { createRoot } from "react-dom/client";

import Settings from "@ui/Settings.tsx";
import Transaction from "@graphing/Transaction.ts";
import useGlobal from "@stores/Global.ts";

/**
 * This regular expression is used to match a point in LaTeX.
 */
const POINT_REGEX = /\((.*),(.*)\)/;

type Point = Coordinates & {
    reference?: boolean | undefined;
};

class Desmos {
    private static container: HTMLDivElement | undefined = undefined;

    /**
     * This is a cache of all known coordinates.
     * @private
     */
    private static pointCache: Coordinates[] = [];

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

        // Create task to update points.
        setInterval(Desmos.updatePoints, 10e3);
        // Add function to fetch points.
        (window as any).getPoints = () => Desmos.pointCache;

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
                latex: `(${x},${y})`,
                id
            }))
            .cond(
                point.reference == true,
                (t, id) => t.parent(id, "reference-points")
            )
            .commit();

        // Update the point cache.
        Desmos.pointCache.push({ x, y });
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

    /**
     * Checks the state of points.
     */
    public static updatePoints(): void {
        // Update the point cache.
        Desmos.pointCache = Calc.getState()
            .expressions.list
            // Filter by points.
            .filter((expr) =>
                expr.type == "expression" &&
                expr.latex != undefined &&
                POINT_REGEX.test(expr.latex)
            )
            // Convert to coordinates.
            .map((expr) => {
                if (expr.type != "expression" || !expr.latex) {
                    return undefined;
                }

                const [, x, y] = POINT_REGEX.exec(expr.latex) as string[];
                return { x: parseFloat(x), y: parseFloat(y) } as Coordinates;
            })
            // Filter out undefined values.
            .filter((point) => point != undefined);
    }

    /**
     * Resolves the point from the given event.
     *
     * If the mouse click was close enough to an existing point,
     * the value of that point will be returned.
     *
     * Otherwise, this returns the value of {@link pixelsToMath}.
     * This value will be rounded to the user's chosen precision.
     *
     * @param event The mouse event.
     * @param others Should other points be considered?
     */
    public static resolvePoint(event: MouseEvent, others: boolean = true): Coordinates {
        const { precision, pointSnap } = useGlobal.getState();

        // Get the graph container.
        const container = Desmos
            .getContainer()
            .getBoundingClientRect();

        // Convert the mouse coordinates into graph coordinates.
        const cursor = window.Calc.pixelsToMath({
            x: event.clientX - container.left,
            y: event.clientY - container.top
        });

        if (others) {
            // Identify the closest point using the cache.
            const closest = Desmos
                .pointCache
                .filter((point) => Desmos.distance(point, cursor) <= pointSnap)
                .sort((a, b) => Desmos.distance(a, cursor) - Desmos.distance(b, cursor))
                .shift();

            // If there is a point, return it.
            if (closest) {
                return closest;
            }
        }

        // Otherwise, round the clicked point to the grid.
        return {
            x: parseFloat(cursor.x.toFixed(precision)),
            y: parseFloat(cursor.y.toFixed(precision))
        };
    }

    /**
     * Returns the cartesian distance between two points.
     *
     * @param a The first point.
     * @param b The second point.
     */
    public static distance(a: Coordinates, b: Coordinates): number {
        return Math.sqrt(
            Math.pow(a.x - b.x, 2) +
            Math.pow(a.y - b.y, 2)
        );
    }
}

export default Desmos;