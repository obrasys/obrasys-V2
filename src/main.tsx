import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./globals.css";
import { setDefaultOptions } from "date-fns";
import { pt } from "date-fns/locale";
import { SessionContextProvider } from "./components/SessionContextProvider";

// Set default locale for date-fns
setDefaultOptions({ locale: pt });

createRoot(document.getElementById("root")!).render(
  <SessionContextProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </SessionContextProvider>
);
