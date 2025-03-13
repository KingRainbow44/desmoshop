import realScript from "@app/index.ts";

const script = document.createElement("script");
script.src = chrome.runtime.getURL(realScript);
script.type = "module";

(document.head || document.documentElement).appendChild(script);