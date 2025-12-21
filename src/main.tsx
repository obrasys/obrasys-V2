import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { setDefaultOptions } from "date-fns";
import { pt } from "date-fns/locale";

// Set default locale for date-fns
setDefaultOptions({ locale: pt });

createRoot(document.getElementById("root")!).render(<App />);