import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "./App";
import History from "./History";
import Home from "./Home";
import "./css/index.css";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <nav className="navbar">
        <div className="nav-content">
          <Link to="/home">🏠 Home</Link>
          <Link to="/planner">🧭 Planner</Link>
          <Link to="/history">🕓 History</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/planner" element={<App />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
