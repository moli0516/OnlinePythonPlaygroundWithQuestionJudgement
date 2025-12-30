import random
def diagonalSum(matrix):
    if not matrix:
        return 0
    n = len(matrix)
    total = 0
    for i in range(n):
        total += matrix[i][i]
        total += matrix[i][n-1-i]
    if n % 2 == 1:
        mid = n // 2
        total -= matrix[mid][mid]
    return total

def generate_test_cases():
    test_cases = []
    
    # 1. 邊界測試：最小矩陣
    test_cases.append([[1]])
    
    # 2. 隨機小矩陣（n=2-10）
    for n in range(2, 50):
        matrix = [[random.randint(-100000, 100000) for _ in range(n)] 
                  for _ in range(n)]
        test_cases.append(matrix)
    
    # 3. 極端值測試
    matrix_max = [[100000 for _ in range(50)] for _ in range(50)]
    matrix_min = [[-100000 for _ in range(50)] for _ in range(50)]
    
    test_cases.append(matrix_max)
    test_cases.append(matrix_min)
    
    # 4. 大數據性能測試
    for i in range(60, 101, 5):
        matrix_large = [[(k * n + j) for j in range(i)] for k in range(i)]
        test_cases.append(matrix_large)
    
    return test_cases

with open("src/backend/instance/0004/in.txt", "w", encoding="utf-8") as f_in, \
     open("src/backend/instance/0004/out.txt", "w", encoding="utf-8") as f_out:
    test_cases = generate_test_cases()
    f_in.write("[\n")
    f_out.write("[\n")
    for i, matrix in enumerate(test_cases):
        f_in.write(f"{matrix}")
        result = diagonalSum(matrix)
        f_out.write(f"{result}")
        if i != len(test_cases) - 1:
            f_in.write(",\n")
            f_out.write(",\n")
    f_in.write("\n]")
    f_out.write("\n]")
    
