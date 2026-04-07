// Punto de entrada del frontend.
// React monta aquí la aplicación dentro del div "root" del HTML base.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
