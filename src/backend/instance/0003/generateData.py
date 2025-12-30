from pathlib import Path
import dataStructure as ds

def rev(a, b):
    n = len(a.nums)
    for i in range(n):
        b.push(a.pop())

def removeBoxes(boxes, n: int):
    a = ds.Stack([])
    rev(boxes, a)
    for i in range(n):
        a.pop()
    rev(a, boxes)
    return boxes

def loadInput():
    current_dir = Path(__file__).parent
    file_path = current_dir / "in.txt"
    with open(file_path, "r", encoding="utf-8") as f:
        loadedList = eval(f.read())
        return loadedList

stdin = loadInput()
output = []
for i in range(len(stdin)):
    output.append(f"ds.Stack({removeBoxes(stdin[i][0], stdin[i][1]).nums})")
print(output)
