import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Manager } from "./pages/Manager";
import { Portal } from "./pages/Portal";
import { Schedule } from "./pages/Schedule";
import "./styles.css";

// Hash routing keeps this a static site with no router dependency.
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function App() {
  const route = useHashRoute();
  const page = route === "#/manager" ? "manager" : route === "#/schedule" ? "schedule" : "portal";

  return (
    <>
      <nav className="demo-nav">
        <span>Prototype:</span>
        <a href="#/portal" className={page === "portal" ? "active" : undefined}>
          Public portal
        </a>
        <a href="#/manager" className={page === "manager" ? "active" : undefined}>
          Manager
        </a>
        <a href="#/schedule" className={page === "schedule" ? "active" : undefined}>
          Call availability
        </a>
      </nav>
      {page === "manager" && <Manager />}
      {page === "schedule" && <Schedule />}
      {page === "portal" && <Portal />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
