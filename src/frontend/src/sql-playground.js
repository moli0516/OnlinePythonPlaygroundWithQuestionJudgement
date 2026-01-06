import React from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-sql";

const SQL_JS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js";
const wasmLocate = (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`;

async function ensureSqlJs() {
  if (typeof window === "undefined") return null;
  if (window.initSqlJs) return window.initSqlJs;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SQL_JS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = SQL_JS_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return window.initSqlJs;
}

const sampleDDL = `
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  role TEXT,
  salary INTEGER
);
INSERT INTO employees (name, role, salary) VALUES
('Alice', 'Engineer', 95000),
('Bob', 'Engineer', 85000),
('Carol', 'Designer', 78000),
('Dave', 'Manager', 120000);
`;

const starterQuery = `-- Find engineers making at least 90k
SELECT name, salary FROM employees
WHERE role = 'Engineer' AND salary >= 90000;`;

export default function SqlPlayground() {
  const [db, setDb] = React.useState(null);
  const [query, setQuery] = React.useState(starterQuery);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDb() {
      try {
        const initSqlJs = await ensureSqlJs();
        if (!initSqlJs) throw new Error("sql.js not available");
        const SQL = await initSqlJs({ locateFile: wasmLocate });
        const database = new SQL.Database();
        database.run(sampleDDL);
        setDb(database);
      } catch (e) {
        setError(e?.message || "Failed to load SQL engine.");
      } finally {
        setLoading(false);
      }
    }
    loadDb();
    return () => {
      db?.close?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runQuery = () => {
    if (!db) return;
    setError("");
    try {
      const res = db.exec(query);
      setResult(res[0] || { columns: [], values: [] });
    } catch (e) {
      setResult(null);
      setError(e?.message || "Query failed.");
    }
  };

  const highlight = (code) => Prism.highlight(code, Prism.languages.sql, "sql");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <span className="flex h-6 items-center gap-2 rounded-full bg-blue-500/15 px-3 text-blue-200">
          SQL.js playground
        </span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
          Local in-browser database
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-card">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-400">
              Sample DB
            </p>
            <h2 className="text-xl font-semibold text-white">employees</h2>
            <p className="text-sm text-slate-300">
              Minimal question: list engineer names earning ≥ 90k.
            </p>
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-900 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">id</th>
                  <th className="px-3 py-2">name</th>
                  <th className="px-3 py-2">role</th>
                  <th className="px-3 py-2">salary</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, name: "Alice", role: "Engineer", salary: 95000 },
                  { id: 2, name: "Bob", role: "Engineer", salary: 85000 },
                  { id: 3, name: "Carol", role: "Designer", salary: 78000 },
                  { id: 4, name: "Dave", role: "Manager", salary: 120000 },
                ].map((row) => (
                  <tr key={row.id} className="border-t border-slate-800">
                    <td className="px-3 py-2">{row.id}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.role}</td>
                    <td className="px-3 py-2">{row.salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-400">
                Editor
              </p>
              <h2 className="text-xl font-semibold text-white">SQL sandbox</h2>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
              {loading ? "Loading engine..." : db ? "Ready" : "Error"}
            </span>
          </div>

          <div className="rounded-xl border border-blue-500/60 bg-slate-950 text-slate-100 shadow-inner editor-shell">
            <Editor
              value={query}
              onValueChange={setQuery}
              highlight={highlight}
              padding={14}
              textareaId="sql-editor"
              textareaClassName="editor-textarea"
              className="whitespace-pre-wrap"
              style={{
                minHeight: "220px",
                fontFamily:
                  '"JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 14,
                lineHeight: "1.6",
                background: "transparent",
                color: "#e2e8f0",
                outline: "none",
                border: "none",
                caretColor: "#38bdf8",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={runQuery}
              disabled={!db || loading}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Run query
            </button>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
              <span>Result</span>
              {result ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {result.values?.length || 0} rows
                </span>
              ) : null}
            </div>
            {result ? (
              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-900 text-xs uppercase text-slate-400">
                    <tr>
                      {result.columns.map((col) => (
                        <th key={col} className="px-3 py-2">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.values.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-800">
                        {row.map((cell, cidx) => (
                          <td key={cidx} className="px-3 py-2">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Run a query to see results.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
