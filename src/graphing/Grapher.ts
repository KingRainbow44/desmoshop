import Desmos from "@app/Desmos.tsx";
import useGlobal from "@app/stores/Global.ts";

class Grapher {
    /**
     * Registers event listeners for the grapher.
     */
    public static init(): void {
        window.addEventListener("keydown", Grapher.onKeyDown, true);
        window.addEventListener("click", Grapher.onClick, true);

        // Add folders.
        Desmos.newFolder("Reference Points", "reference-points", { collapsed: true });
        Desmos.newFolder("Parabolas", "parabola", { collapsed: true });
        Desmos.newFolder("Circles", "circle", { collapsed: true });
        Desmos.newFolder("Ellipses", "ellipse", { collapsed: true });
        Desmos.newFolder("Hyperbolas", "hyperbola", { collapsed: true });
        Desmos.newFolder("Lines", "line", { collapsed: true });
    }

    /**
     * Checks to see if the working transaction is complete.
     * @private
     */
    private static checkTransaction(): void {
        const { working, workingType } = useGlobal.getState();
        if (!working || !workingType) return;

        switch (workingType) {
            case "line": {
                // Check if all points are defined.
                if (working.points.length < 2) return;

                // Create the line.
                working
                    .line("line")
                    .commit();

                return;
            }
            case "parabola": {
                // Check if all points are defined.

                // Create the parabola.
            }
        }
    }

    /**
     * Invoked when a key is pressed.
     *
     * @param event The event object.
     * @private
     */
    private static onKeyDown(event: KeyboardEvent): void {
        const state = useGlobal.getState();

        switch (event.code) {
            // Grid snap control.
            case "NumpadAdd": {
                if (state.gridSnap >= 8) break;
                useGlobal.setState((state) => ({
                    gridSnap: state.gridSnap + 1
                }));

                break;
            }
            case "NumpadSubtract": {
                if (state.gridSnap <= 0) break;
                useGlobal.setState((state) => ({
                    gridSnap: state.gridSnap - 1
                }));

                break;
            }

            // Shape types.
            case "Numpad1": {
                if (state.working) return;

                // Set the working type.
                state.t("line");
                break;
            }
            case "Numpad2": {
                if (state.working) return;

                // Set the working type.
                state.t("parabola");
                break;
            }

            // Fallthrough for default case.
            default: {
                return;
            }
        }

        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Invoked when the mouse is clicked.
     *
     * @param event The event object.
     * @private
     */
    private static onClick(event: MouseEvent): void {
        const { gridSnap, working } = useGlobal.getState();

        // Get the container and convert the pixel values to math values.
        const container = Desmos
            .getContainer()
            .getBoundingClientRect();
        const { x: xExact, y: yExact } = window.Calc.pixelsToMath({
            x: event.clientX - container.left,
            y: event.clientY - container.top
        });

        // Round the x and y values to the grid snap.
        const { x, y } = {
            x: parseFloat(xExact.toFixed(gridSnap)),
            y: parseFloat(yExact.toFixed(gridSnap))
        };

        // Check if the modifier key is being pressed.
        if (event.altKey) {
            // Create a point.
            Desmos.newPoint({
                x, y,
                reference: true
            });

            return;
        }

        // Otherwise, add the point to the transaction.
        if (working) {
            working.point(x, y);
            Grapher.checkTransaction();
        }
    }
}

export default Grapher;