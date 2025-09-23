import React from "react";
import Dashboard from "./Dashboard";
import "./App.css";

function App() {
  return (
    <div style={{ background: "#f6f8fb", minHeight: "100vh", padding: 20 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        Expense Sharing — Demo
      </h1>
      <Dashboard />
    </div>
  );
}

export default App;
