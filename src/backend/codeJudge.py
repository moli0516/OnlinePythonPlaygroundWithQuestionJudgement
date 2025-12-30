from pathlib import Path
import json
import copy
import traceback

def loadInput(id):
    folder = Path("instance") / id
    for txt in folder.glob("*.txt"):
        if txt.name == "in.txt":
            with open(txt, "r", encoding="utf-8") as f:
                loadedList = eval(f.read())
                return loadedList if loadedList is not None else []
    return []
                
def loadOutput(id):
    folder = Path("instance") / id
    for txt in folder.glob("*.txt"):
        if txt.name == "out.txt":
            with open(txt, "r", encoding="utf-8") as f:
                loadedList = eval(f.read())
                return loadedList if loadedList is not None else []
    return []
            
def getExecuationCode(id):
    di = Path("instance") / id
    for json_file in di.glob('*.json'):
        with open(json_file, 'r', encoding="utf-8") as f:
            data = json.load(f)
            return data['problem']['content']['execuationCode']
        
def execuation(code_string, function_name, args=None, kwargs=None):
    if args is None:
        args = []
    if kwargs is None:
        kwargs = {}
    namespace = {}
    exec(code_string, namespace)
    if function_name in namespace :
        func = namespace[function_name]
        return func(*args, **kwargs)

def isbBuiltinClass(obj):
    module_name = obj.__class__.__module__
    return module_name == 'builtins'

def judge(id, code):
    stdin = loadInput(id) or []
    stdout = loadOutput(id) or []

    if len(stdin) != len(stdout):
        return False, f"Test data error: input cases ({len(stdin)}) and output cases ({len(stdout)}) count mismatch."

    for i in range(len(stdin)):
        currentInput = copy.deepcopy(stdin[i])
        try:
            args = currentInput if isinstance(currentInput, (list, tuple)) else [currentInput]
            output = execuation(code, getExecuationCode(id), args)
        except Exception:
            tb = traceback.format_exc()
            return False, f"Execution error at test case {i + 1}:\n{tb}"

        if output != stdout[i]:
            return False, (
                f"Result unmatch. At test case {i + 1}\n"
                f"Input: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, copy.deepcopy(args)))}\n"
                f"Output: {output}\nExpected Output: {stdout[i]}"
            )

    return True, "Success"
    
    
