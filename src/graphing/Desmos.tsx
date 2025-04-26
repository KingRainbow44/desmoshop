import Logger from "@app/Logger.ts";

import Transaction, { Consumer } from "@graphing/Transaction.ts";
import useGlobal from "@stores/Global.ts";
import Utility from "@graphing/Utility.ts";

/**
 * This regular expression is used to match a point in LaTeX.
 */
const POINT_REGEX = /\((.*),(.*)\)/;

type Point = Coordinates & {
    reference?: boolean | undefined;
};

type CachedPoint = Coordinates & {
    id: string | undefined;
};

class Desmos {
    private static container: HTMLDivElement | undefined = undefined;

    /**
     * This is a cache of all known coordinates.
     * @private
     */
    public static pointCache: CachedPoint[] = [];

    /**
     * Loads all elements needed for the Desmos library.
     */
    public static init(): void {
        Desmos.container = document.getElementById("graph-container") as HTMLDivElement;

        // Create task to update points.
        setInterval(Desmos.checkSelected, 5e2);
        setInterval(Desmos.updatePoints, 1e3);

        setTimeout(Desmos.updatePoints, 1e3);
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
    public static transaction(consumer?: Consumer | undefined): Transaction {
        return new Transaction(Calc.getState(), consumer);
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

        Desmos.transaction((t) => {
            // Update the point cache.
            Desmos.pointCache.push({ x, y, id: t.lastId });
        })
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
     * Fetches an expression by its ID.
     *
     * @param id The ID of the expression.
     */
    public static getExpression(id: string): ExpressionState | undefined {
        return Calc.getState().expressions.list
            .filter((expr) => expr.type == "expression")
            .filter((expr) => expr.id == id)
            .pop();
    }

    /**
     * Checks the selected expression.
     */
    public static checkSelected(): void {
        const selectedId = Calc.selectedExpressionId;
        const selected = Desmos.getExpression(selectedId);

        if (selected) {
            Utility.moveExpression(selected);
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

                const point = Desmos.parsePoint(expr.latex);
                return { ...point, id: expr.id } as CachedPoint;
            })
            // Filter out undefined values.
            .filter((point) => point != undefined);
    }

    /**
     * Caches the point if it doesn't exist in the cache.
     *
     * @param point The point to cache.
     * @param id The ID of the point's expression.
     */
    public static cachePoint(point: Coordinates, id: string): void {
        // Check if the point is already in the cache.
        const cached = Desmos.pointCache
            .filter((p) => p.x == point.x && p.y == point.y)
            .pop();

        // If the point is not in the cache, add it.
        if (cached == undefined) {
            Desmos.pointCache.push({ ...point, id });
        }
    }

    /**
     * Returns the coordinates of the mouse event.
     *
     * @param event The mouse event.
     */
    public static mouseCoords(event: MouseEvent): Coordinates {
        // Get the graph container.
        const container = Desmos
            .getContainer()
            .getBoundingClientRect();

        // Convert the mouse coordinates into graph coordinates.
        return window.Calc.pixelsToMath({
            x: event.clientX - container.left,
            y: event.clientY - container.top
        });
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
     * @param maxDistance The maximum distance to consider.
     */
    public static resolvePoint(
        event: MouseEvent,
        others: boolean = true,
        maxDistance: number = -1
    ): CachedPoint {
        const { precision, pointSnap } = useGlobal.getState();

        // Get the cursor point.
        const cursor = Desmos.mouseCoords(event);

        if (others) {
            // Identify the closest point using the cache.
            const closest = Desmos
                .pointCache
                .filter((point) => Desmos.distance(point, cursor) <= pointSnap)
                .filter((point) => maxDistance == -1 || Desmos.distance(point, cursor) <= maxDistance)
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
            y: parseFloat(cursor.y.toFixed(precision)),
            id: undefined
        };
    }

    /**
     * Selects an expression.
     *
     * This considers if an expression is selected.
     * It will use the nearest point otherwise.
     *
     * If nothing is nearby, this will return undefined.
     *
     * @param event The mouse event.
     */
    public static selectElement(event: MouseEvent): ExpressionState | undefined {
        // Check if we have an expression selected.
        const expressionId = Calc.selectedExpressionId;
        const expression = Calc.getExpressions()
            .filter((expr) => expr.type == "expression")
            .filter((expr) => expr.id == expressionId)
            .pop();

        // If we have an expression, return it.
        if (expression != undefined) {
            return expression;
        }

        // Otherwise, resolve the point.
        const point = Desmos.resolvePoint(event);
        return Calc.getExpressions()
            .filter((expr) => expr.id == point.id)
            .pop();
    }

    /**
     * Parses a point in LaTeX into a {@link Coordinates} object.
     *
     * @param latex The LaTeX string to parse.
     */
    public static parsePoint(latex: string): Coordinates | undefined {
        // Test the string.
        if (!POINT_REGEX.test(latex)) {
            return undefined;
        }

        const [, x, y] = POINT_REGEX.exec(latex) as string[];
        return { x: parseFloat(x), y: parseFloat(y) };
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

    /**
     * Converts a value to a string with the given precision.
     *
     * @param value The value to convert.
     * @param precision The precision to use.
     */
    public static toPrecision(value: string | number, precision: number): string {
        let parsed: number;
        if (typeof value == "string") {
            // Check if the value is a number.
            parsed = parseFloat(value);
            if (isNaN(parsed)) {
                return value;
            }
        } else {
            parsed = value;
        }

        // Round the value.
        let rounded = parsed.toFixed(precision);

        // Drop trailing zeros.
        if (rounded.includes('.')) {
            rounded = rounded
                .replace(/0+$/, '')
                .replace(/\.$/, '');
        }

        return rounded;
    }
}

export default Desmos;