import flask as fl
import os
from flask_cors import CORS
import subprocess
import sys
import codeJudge
import fetchProblem

app = fl.Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:3000",  # React 開發服務器
        "methods": ["POST", "GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route("/api/problems")
def apiGetProblems():
    problems = fetchProblem.getProblems()
    return fl.jsonify({
        'success': True,
        'problems': problems
    })

@app.route("/api/problem/<id>")
def apiGetProblem(id):
    problem = fetchProblem.Problem(id)
    content = problem.getFullProblem()
    if content:
        return fl.jsonify({
            'success': True,
            'info': content
        })

@app.route("/api/problem/<id>/case")
def apiGetProblemCase(id):
    problem = fetchProblem.Problem(id)
    try:
        inputs = problem.getInNOut(fetchProblem.INNAME)
        outputs = problem.getInNOut(fetchProblem.OUTNAME)
        execName = problem.getExecName()
        if not inputs or not outputs:
            return fl.jsonify({"success": False, "message": "No test cases found."}), 404
        return fl.jsonify({
            "success": True,
            "case": {
                "input": inputs[0],
                "expected": outputs[0]
            },
            "exec": execName
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
        id = fl.request.form.get('id', "")
        success, output = codeJudge.judge(data, id)
        return fl.jsonify({
            'success': success,
            'output': output
        })
    except Exception as e:
        return fl.jsonify({
            'success': False,
            'output': f"Judge error: {e}"
        }), 500

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    app.run(debug=True, host=host, port=port)
