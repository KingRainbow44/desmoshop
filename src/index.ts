import Logger from "@app/Logger.ts";
import Desmos from "@graphing/Desmos.tsx";
import Interaction from "@app/Interaction.ts";

/**
 * Initializer function for the `desmosshop` app.
 */
async function initialize() {
    Logger.info("Welcome to `desmosshop`!");

    // Define the 'move' function for arrays.
    Array.prototype.move = function (from, to) {
        this.splice(to, 0, this.splice(from, 1)[0]);
    };

    // Initialize the `desmosshop` app.
    Desmos.init();
    Interaction.init();
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