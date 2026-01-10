import copy
import dataStructure as ds
import fetchProblem

def createNamespace(code_string):
    namespace = {}
    exec(code_string, namespace)
    return namespace
        
def execFunction(code_string, function_name, args=None, kwargs=None):
    if args is None:
        args = []
    if kwargs is None:
        kwargs = {}
    namespace = createNamespace(code_string)
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
    execName = problem.getExecName()
    className = problem.getClassName()
    hiddenCode = problem.getHiddenCode()
    hiddenSuffix = problem.getHiddenSuffix()
    print(execName, className, hiddenCode)
    code = hiddenCode + code + hiddenSuffix
    if execName:
        stdin = problem.getInNOut(fetchProblem.INNAME)
        stdout = problem.getInNOut(fetchProblem.OUTNAME)
        for i in range(len(stdin)):
            currentInput = copy.deepcopy(stdin[i])
            if execName:
                output = execFunction(hiddenCode + code, execName, stdin[i])
            else:
                output = None
            if isinstance(output, Exception):
                return False, f"Error occurred: {str(output)} At test case {i + 1} / {len(stdin)}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}"
            if output != stdout[i]:
                return False, f"Result unmatch. At test case {i + 1} / {len(stdin)}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}\nOutput: {output}\nExpected Output: {stdout[i]}"
    elif className:
        namespace = createNamespace(code)
        if className in namespace:
            Cls = namespace[className]
            stdin = problem.getInNOut(fetchProblem.INNAME)
            stdout = problem.getInNOut(fetchProblem.OUTNAME)
            for i in range(len(stdin)):
                currentInput = copy.deepcopy(stdin[i])
                try:
                    obj = Cls(**stdin[i][0])
                    outputs = []
                    for cmd, arg in zip(stdin[i][1], stdin[i][2]):
                        if arg is not None:
                            result = getattr(obj, cmd)(arg)
                        else:
                            result = getattr(obj, cmd)()
                        outputs.append(result)
                    
                except Exception as e:
                    return False, f"Error occurred: {str(e)} At test case {i + 1} / {len(stdin)}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}"
                if outputs != stdout[i][0]:
                    return False, f"Result unmatch. At test case {i + 1} / {len(stdin)}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}\nOutput: {outputs}\nExpected Output: {stdout[i]}"
                if obj != Cls(**stdout[i][1]):
                    return False, f"Final object state unmatch. At test case {i + 1} / {len(stdin)}\nInput: {tuple(map(lambda x: repr(x) if not(isbBuiltinClass(x)) else x, currentInput))}\nOutput Object: {obj.__dict__}\nExpected Object: {Cls(**stdout[i][1]).__dict__}"

            return True, f"Success, {len(stdin)} test cases passed."