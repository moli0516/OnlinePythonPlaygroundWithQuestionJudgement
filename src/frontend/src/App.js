import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import "./App.css";
import PythonPlayground from "./python-playground";
import SqlPlayground from "./sql-playground";

function Header() {
  const linkBase =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400/50";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
            <span className="-mt-[1px] text-lg font-black">λ</span>
          </div>
          <span className="text-sm font-semibold text-slate-100">Playgrounds</span>
        </div>
        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? "bg-amber-500/90 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            Python Playground
          </NavLink>
          <NavLink
            to="/sql"
            className={({ isActive }) =>
              `${linkBase} ${
                isActive
                  ? "bg-emerald-500/90 text-slate-950"
                  : "bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`
            }
          >
            SQL Playground
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-12 pt-6">
          <Routes>
            <Route path="/" element={<PythonPlayground />} />
            <Route path="/sql" element={<SqlPlayground />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
