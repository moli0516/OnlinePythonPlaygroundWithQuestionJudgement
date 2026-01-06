import React from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const PYODIDE_JS = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
const PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/";

async function ensurePyodideScript() {
  if (typeof window === "undefined") return null;
  if (window.loadPyodide) return window.loadPyodide;
  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PYODIDE_JS}"]`);
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = PYODIDE_JS;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return window.loadPyodide;
}

function usePyodide() {
  const ref = React.useRef(null);
  const [status, setStatus] = React.useState("idle"); // idle | loading | ready | error
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    if (ref.current) return ref.current;
    setStatus("loading");
    try {
      const loadPyodide = await ensurePyodideScript();
      const inst = await loadPyodide({ indexURL: PYODIDE_INDEX });
      ref.current = inst;
      setStatus("ready");
      return inst;
    } catch (e) {
      setStatus("error");
      setError(e?.message || "Failed to load Pyodide");
      throw e;
    }
  }, []);

  const runCode = React.useCallback(
    async (code, { fnName = null, args = [] } = {}) => {
      const pyodide = await load();
      pyodide.globals.set("user_code", code);
      pyodide.globals.set("invoke_name", fnName);
      pyodide.globals.set("invoke_args", args);
      const pyResult = await pyodide.runPythonAsync(`
import sys, io, traceback, builtins
stdout, stderr = io.StringIO(), io.StringIO()
old_out, old_err = sys.stdout, sys.stderr
sys.stdout, sys.stderr = stdout, stderr
result_value = None
globs = {"__builtins__": builtins}
try:
    exec(user_code, globs)
    if invoke_name:
        if invoke_name in globs:
            func = globs[invoke_name]
            py_args = invoke_args.to_py() if hasattr(invoke_args, "to_py") else invoke_args
            if isinstance(py_args, (list, tuple)):
                result_value = func(*py_args)
            else:
                result_value = func(py_args)
        else:
            stderr.write(f"Function {invoke_name} not found\\n")
except Exception:
    traceback.print_exc()
finally:
    sys.stdout, sys.stderr = old_out, old_err
(stdout.getvalue(), stderr.getvalue(), result_value)
      `);
      pyodide.globals.delete("user_code");
      pyodide.globals.delete("invoke_name");
      pyodide.globals.delete("invoke_args");
      const [stdoutText, stderrText, resultValue] = pyResult.toJs();
      pyResult.destroy?.();
      return { stdout: stdoutText, stderr: stderrText, resultValue };
    },
    [load]
  );

  return { status, error, load, runCode };
}

function CodeEditor({ value, onChange }) {
  const useTab = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const next = value.slice(0, start) + "\t" + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1;
      });
    }
  };

  const highlight = (code) => {
    const html = Prism.highlight(code, Prism.languages.python, "python");
    return html.replace(/\t/g, '<span class="indent-guide">\t</span>');
  };
  const hasIndentGuides = /\t/.test(value);

  return (
    <div
      className={`w-full min-h-[380px] rounded-xl border border-amber-500/60 bg-slate-950 text-slate-100 font-mono text-sm leading-6 shadow-inner focus-within:border-amber-400 focus-within:ring-0 focus-within:outline-none editor-shell ${
        hasIndentGuides ? "show-indent-guides" : ""
      }`}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={14}
        tabSize={4}
        textareaId="code"
        textareaClassName="editor-textarea"
        preClassName="editor-pre"
        className="whitespace-pre"
        style={{
          minHeight: "380px",
          fontFamily:
            '"JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 14,
          lineHeight: "1.6",
          background: "transparent",
          color: "#e2e8f0",
          outline: "none",
          border: "none",
          caretColor: "#fbbf24",
          whiteSpace: "pre",
        }}
        onKeyDown={useTab}
      />
    </div>
  );
}

function formatVal(val, { inline = false } = {}) {
  if (val === undefined || val === null) return String(val);
  if (typeof val === "string") return val;
  try {
    return inline ? JSON.stringify(val) : JSON.stringify(val, null, 2);
  } catch (e) {
    return String(val);
  }
}

const cleanBr = (text = "") => text.replace(/<br\s*\/?>/gi, " ");

function RunResult({ result, sampleCase }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
        Run code to see stdout, output, and expected values here.
      </div>
    );
  }

  const renderCode = (content, opts = {}) => {
    const { language = "python", accentClass = "text-slate-100" } = opts;
    return (
      <div className="rounded-lg bg-slate-900/80 ring-1 ring-slate-800">
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          customStyle={{
            margin: 0,
            borderRadius: "0.75rem",
            background: "transparent",
            padding: "12px 14px",
            fontSize: "13px",
          }}
          codeTagProps={{ className: `!bg-transparent ${accentClass}` }}
          wrapLongLines
        >
          {content || " "}
        </SyntaxHighlighter>
      </div>
    );
  };

  const inputs = Array.isArray(sampleCase?.input)
    ? sampleCase.input
    : sampleCase?.input !== undefined && sampleCase?.input !== null
    ? [sampleCase.input]
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
        <span>{result.source === "submit" ? "Judge Result" : "Run Result"}</span>
        {result.success !== undefined ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              result.success ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {result.success ? "Passed" : "Mismatch"}
          </span>
        ) : null}
      </div>

      {inputs ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Input</p>
          <div className="space-y-2">
            {inputs.map((val, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  arg{idx + 1}
                </span>
                {renderCode(formatVal(val, { inline: true }), {
                  accentClass: "text-slate-100",
                  language: "text",
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Stdout</p>
        {renderCode(formatVal(result.stdout || "", { inline: false }), {
          accentClass: "text-emerald-200",
          language: "text",
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Output</p>
        {renderCode(formatVal(result.output, { inline: false }), {
          accentClass: "text-orange-200",
          language: "python",
        })}
      </div>

      {result.expected !== undefined ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Expected</p>
          {renderCode(formatVal(result.expected, { inline: false }), {
            accentClass: "text-emerald-300",
            language: "python",
          })}
        </div>
      ) : null}

      {result.stderr ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Stderr</p>
          {renderCode(formatVal(result.stderr, { inline: false }), {
            accentClass: "text-rose-200",
            language: "text",
          })}
        </div>
      ) : null}
    </div>
  );
}

function Button({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:shadow-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
}

export default function PythonPlayground() {
  const { status: pyStatus, error: pyError, load, runCode } = usePyodide();
  const [result, setResult] = React.useState(null);
  const [codeValue, setCodeValue] = React.useState("");
  const [isRunning, setIsRunning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [prefillError, setPrefillError] = React.useState("");
  const [sampleCase, setSampleCase] = React.useState(null);
  const [execName, setExecName] = React.useState("");
  const [problems, setProblems] = React.useState([]);
  const [selectedProblemId, setSelectedProblemId] = React.useState("");
  const [problemsError, setProblemsError] = React.useState("");
  const [problemDetail, setProblemDetail] = React.useState(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    load().catch(() => null);
  }, [load]);

  React.useEffect(() => {
    async function fetchList() {
      try {
        const res = await fetch("/api/problems");
        const data = await res.json();
        if (data.success) {
          setProblems(data.problems);
          setProblemsError("");
        } else {
          setProblemsError("Unable to load problems from the server.");
        }
      } catch {
        setProblemsError("Unable to load problems from the server.");
      }
    }
    fetchList();
  }, []);

  React.useEffect(() => {
    if (!selectedProblemId) {
      setCodeValue("");
      setPrefillError("");
      setSampleCase(null);
      setExecName("");
      setResult(null);
      return;
    }

    let isActive = true;
    setPrefillError("");

    const loadProblem = async () => {
      try {
        const res = await fetch(`/api/problem/${selectedProblemId}`);
        const data = await res.json();
        if (!isActive) return;
        if (data.success) {
          const info = data.info || {};
          setCodeValue(info?.content?.sampleCode || "");
          setExecName(info?.content?.execuationCode || "");
          setProblemDetail(info);
        } else {
          setPrefillError("Unable to load sample code for this problem.");
          setProblemDetail(null);
        }
      } catch (e) {
        if (!isActive) return;
        setPrefillError("Unable to load sample code for this problem.");
        setProblemDetail(null);
      }
    };

    const loadCase = async () => {
      try {
        const res = await fetch(`/api/problem/${selectedProblemId}/case`);
        const data = await res.json();
        if (!isActive) return;
        if (data.success) {
          setSampleCase(data.case);
          setExecName((prev) => prev || data.exec || "");
        } else {
          setSampleCase(null);
        }
      } catch (e) {
        if (!isActive) return;
        setSampleCase(null);
      }
    };

    loadProblem();
    loadCase();

    return () => {
      isActive = false;
    };
  }, [selectedProblemId]);

  const handleRunLocally = async () => {
    if (!selectedProblemId) {
      setResult({ success: false, output: "Please select a problem first." });
      return;
    }
    if (!sampleCase) {
      setResult({ success: false, output: "Sample test case not available." });
      return;
    }
    if (!execName) {
      setResult({
        success: false,
        output: "Function entry point missing for this problem.",
      });
      return;
    }
    setIsRunning(true);
    try {
      const { stdout, stderr, resultValue } = await runCode(codeValue, {
        fnName: execName,
        args: sampleCase.input,
      });
      const outputVal = resultValue === undefined ? null : resultValue;
      const matches = JSON.stringify(outputVal) === JSON.stringify(sampleCase.expected);
      setResult({
        success: matches,
        stdout: stdout || "",
        stderr: stderr || "",
        output: outputVal,
        expected: sampleCase.expected,
        input: sampleCase.input,
        source: "run",
      });
    } catch (err) {
      setResult({ success: false, output: err?.message || "Failed to run code." });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedProblemId) {
      setResult({ success: false, output: "Please select a problem first." });
      return;
    }
    setIsSubmitting(true);
    try {
      const formdata = new FormData();
      formdata.append("problem_selected", selectedProblemId);
      formdata.append("id", selectedProblemId);
      formdata.append("code", codeValue);
      const response = await fetch("/api/submit_code", {
        method: "POST",
        body: formdata,
      });
      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        const text = await response.text();
        throw new Error(text || "Server returned non-JSON response.");
      }
      setResult({
        success: data.success,
        output: data.output,
        source: "submit",
      });
    } catch (err) {
      setResult({
        success: false,
        output: err?.message || "Submit failed.",
        stderr: "",
        source: "submit",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge =
    pyStatus === "ready"
      ? "bg-emerald-500/15 text-emerald-300"
      : pyStatus === "loading"
      ? "bg-amber-500/15 text-amber-200"
      : "bg-rose-500/15 text-rose-200";

  return (
    <div className="space-y-6">
      <div className="mb-1 flex items-center gap-3 text-sm text-slate-300">
        <span className="flex h-6 items-center gap-2 rounded-full bg-emerald-500/15 px-3 text-emerald-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Python 3 sandbox
        </span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
          Select a problem to load sample code
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">
                Problems
              </p>
              <h1 className="text-xl font-semibold text-white">Choose a challenge</h1>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
              {problems.length} items
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor="problem_select" className="text-sm font-medium text-slate-200">
              Select a question
            </label>
            <select
              id="problem_select"
              name="problem_select"
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            >
              <option value="">Select a question</option>
              {problems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.id} - {problem.title}
                </option>
              ))}
            </select>
            {problemsError ? <p className="text-sm text-amber-300">{problemsError}</p> : null}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-sm font-semibold text-white">Description</p>
            {problemDetail ? (
              <div className="prose prose-invert max-w-none text-sm text-slate-100">
                <div dangerouslySetInnerHTML={{ __html: problemDetail.content?.description }} />
                <p className="mt-3 text-amber-300 font-semibold">Input format</p>
                <div dangerouslySetInnerHTML={{ __html: problemDetail.content?.input_format }} />
                <p className="mt-3 text-amber-300 font-semibold">Output format</p>
                <div dangerouslySetInnerHTML={{ __html: problemDetail.content?.output_format }} />
                {problemDetail.content?.constraints?.length ? (
                  <>
                    <p className="mt-3 text-amber-300 font-semibold">Constraints</p>
                    <ul className="list-disc pl-5">
                      {problemDetail.content.constraints.map((c, idx) => (
                        <li key={idx} dangerouslySetInnerHTML={{ __html: c }} />
                      ))}
                    </ul>
                  </>
                ) : null}
                {problemDetail.content?.examples?.length ? (
                  <>
                    <p className="mt-3 text-amber-300 font-semibold">Examples</p>
                    <ul className="space-y-2">
                      {problemDetail.content.examples.map((ex, idx) => (
                        <li key={idx} className="rounded-lg bg-slate-900/70 p-2">
                          <div className="text-slate-200">Input: {cleanBr(ex.input)}</div>
                          <div className="text-slate-200">Output: {cleanBr(ex.output)}</div>
                          <div
                            className="text-slate-400 text-xs"
                            dangerouslySetInnerHTML={{ __html: ex.explanation }}
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a problem to see its description.</p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-sm font-semibold text-white">Sample case</p>
            {sampleCase ? (
              <div className="text-sm text-slate-200">
                <div>
                  Input: {Array.isArray(sampleCase.input) ? sampleCase.input.map((v) => formatVal(v, { inline: true })).join(", ") : formatVal(sampleCase.input, { inline: true })}
                </div>
                <div>Expected: {formatVal(sampleCase.expected, { inline: true })}</div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a problem to load a sample.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">
                Editor
              </p>
              <h2 className="text-xl font-semibold text-white">Python sandbox</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
                {selectedProblemId ? `#${selectedProblemId}` : "No selection"}
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge}`}>
                {pyStatus === "ready"
                  ? "Pyodide ready"
                  : pyStatus === "loading"
                  ? "Loading Pyodide"
                  : "Pyodide error"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <CodeEditor value={codeValue} onChange={setCodeValue} />
            {prefillError ? <p className="text-sm text-amber-300">{prefillError}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button
                label={isRunning ? "Running..." : "Run in browser"}
                onClick={handleRunLocally}
                disabled={isRunning || pyStatus === "error"}
              />
              <Button
                label={isSubmitting ? "Submitting..." : "Submit to judge"}
                onClick={handleSubmitCode}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <RunResult result={result} sampleCase={sampleCase} />
            {pyError ? <p className="text-sm text-rose-300">Pyodide error: {pyError}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
