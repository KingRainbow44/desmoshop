import { EventEmitter } from "events";

import Desmos from "@graphing/Desmos.tsx";
import BaseObject, { Objects } from "@graphing/objects/BaseObject.ts";
import Line from "@graphing/objects/Line.ts";
import Circle from "@graphing/objects/Circle.ts";

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
            object: Objects.Circle,
            instance: Actions.working
        } as NewObject);
    }
}

export default Actions;

/**
 * An event signifying the start of a new object.
 */
export type NewObject = {
    type: "newObject";
} & (NewLineObject | NewCircleObject);

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