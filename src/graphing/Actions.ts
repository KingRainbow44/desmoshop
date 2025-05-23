import { EventEmitter } from "events";

import Desmos from "@graphing/Desmos.tsx";

import Line from "@graphing/objects/Line.ts";
import Circle from "@graphing/objects/Circle.ts";
import Parabola from "@graphing/objects/Parabola.ts";
import Restriction from "@graphing/operations/Restriction.ts";
import Exclusion from "@graphing/operations/Exclusion.ts";

import BaseObject, { Objects, Operations } from "@graphing/BaseObject.ts";
import Table from "@graphing/operations/Table.ts";
import SnapPoint from "@graphing/operations/SnapPoint.ts";
import Ellipse from "@graphing/objects/Ellipse.ts";

/**
 * The types of events to be emitted by the grapher.
 */
export enum Events {
    NewObject = "new-object",
    OperationCancelled = "operation-cancelled",
    OperationFinished = "operation-finished"
}

/**
 * Handles the underlying details behind graphing.
 */
class Actions {
    /**
     * The global emitter for the grapher instance.
     */
    public static readonly emitter = new EventEmitter();

    /**
     * The working object.
     *
     * This will be mutated as the user interacts with the grapher.
     * @private
     */
    private static working: BaseObject | undefined = undefined;

    /**
     * Checks if the grapher is currently working.
     */
    public static isWorking(): boolean {
        return Actions.working !== undefined;
    }

    /**
     * Uses the {@link tryRender} method to render the working object.
     */
    public static tryRender(): void {
        if (Actions.working?.tryRender()) {
            Actions.finish();
        }
    }

    /**
     * Adds a point to the working object.
     *
     * @param point The point to add.
     */
    public static addPoint(point: Coordinates): void {
        Actions.working?.addPoint(point);
    }

    /**
     * Resets the grapher.
     *
     * This includes:
     * - the currently selected option
     */
    public static reset(): void {
        // Clear the working object.
        Actions.working?.destroy();
        Actions.working = undefined;

        // Emit the event.
        Actions.emitter.emit(Events.OperationCancelled);
    }

    /**
     * Deletes all expressions currently selected.
     */
    public static delete(): void {
        for (const selected of Desmos.multiSelect) {
            if (selected.id) {
                Calc.removeExpression({ id: selected.id });
            }
        }

        Desmos.multiSelect.length = 0;
    }

    /**
     * Finishing the existing operation.
     */
    public static finish(): void {
        // Check if we are working.
        if (Actions.working === undefined) return;

        // Clear the working object.
        Actions.working.destroy();
        Actions.working = undefined;

        // Emit the event.
        Actions.emitter.emit(Events.OperationFinished);
    }

    /**
     * Creates all folders needed for Desmos.
     */
    public static folders(): void {
        Desmos.newFolder("Reference Points", "reference-points", { collapsed: true });
        Desmos.newFolder("Parabolas", "parabola", { collapsed: true });
        Desmos.newFolder("Circles", "circle", { collapsed: true });
        Desmos.newFolder("Ellipses", "ellipse", { collapsed: true });
        Desmos.newFolder("Hyperbolas", "hyperbola", { collapsed: true });
        Desmos.newFolder("Lines", "line", { collapsed: true });
    }

    /**
     * Initializes graphing a line.
     */
    public static line(): void {
        // Create a new line instance.
        Actions.working = new Line();

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newObject",
            object: Objects.Line,
            instance: Actions.working
        } as NewObject);
    }

    /**
     * Initializes graphing a circle.
     */
    public static circle(): void {
        // Create a new circle instance.
        Actions.working = new Circle();

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newObject",
            object: Objects.Circle,
            instance: Actions.working
        } as NewObject);
    }

    /**
     * Initializes graphing a parabola.
     */
    public static parabola(): void {
        // Create a new parabola instance.
        Actions.working = new Parabola();

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newObject",
            object: Objects.Parabola,
            instance: Actions.working
        } as NewObject);
    }

    /**
     * Initializes graphing an ellipse.
     */
    public static ellipse(): void {
        // Create a new ellipse instance.
        Actions.working = new Ellipse();

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newObject",
            object: Objects.Ellipse,
            instance: Actions.working
        } as NewObject);
    }

    /**
     * Adds a restriction to the working expression.
     */
    public static restriction(expression: Expression, y: boolean = true): void {
        // Create a new restriction.
        Actions.working = new Restriction(expression, y);

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newOperation",
            operation: Operations.Restriction,
            instance: Actions.working
        } as NewOperation);
    }

    /**
     * Adds an exclusion to the working expression.
     */
    public static exclusion(expression: Expression): void {
        // Create a new exclusion.
        Actions.working = new Exclusion(expression);

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newOperation",
            operation: Operations.Exclusion,
            instance: Actions.working
        } as NewOperation);
    }

    /**
     * Adds a table based on the points selected.
     */
    public static table(): void {
        // Create a new table instance.
        Actions.working = new Table();

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newObject",
            object: Objects.Table,
            instance: Actions.working
        } as NewObject);
    }

    /**
     * Adds a snap point to the working expression.
     */
    public static snapPoint(point: Coordinates): void {
        // Create a new snap point instance.
        Actions.working = new SnapPoint(point);

        // Emit the event.
        Actions.emitter.emit(Events.NewObject, {
            type: "newObject",
            object: Objects.Point,
            instance: Actions.working
        } as NewObject);
    }
}

export default Actions;

/**
 * An expression.
 */
export type Expression = ExpressionState & { type: "expression" };

/**
 * An event signifying the start of a new object.
 */
export type NewObject = {
    type: "newObject";
} & (
    NewLineObject | NewCircleObject | NewParabolaObject |
    NewEllipseObject | NewTableObject | NewPointObject
    );

/**
 * An event signifying the start of a new operation.
 */
export type NewOperation = {
    type: "newOperation";
} & (NewRestriction | NewExclusion);

/**
 * An event signifying the creation of a new line object.
 */
export type NewLineObject = {
    object: Objects.Line,
    instance: Line
};

/**
 * An event signifying the creation of a new circle object.
 */
export type NewCircleObject = {
    object: Objects.Circle,
    instance: Circle
};

/**
 * An event signifying the creation of a new parabola object.
 */
export type NewParabolaObject = {
    object: Objects.Parabola,
    instance: Parabola
};

/**
 * An event signifying the creation of a new ellipse object.
 */
export type NewEllipseObject = {
    object: Objects.Ellipse,
    instance: Ellipse
};

/**
 * An event signifying the creation of a new table object.
 */
export type NewTableObject = {
    object: Objects.Table,
    instance: Table
};

/**
 * An event signifying the creation of a new snap point object.
 */
export type NewPointObject = {
    object: Objects.Point,
    instance: SnapPoint
};

/**
 * An event signifying the creation of a new restriction.
 */
export type NewRestriction = {
    operation: Operations.Restriction,
    instance: Restriction
};

/**
 * An event signifying the creation of a new exclusion.
 */
export type NewExclusion = {
    operation: Operations.Exclusion,
    instance: Exclusion
};