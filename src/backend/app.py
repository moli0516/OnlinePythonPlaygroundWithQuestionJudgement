import flask as fl
import os
from flask_cors import CORS
import subprocess
import sys
import json
from pathlib import Path
import codeJudge

DATADIR = Path('instance')


def loadProblemList():
    problems = []
    for folder in DATADIR.iterdir():
        for json_file in folder.glob('*.json'):
            with open(json_file, 'r', encoding="utf-8") as f:
                data = json.load(f)
                if 'problem' in data:
                    problem = data['problem']
                    problems.append({
                        'id': problem.get('id', ''),
                        'title': problem.get('title', '無標題'),
                    })
    return problems

def loadFullQuestion(id):
    di = Path("instance") / id
    for json_file in di.glob('*.json'):
        with open(json_file, 'r', encoding="utf-8") as f:
            data = json.load(f)
            if 'problem' in data:
                problem = data['problem']
                return problem

app = fl.Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:3000",  # React 開發服務器
        "methods": ["POST", "GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

problems = loadProblemList()    

@app.route("/")
def index():
    selected_problem = fl.request.args.get('problem', '')
    if not selected_problem:
        selected_problem = fl.request.cookies.get('last_selected_problem', '')
    return fl.render_template("index.html", problems = problems, selected_problem = selected_problem)

@app.route("/api/problems")
def apiGetProblems():
    return fl.jsonify({
        'success': True,
        'problems': problems
    })

@app.route("/api/problem/<id>")
def apiGetProblem(id):
    content = loadFullQuestion(id)
    if content:
        return fl.jsonify({
            'success': True,
            'info': content
        })

@app.route("/api/problem/<id>/case")
def apiGetProblemCase(id):
    try:
        inputs = codeJudge.loadInput(id)
        outputs = codeJudge.loadOutput(id)
        if not inputs or not outputs:
            return fl.jsonify({"success": False, "message": "No test cases found."}), 404
        return fl.jsonify({
            "success": True,
            "case": {
                "input": inputs[0],
                "expected": outputs[0]
            },
            "exec": codeJudge.getExecName(id)
        })
    except Exception as e:
        return fl.jsonify({"success": False, "message": str(e)}), 500
        
@app.route("/api/run_code", methods = ["POST"])
def apiRunCode():
    data = fl.request.form.get("code", "")
    output = subprocess.run([sys.executable, "-c",data], capture_output=True, text=True)
    return fl.jsonify({
        'success': True,
        'output': f"{output.stdout}\n{output.stderr}"
    })

@app.route("/api/submit_code", methods = ["POST"])
def apiSubmitCode():
    try:
        data = fl.request.form.get("code", "")
        id = fl.request.form.get('problem_selected', "")
        success, output = codeJudge.judge(id, data)
        return fl.jsonify({
            'success': success,
            'output': output
        })
    except Exception as e:
        return fl.jsonify({
            'success': False,
            'output': f"Judge error: {e}"
        }), 500

@app.route("/run_code", methods = ["POST"])
def processData():
    if fl.request.method == "POST":
        data = fl.request.form["code"]
        print(data, flush=True)
        output = subprocess.run([sys.executable, "-c",data], capture_output=True, text=True)
        print(output.stdout, flush=True)
    return fl.render_template("index.html", value = f"{output.stdout}\n{output.stderr}", code = data, problems = problems)

@app.route("/submit_code", methods = ["POST"])
def judgeTheCode():
    if fl.request.method == "POST":
        data = fl.request.form["code"]
        id = fl.request.form['problem_select']
        print(id)
        output = codeJudge.judge(id, data)
    return fl.render_template("index.html", value = f"{output}", code = data, problems = problems, selected_problem = id)

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    app.run(debug=True, host=host, port=port)
