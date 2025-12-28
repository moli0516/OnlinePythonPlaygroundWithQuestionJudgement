from pathlib import Path
import subprocess
import sys
import json


def loadInput(id):
    folder = Path(f"instance\\{id}")
    for txt in folder.glob("*.txt"):
        if txt.name == "in.txt":
            with open(txt, "r", encoding="utf-8") as f:
                loadedList = eval(f.read())
                return loadedList
                
def loadOutput(id):
    folder = Path(f"instance\\{id}")
    for txt in folder.glob("*.txt"):
        if txt.name == "out.txt":
            with open(txt, "r", encoding="utf-8") as f:
                loadedList = eval(f.read())
                return loadedList
            
def getExecuationCode(id):
    di = Path(f'instance\\{id}')
    for json_file in di.glob('*.json'):
        with open(json_file, 'r', encoding="utf-8") as f:
            data = json.load(f)
            return data['problem']['content']['execuationCode']
        
def execuation(code_string, function_name, args=None, kwargs=None):
    if args is None:
        args = []
    if kwargs is None:
        kwargs = {}

        # 創建命名空間
    namespace = {}
    exec(code_string, namespace)
        
        # 獲取函數
    if function_name in namespace:
        func = namespace[function_name]
        return func(*args, **kwargs)
    
def judge( id, code):
        stdin = loadInput(id)
        stdout = loadOutput(id)
        for i in range(len(stdin)):
            output = execuation(code, getExecuationCode(id), stdin[i])
            print(output, stdout[i])
            if output != stdout[i]:
                return "Result unmatch"
        return "Success"
    
    