import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// i18n için gerekli importlar
import './i18n';

createRoot(document.getElementById("root")!).render(
  <App />
);
