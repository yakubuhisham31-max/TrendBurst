import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/setupFetch"; // ensure global fetch wrapper is loaded before app

createRoot(document.getElementById("root")!).render(<App />);
