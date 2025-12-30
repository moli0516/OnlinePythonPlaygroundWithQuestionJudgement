import logo from './logo.svg';
import './App.css';
import React from 'react';

function ProblemView({id}) {
  const [problem, setProblem] = React.useState(null);
  React.useEffect(() => {

    fetch(`/api/problem/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProblem(data.info);
      })
      .catch(err => console.error('Error:', err));
  }, [id]);
  if (!problem) return <div className="textview">載入中...</div>;
  console.log(problem);
  return (
    <div className="textview">
      <h2>{problem.title}</h2>
      <br></br>
      <p dangerouslySetInnerHTML={ { __html: problem.content?.description }}></p>
      <br></br>
      <p><b>Input format</b></p>
      <p dangerouslySetInnerHTML={ { __html: problem.content?.input_format }}></p>
      <br></br>
      <p><b>Output format</b></p>
      <p dangerouslySetInnerHTML={ { __html: problem.content?.output_format }}></p>
      <br></br>
      <p><b>Constraints</b></p>
      {problem.content?.constraints.map((constraint) => (
        <p dangerouslySetInnerHTML={ { __html: constraint }}></p>
      ))}
      <br></br>
      {problem.content?.examples.map((example, i) => (
        <p>Example {i + 1}<br></br>
        Input: {example.input}<br></br>
        Output: {example.output}<br></br>
        Explanation: {example.explanation}<br></br><br></br></p>
      ))}
    </div>
  );
}

function ProblemSelect() {
  async function getProblems() {
    const response = await fetch('/api/problems', {
      method: 'GET'
    });
    const data = await response.json();
    if (data.success) {
      return data.problems;
    }
    return [];
  }

  const [problems, setProblems] = React.useState([]);
  const [selectedProblemId, setSelectedProblemId] = React.useState("");

  React.useEffect(() => {
    async function fetchData() {
      const probs = await getProblems();
      setProblems(probs);
    }
    fetchData();
  }, []);

  function handleChange(e) {
    setSelectedProblemId(e.target.value);
  }
  return (
    <div className="row">
      <div className="form-container" style={{paddingRight: "5%", width: "50%"}}>
        <select id="problem_select" name="problem_select" value={selectedProblemId} onChange={handleChange}>
          <option value="">Select a question</option>
          {problems.map((problem) => (
            <option key={problem.id} value={problem.id}>
              {problem.id} - {problem.title}
            </option>
          ))}
        </select>
        <ProblemView id={selectedProblemId} />
      </div>
        <CodeForm selectedProblemId={selectedProblemId} />  
    </div>
  );
}


function CodeEditor({id}) {
  const [problem, setProblem] = React.useState(null);
  React.useEffect(() => {

    fetch(`/api/problem/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProblem(data.info);
      })
      .catch(err => console.error('Error:', err));
  }, [id]);

  const useTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      e.target.value = e.target.value.substring(0, start) + "\t" + e.target.value.substring(end);
      e.target.selectionStart = e.target.selectionEnd = start + 1;
    }
  };

  if (!problem) return (
    <textarea 
      id="code" 
      name="code" 
      className="textview"
      row="1"
      cols="40"
      placeholder="# Write your Python code here..."
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      onKeyDown={useTab}
      ></textarea>
  );
  return (
    <textarea 
      id="code" 
      name="code" 
      className="textview"
      row="1"
      cols="40"
      placeholder="# Write your Python code here..."
      defaultValue={problem.content?.sampleCode}
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      onKeyDown={useTab}
      ></textarea>
  );
}

function Terminal({output = ""}) {
  return (
    <textarea 
      id="code" 
      name="terminal" 
      className="textview"
      cols="40"
      row="1"
      readOnly
      placeholder="Terminal output..."
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      value={output}
      ></textarea>
  );
}

function Button({label, action}) {
  return (
    <button type="submit" className="submit-btn" formAction={action}>{label}</button>
  );
}

function CodeForm({selectedProblemId = ""}) {
  const [result, setResult] = React.useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formdata = new FormData(e.currentTarget);
    const clickedButton = e.nativeEvent.submitter;
    const action = clickedButton.getAttribute('formAction');

    if (action === "/run_code") {
      await handleRunCode(formdata);
    } else if (action === "/submit_code") {
      await handleSubmitCode(formdata);
    }
  };

  const handleRunCode = async (formdata) => {
      const response = await fetch('/api/run_code', {
        method: 'POST',
        body: formdata
      });
      const data = await response.json();
      setResult(data);
      console.log(result);
    };

  const handleSubmitCode = async (formdata) => {
    console.log(Object.fromEntries(formdata.entries()));
      const response = await fetch('/api/submit_code', {
        method: 'POST',
        body: formdata
      });
      const data = await response.json();
      console.log(data);
      setResult(data); 
      
    };

  return (
  <div className="form-container" style={{paddingRight: "5%", width: "50%"}}>
    
    <form onSubmit={handleSubmit}>
      <input type="hidden" id="problem_selected" name="problem_selected" value={selectedProblemId}/>
      <CodeEditor id={selectedProblemId}/>
      <Button label={"Run Code"} action={"/run_code"}/>
      <Button label={"Submit Code"} action={"/submit_code"}/>
    </form>
    <h2 className="subtitle">Terminal Output</h2>
    <Terminal output={result.output}/>
  </div>
  );
};

function App() {
  return (
    <div className="App">
      <h1 className="title">Python Playground</h1>
      <ProblemSelect />
    </div>
  );
};

export default App;