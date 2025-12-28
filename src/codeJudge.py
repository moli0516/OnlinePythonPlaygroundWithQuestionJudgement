from pathlib import Path
import json
import dataStructure as ds
import copy

def loadInput(id):
    folder = Path(f"src\\instance\\{id}")
    for txt in folder.glob("*.txt"):
        if txt.name == "in.txt":
            with open(txt, "r", encoding="utf-8") as f:
                loadedList = eval(f.read())
                return loadedList
                
def loadOutput(id):
    folder = Path(f"src\\instance\\{id}")
    for txt in folder.glob("*.txt"):
        if txt.name == "out.txt":
            with open(txt, "r", encoding="utf-8") as f:
                loadedList = eval(f.read())
                return loadedList
            
def getExecuationCode(id):
    di = Path(f'src\\instance\\{id}')
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
        stdin = loadInput(id)
        stdout = loadOutput(id)
        for i in range(len(stdin)):
            currentInput = copy.deepcopy(stdin[i])
            output = execuation(code, getExecuationCode(id), stdin[i])
            if output != stdout[i]:
                
                return f"Result unmatch. At test case {i + 1}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}\nOutput: {output}\nExpected Output: {stdout[i]}"
        return "Success"
    
    