/**
 * The basic housekeeping logic for all objects.
 */
abstract class BaseObject {
    /**
     * All points defining the object.
     *
     * These are sorted from first-in to last-in.
     * @private
     */
    protected readonly points: Coordinates[] = [];

    /**
     * Adds a point to the object.
     *
     * @param point The point to add.
     */
    public addPoint(point: Coordinates): BaseObject {
        this.points.push(point);
        return this;
    }

    /**
     * This will attempt to call {@link render} if {@link shouldRender} returns true.
     */
    public tryRender(): boolean {
        if (this.shouldRender()) {
            this.render();
            return true;
        }

        return false;
    }

    /**
     * The final method to render the object.
     *
     * This will push the equation to the calculator's state.
     */
    public abstract render(): void;

    /**
     * A method to check if {@link render} should be called.
     *
     * This will be called whenever a user interaction is processed.
     */
    public abstract shouldRender(): boolean;

    /**
     * A method to destroy the object.
     *
     * This is optional to implement.
     */
    public destroy(): void {}
}

export default BaseObject;

/**
 * The types of objects supported by the grapher.
 */
export enum Objects {
    Line,
    Parabola,
    Ellipse
}