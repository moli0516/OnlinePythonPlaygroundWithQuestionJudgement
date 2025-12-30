import React from 'react';
import './App.css';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const PYODIDE_JS = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

async function ensurePyodideScript() {
  if (typeof window === 'undefined') return null;
  if (window.loadPyodide) return window.loadPyodide;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PYODIDE_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = PYODIDE_JS;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.loadPyodide;
}

function usePyodide() {
  const pyodideRef = React.useRef(null);
  const [status, setStatus] = React.useState('idle'); // idle | loading | ready | error
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    setStatus('loading');
    try {
      const loadPyodide = await ensurePyodideScript();
      const instance = await loadPyodide({ indexURL: PYODIDE_INDEX });
      pyodideRef.current = instance;
      setStatus('ready');
      return instance;
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to load Pyodide');
      setStatus('error');
      throw err;
    }
  }, []);

  const runCode = React.useCallback(
    async (code, { fnName = null, args = [] } = {}) => {
      const pyodide = await load();
      pyodide.globals.set('user_code', code);
      pyodide.globals.set('invoke_name', fnName);
      pyodide.globals.set('invoke_args', args);
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
      pyodide.globals.delete('user_code');
      pyodide.globals.delete('invoke_name');
      pyodide.globals.delete('invoke_args');
      const [stdoutText, stderrText, resultValue] = pyResult.toJs();
      pyResult.destroy?.();
      return { stdout: stdoutText, stderr: stderrText, resultValue };
    },
    [load]
  );

  return { status, error, load, runCode };
}

const SearchIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="m21 21-4.35-4.35" />
    <circle cx="11" cy="11" r="7" />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const FlameIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <path d="M7.5 13.5a3.5 3.5 0 0 1 5-3.15V10a4 4 0 0 1 5.86-3.5" />
    <path d="M4.6 19a7 7 0 1 0 10.8-8.2 12 12 0 0 1-1 2" />
  </svg>
);

const CircleButton = ({ children }) => (
  <button
    type="button"
    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 ring-1 ring-slate-800 transition hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
  >
    {children}
  </button>
);

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30">
            <span className="-mt-[1px] text-lg font-black">λ</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">
              Playground
            </span>
            <span className="text-sm font-semibold text-white">Python</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-slate-900/70 px-3 py-2 text-slate-300 ring-1 ring-slate-800 md:flex">
            <SearchIcon className="h-4 w-4" />
            <input
              className="w-44 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              placeholder="Search problems"
            />
          </div>
          <div className="flex items-center gap-3 text-slate-200">
            <CircleButton>
              <BellIcon className="h-4 w-4" />
            </CircleButton>
            <CircleButton>
              <FlameIcon className="h-4 w-4" />
            </CircleButton>
            <CircleButton>
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-semibold text-slate-950 ring-1 ring-amber-500/50">
                <div className="flex h-full items-center justify-center">Py</div>
              </div>
            </CircleButton>
          </div>
          <button
            type="button"
            className="hidden items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 sm:flex"
          >
            Premium
          </button>
        </div>
      </div>
    </header>
  );
}

function ProblemView({ id }) {
  const [problem, setProblem] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!id) {
      setProblem(null);
      setError('');
      return;
    }

    let isActive = true;
    fetch(`/api/problem/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isActive) return;
        if (data.success) {
          setProblem(data.info);
          setError('');
        } else {
          setError('Unable to load this problem.');
        }
      })
      .catch((err) => console.error('Error:', err));

    return () => {
      isActive = false;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        Select a problem to see its description, constraints, and examples.
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
        {error || 'Loading problem...'}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">
            Problem {problem.id || id}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{problem.title}</h2>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
          Live
        </span>
      </div>
      <div className="prose prose-invert max-w-none text-slate-100">
        <div dangerouslySetInnerHTML={{ __html: problem.content?.description }} />
        <p className="mt-4 font-semibold text-amber-300">Input format</p>
        <div dangerouslySetInnerHTML={{ __html: problem.content?.input_format }} />
        <p className="mt-4 font-semibold text-amber-300">Output format</p>
        <div dangerouslySetInnerHTML={{ __html: problem.content?.output_format }} />

        {problem.content?.constraints?.length ? (
          <>
            <p className="mt-4 font-semibold text-amber-300">Constraints</p>
            {problem.content.constraints.map((constraint, idx) => (
              <p key={idx} dangerouslySetInnerHTML={{ __html: constraint }} />
            ))}
          </>
        ) : null}

        {problem.content?.examples?.length ? (
          <>
            <p className="mt-4 font-semibold text-amber-300">Examples</p>
            {problem.content.examples.map((example, i) => (
              <div key={i} className="rounded-lg bg-slate-800/60 p-3 text-sm text-slate-100">
                <p className="font-semibold text-slate-200">Example {i + 1}</p>
                <p>
                  <span className="font-semibold text-amber-200">Input:</span> {example.input}
                </p>
                <p>
                  <span className="font-semibold text-amber-200">Output:</span> {example.output}
                </p>
                <p>
                  <span className="font-semibold text-amber-200">Explanation:</span> {example.explanation}
                </p>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ProblemSelect({ selectedProblemId, onSelect }) {
  const [problems, setProblems] = React.useState([]);
  const [problemsError, setProblemsError] = React.useState('');

  React.useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/problems', { method: 'GET' });
        if (!response.ok) {
          throw new Error(`Problems request failed (${response.status})`);
        }
        const data = await response.json();
        if (data.success) {
          setProblems(data.problems);
          setProblemsError('');
        } else {
          setProblemsError('Unable to load problems from the server.');
        }
      } catch (err) {
        console.error('Error:', err);
        setProblemsError('Unable to load problems from the server.');
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">Problems</p>
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
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
        >
          <option value="">Select a question</option>
          {problems.map((problem) => (
            <option key={problem.id} value={problem.id}>
              {problem.id} - {problem.title}
            </option>
          ))}
        </select>
        {problemsError ? (
          <p className="text-sm text-amber-300">{problemsError}</p>
        ) : null}
      </div>

      <ProblemView id={selectedProblemId} />
    </div>
  );
}

function CodeEditor({ value, onChange }) {
  const useTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const next = value.slice(0, start) + '\t' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 1;
      });
    }
  };

  const baseClass =
    'w-full min-h-[380px] rounded-xl border border-amber-500/60 bg-slate-950 text-slate-100 font-mono text-sm leading-6 shadow-inner focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30';

  const highlight = (code) => Prism.highlight(code, Prism.languages.python, 'python');

  return (
    <div className={baseClass}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={14}
        textareaId="code"
        className="whitespace-pre-wrap"
        style={{
          minHeight: '380px',
          fontFamily: '"JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: 14,
          lineHeight: '1.6',
          background: 'transparent',
          color: '#e2e8f0',
          outline: 'none',
        }}
        onKeyDown={useTab}
      />
    </div>
  );
}

function Terminal({ output = '' }) {
  return (
    <textarea
      id="terminal"
      name="terminal"
      rows={6}
      className="w-full rounded-xl border border-slate-800 bg-slate-950 text-slate-100 font-mono text-sm leading-6 shadow-inner focus:outline-none"
      placeholder="Terminal output..."
      spellCheck="false"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      readOnly
      value={output || ''}
    ></textarea>
  );
}

function RunResult({ result, sampleCase }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-400">
        Run code to see stdout, output, and expected values here.
      </div>
    );
  }

  const formatVal = (val) => {
    if (val === undefined || val === null) return String(val);
    if (typeof val === 'string') return val;
    try {
      return JSON.stringify(val, null, 2);
    } catch (e) {
      return String(val);
    }
  };

  const renderCode = (content, opts = {}) => {
    const {
      language = 'python',
      accentClass = 'text-slate-100',
    } = opts;
    return (
      <div className="rounded-lg bg-slate-900/80 ring-1 ring-slate-800">
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          customStyle={{
            margin: 0,
            borderRadius: '0.75rem',
            background: 'transparent',
            padding: '12px 14px',
            fontSize: '13px',
          }}
          codeTagProps={{ className: `!bg-transparent ${accentClass}` }}
          wrapLongLines
        >
          {content || ' '}
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
        <span>{result.source === 'submit' ? 'Judge Result' : 'Run Result'}</span>
        {result.success !== undefined ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              result.success ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
            }`}
          >
            {result.success ? 'Passed' : 'Mismatch'}
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
                {renderCode(formatVal(val))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Stdout</p>
        {renderCode(formatVal(result.stdout || ''), { accentClass: 'text-emerald-200', language: 'text' })}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Output</p>
        {renderCode(formatVal(result.output), { accentClass: 'text-orange-200', language: 'python' })}
      </div>

      {result.expected !== undefined ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Expected</p>
          {renderCode(formatVal(result.expected), { accentClass: 'text-emerald-300', language: 'python' })}
        </div>
      ) : null}

      {result.stderr ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Stderr</p>
          {renderCode(formatVal(result.stderr), { accentClass: 'text-rose-200', language: 'text' })}
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

function CodeForm({ selectedProblemId = '' }) {
  const { status: pyStatus, error: pyError, load, runCode } = usePyodide();
  const [result, setResult] = React.useState(null);
  const [codeValue, setCodeValue] = React.useState('');
  const [isRunning, setIsRunning] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [prefillError, setPrefillError] = React.useState('');
  const [sampleCase, setSampleCase] = React.useState(null);
  const [execName, setExecName] = React.useState('');

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'test') return;
    load().catch(() => null);
  }, [load]);

  React.useEffect(() => {
    if (!selectedProblemId) {
      setCodeValue('');
      setPrefillError('');
      setSampleCase(null);
      setExecName('');
      setResult(null);
      return;
    }

    let isActive = true;
    setPrefillError('');
    fetch(`/api/problem/${selectedProblemId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isActive) return;
        if (data.success) {
          const info = data.info || {};
          setCodeValue(info?.content?.sampleCode || '');
          setExecName(info?.content?.execuationCode || '');
        } else {
          setPrefillError('Unable to load sample code for this problem.');
        }
      })
      .catch(() => {
        if (!isActive) return;
        setPrefillError('Unable to load sample code for this problem.');
      });

    fetch(`/api/problem/${selectedProblemId}/case`)
      .then((res) => res.json())
      .then((data) => {
        if (!isActive) return;
        if (data.success) {
          setSampleCase(data.case);
          if (!execName) setExecName((prev) => prev || data.exec || '');
        } else {
          setSampleCase(null);
        }
      })
      .catch(() => {
        if (!isActive) return;
        setSampleCase(null);
      });

    return () => {
      isActive = false;
    };
  }, [selectedProblemId]);

  const handleRunLocally = async () => {
    if (!selectedProblemId) {
      setResult({ success: false, output: 'Please select a problem first.' });
      return;
    }
    if (!sampleCase) {
      setResult({ success: false, output: 'Sample test case not available.' });
      return;
    }
    if (!execName) {
      setResult({ success: false, output: 'Function entry point missing for this problem.' });
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
        stdout: stdout || '',
        stderr: stderr || '',
        output: outputVal,
        expected: sampleCase.expected,
        input: sampleCase.input,
        source: 'run',
      });
    } catch (err) {
      setResult({ success: false, output: err?.message || 'Failed to run code.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedProblemId) {
      setResult({ success: false, output: 'Please select a problem first.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const formdata = new FormData();
      formdata.append('problem_selected', selectedProblemId);
      formdata.append('code', codeValue);
      const response = await fetch('/api/submit_code', {
        method: 'POST',
        body: formdata,
      });
      const data = await response.json();
      setResult({
        success: data.success,
        output: data.output,
        source: 'submit',
      });
    } catch (err) {
      setResult({ success: false, output: err?.message || 'Submit failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge =
    pyStatus === 'ready'
      ? 'bg-emerald-500/15 text-emerald-300'
      : pyStatus === 'loading'
        ? 'bg-amber-500/15 text-amber-200'
        : 'bg-rose-500/15 text-rose-200';

  return (
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
            {selectedProblemId ? `#${selectedProblemId}` : 'No selection'}
          </span>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge}`}>
            {pyStatus === 'ready' ? 'Pyodide ready' : pyStatus === 'loading' ? 'Loading Pyodide' : 'Pyodide error'}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <CodeEditor value={codeValue} onChange={setCodeValue} />
        {prefillError ? (
          <p className="text-sm text-amber-300">{prefillError}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button label={isRunning ? 'Running...' : 'Run in browser'} onClick={handleRunLocally} disabled={isRunning || pyStatus === 'error'} />
          <Button label={isSubmitting ? 'Submitting...' : 'Submit to judge'} onClick={handleSubmitCode} disabled={isSubmitting} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <RunResult result={result} sampleCase={sampleCase} />
        {pyError ? <p className="text-sm text-rose-300">Pyodide error: {pyError}</p> : null}
      </div>
    </div>
  );
}

function App() {
  const [selectedProblemId, setSelectedProblemId] = React.useState('');

  return (
    <div className="App bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-10">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span className="flex h-6 items-center gap-2 rounded-full bg-emerald-500/15 px-3 text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live Sandbox
          </span>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
            Python 3
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ProblemSelect
            selectedProblemId={selectedProblemId}
            onSelect={setSelectedProblemId}
          />
          <CodeForm selectedProblemId={selectedProblemId} />
        </div>
      </main>
    </div>
  );
}

export default App;
