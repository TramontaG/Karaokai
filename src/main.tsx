import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Application } from "./components/Application";
import { appContext } from "./context/AppContext";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <appContext.Provider>
      <Application />
    </appContext.Provider>
  </StrictMode>
);
