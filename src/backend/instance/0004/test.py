def loadInput(id):
    with open("D:\\git-repos\\ICT_5starstar\\pythonPlayground_sqlPage\\OnlinePythonPlaygroundWithQuestionJudgement\\src\\backend\\instance\\0004\\in.txt", "r", encoding="utf-8") as f:
        loadedList = eval(f.readline())
        return loadedList

print(loadInput("0004")[0])