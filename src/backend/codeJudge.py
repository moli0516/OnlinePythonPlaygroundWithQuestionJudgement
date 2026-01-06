from pathlib import Path
import json
import copy
import dataStructure as ds
import fetchProblem
        
def execFunction(code_string, function_name, args=None, kwargs=None):
    if args is None:
        args = []
    if kwargs is None:
        kwargs = {}
    namespace = {}
    exec(code_string, namespace)
    if function_name in namespace :
        func = namespace[function_name]
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return e

def isbBuiltinClass(obj):
    module_name = obj.__class__.__module__
    return module_name == 'builtins'

def judge(code, id):
    problem = fetchProblem.Problem(id)
    stdin = problem.getInNOut(fetchProblem.INNAME)
    stdout = problem.getInNOut(fetchProblem.OUTNAME)
    execName = problem.getExecName()
    for i in range(len(stdin)):
        currentInput = copy.deepcopy(stdin[i])
        output = execFunction(code, execName, stdin[i])
        if isinstance(output, Exception):
            return False, f"Error occurred: {str(output)} At test case {i + 1} / {len(stdin)}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}"
        if output != stdout[i]:
            return False, f"Result unmatch. At test case {i + 1} / {len(stdin)}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}\nOutput: {output}\nExpected Output: {stdout[i]}"

    return True, f"Success, {len(stdin)} test cases passed."
    
    
