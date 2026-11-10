import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@x-ac/web-design-react/style.css";
import "../../src/styles.css";
import "./styles.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
