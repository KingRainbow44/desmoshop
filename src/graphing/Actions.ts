import { EventEmitter } from "events";

import Desmos from "@graphing/Desmos.tsx";
import BaseObject, { Objects, Operations } from "@graphing/BaseObject.ts";
import Line from "@graphing/objects/Line.ts";
import Circle from "@graphing/objects/Circle.ts";
import Parabola from "@graphing/objects/Parabola.ts";
import Restriction from "@graphing/operations/Restriction.ts";
import Exclusion from "@graphing/operations/Exclusion.ts";

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
     * Finishing the existing operation.
     */
    private static finish(): void {
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
     * Adds a restriction to the working expression.
     */
    public static restriction(expression: Expression): void {
        // Create a new restriction.
        Actions.working = new Restriction(expression);

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
} & (NewLineObject | NewCircleObject | NewParabolaObject);

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
}