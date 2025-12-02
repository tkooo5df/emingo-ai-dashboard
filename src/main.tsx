import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set dark mode as default
if (!localStorage.getItem('emingo_theme')) {
  document.documentElement.classList.add('dark');
} else {
  const theme = localStorage.getItem('emingo_theme');
  if (theme === '"dark"') {
    document.documentElement.classList.add('dark');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
