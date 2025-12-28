import flask as fl
import subprocess
import sys
import os
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
    di = Path(f'instance\\{id}')
    for json_file in di.glob('*.json'):
        with open(json_file, 'r', encoding="utf-8") as f:
            data = json.load(f)
            if 'problem' in data:
                problem = data['problem']
                return problem

app = fl.Flask(__name__)
problems = loadProblemList()    

@app.route("/")
def index():
    return fl.render_template("index.html", problems = problems)

@app.route("/api/problem/<id>")
def apiGetProblem(id):
    content = loadFullQuestion(id)
    if content:
        return fl.jsonify({
            'success': True,
            'info': content
        })

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
    return fl.render_template("index.html", value = f"{output}", code = data, problems = problems)

if __name__ == "__main__":
    app.run(debug=True)