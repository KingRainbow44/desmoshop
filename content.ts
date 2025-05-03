import scriptPath from "./src/index.ts?script&module";

const script = document.createElement("script");
script.src = chrome.runtime.getURL(scriptPath);
script.type = "module";

(document.head || document.documentElement).prepend(script);