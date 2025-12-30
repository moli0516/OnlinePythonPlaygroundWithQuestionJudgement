from pathlib import Path

def bubbleSort(n, nums):
    new_list = list(nums)
    list_len = n
    cnt = 0
    for i in range(n-1):
        for j in range(n - i - 1):
            if new_list[j] > new_list[j + 1]:
                new_list[j], new_list[j + 1] = new_list[j + 1], new_list[j]
                cnt += 1
    return [cnt, new_list]

def loadInput():
    current_dir = Path(__file__).parent
    file_path = current_dir / "in.txt"
    with open(file_path, "r", encoding="utf-8") as f:
        loadedList = eval(f.read())
        return loadedList

stdin = loadInput()
output = []
for i in range(len(stdin)):
    output.append(bubbleSort(stdin[i][0], stdin[i][1]))
print(output)