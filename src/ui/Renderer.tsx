import { createRoot } from "react-dom/client";

import ContextMenu from "@app/ContextMenu.tsx";
import Overlay from "@ui/Overlay.tsx";

class Renderer {
    /**
     * Initialize the renderer.
     */
    public static init(): void {
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
        root.render(<Overlay />);

        // Create context menu.
        ContextMenu.init();
    }
}

export default Renderer;