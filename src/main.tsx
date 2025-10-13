import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeTheme, observeDarkModeChanges } from "./lib/theme";

// Initialize theme on app load
initializeTheme();
observeDarkModeChanges();

createRoot(document.getElementById("root")!).render(<App />);
