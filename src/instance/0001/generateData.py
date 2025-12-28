from pathlib import Path

def binarySearch(n, target, nums):
    low = 0
    high = n - 1

    while low <= high:
        # Calculate the middle index
        mid = (low + high) // 2
        
        # Check if the target is present at mid
        if nums[mid] == target:
            return mid
            
        # If target is greater, ignore the left half
        elif nums[mid] < target:
            low = mid + 1
            
        # If target is smaller, ignore the right half
        else:
            high = mid - 1
            
    # Target was not found
    return -1

def loadInput():
    current_dir = Path(__file__).parent
    file_path = current_dir / "in.txt"
    with open(file_path, "r", encoding="utf-8") as f:
        loadedList = eval(f.read())
        return loadedList

stdin = loadInput()
output = []
for i in range(len(stdin)):
    output.append(binarySearch(stdin[i][0], stdin[i][1], stdin[i][2]))
print(output)