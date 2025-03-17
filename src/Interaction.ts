import Actions from "@graphing/Actions.ts";
import Desmos from "@graphing/Desmos.tsx";
import useGlobal from "@stores/Global.ts";

type Handler = (event: KeyboardEvent) => void;
type Shortcuts = { [key: string]: Handler };

/**
 * Handlers to the keyboard shortcuts.
 *
 * Shortcuts require the 'Super' key to be pressed.
 */
const KEYBOARD_SHORTCUTS: Shortcuts = {
    "Digit1": Actions.line,
    "Digit2": Actions.circle,
    "Backquote": Actions.folders,

    // Inline keyboard shortcuts for changing the precision.
    "Minus": () => useGlobal.getState().changePrecision(-1),
    "Equal": () => useGlobal.getState().changePrecision(1)
};

/**
 * Handlers to the keyboard actions.
 *
 * Actions are direct inputs which are always captured.
 */
const KEYBOARD_ACTIONS: Shortcuts = {
    "Escape": Actions.reset,
    "Numpad1": Actions.line,
    "Numpad2": Actions.circle
};

/**
 * The 'graph' is responsible for turning user input into Desmos equations.
 */
class Interaction {
    /**
     * This is an array of pressed key codes.
     * @private
     */
    private static readonly pressed: Set<string> = new Set();

    /**
     * Registers listeners needed for handling user input.
     */
    public static init(): void {
        // Listen for user scrolling.
        window.addEventListener("wheel", Interaction.handleScroll, { passive: false });

        // Listen for user clicks.
        window.addEventListener("click", Interaction.handleClick, true);

        // Listen for user key presses.
        window.addEventListener("keydown", Interaction.handleKey);
        window.addEventListener("keydown", Interaction.storeKey);
        window.addEventListener("keyup", Interaction.forgetKey);
    }

    /**
     * Checks if the user is holding the 'Super' key.
     *
     * This refers to the key used for user interaction,
     * such as the 'Alt' key.
     *
     * This does not refer to the 'Cmd' or 'Win' key on the keyboard.
     *
     * @param event The mouse event.
     * @private
     */
    public static isHoldingSuper(event: KeyboardEvent | MouseEvent): boolean {
        return event.altKey || event.shiftKey;
    }

    /**
     * Checks if the equation modifier key is being held.
     */
    public static isHoldingModifier(): boolean {
        return Interaction.pressed.has("AltLeft");
    }

    /**
     * Checks if the specified keys are being pressed.
     *
     * All keys must be pressed to pass.
     *
     * @param test The keys to test.
     */
    public static keysDown(...test: string[]): boolean {
        return test.every((key) => Interaction.pressed.has(key));
    }

    /**
     * Handles user scroll behavior.
     *
     * @param event The scroll/wheel event.
     * @private
     */
    private static handleScroll(event: WheelEvent): void {
        // Check if the user is holding the 'Alt' key.
        if (!Interaction.isHoldingSuper(event)) return;

        // Prevent the default behavior.
        event.preventDefault();
        event.stopImmediatePropagation();

        // Change the precision.
        useGlobal.getState()
            .changePrecision(event.deltaY > 0 ? -1 : 1);
    }

    /**
     * Handles a user click.
     *
     * @param event The mouse event.
     * @private
     */
    private static handleClick(event: MouseEvent): void {
        // Check if we are operating within an action.
        const isAction = Actions.isWorking();

        // Resolve the clicked point.
        // If we are in an action, we should try looking at other points.
        const point = Desmos.resolvePoint(event, isAction);

        if (isAction) {
            // If we are working, invoke the 'addPoint' method.

            // Prevent the default behavior.
            event.preventDefault();
            event.stopImmediatePropagation();

            // Add the point.
            Actions.addPoint(point);
        } else {
            // Else, we should try adding a point to the graph.

            // If the user is not holding the 'Super' key, ignore the event.
            if (!Interaction.isHoldingSuper(event)) {
                return;
            }

            // Prevent the default behavior.
            event.preventDefault();
            event.stopImmediatePropagation();

            // Plot the point.
            Desmos.newPoint({ ...point, reference: true });
        }

        // Try running actions.
        Actions.tryRender();
    }

    /**
     * Handles user key presses.
     *
     * @param event The key event.
     * @private
     */
    private static handleKey(event: KeyboardEvent): void {
        // Retrieve the handler.
        const handler = Interaction.isHoldingSuper(event) ?
            KEYBOARD_SHORTCUTS[event.code] :
            KEYBOARD_ACTIONS[event.code];

        // If it exists, invoke it.
        if (handler) {
            handler(event);

            // Prevent the default behavior.
            event.preventDefault();
            event.stopPropagation();
        }
    }

    /**
     * Stores the key code for later use.
     *
     * @param event The key event.
     * @private
     */
    private static storeKey(event: KeyboardEvent): void {
        // Store the key code.
        Interaction.pressed.add(event.code);
    }

    /**
     * Forgets the key code.
     *
     * @param event The key event.
     * @private
     */
    private static forgetKey(event: KeyboardEvent): void {
        // Forget the key code.
        Interaction.pressed.delete(event.code);
    }
}

export default Interaction;