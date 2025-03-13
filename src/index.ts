import Logger from "@app/Logger.ts";
import Desmos from "@app/Desmos.tsx";
import Grapher from "@graphing/Grapher.ts";

/**
 * Initializer function for the `desmosshop` app.
 */
async function initialize() {
    Logger.info("Welcome to `desmosshop`!");

    // Define the 'move' function for arrays.
    Array.prototype.move = function (from, to) {
        this.splice(to, 0, this.splice(from, 1)[0]);
    };

    // Disable scroll zooming.
    document.body.addEventListener("wheel", (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    }, { passive: false });

    // Initialize the `desmosshop` app.
    Desmos.init();
    Grapher.init();
}

setTimeout(() => {
    // Check if the 'Calc' object exists.
    if (window.Calc) {
        // If it does, initialize the `desmosshop` app.
        initialize().catch(console.error);
    }
}, 100);

window.onbeforeunload = null;

export default "src/index.ts.js";