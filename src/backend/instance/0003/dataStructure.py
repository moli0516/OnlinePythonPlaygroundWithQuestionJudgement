from inspect import stack

class Stack:
    def __init__(self, nums):
        self.nums = nums
        
    def pop(self):
        temp = self.nums[-1]
        self.nums = self.nums[:-1]
        return temp
    
    def push(self, val):
        self.nums.append(val)
    
    def __setattr__(self, key, value):
        caller = stack()[1][3]
        if caller in ('__init__', "pop", "push"):
            object.__setattr__(self, key, value)
            
    def __eq__(self, other):
        if type(other) != type(self):
            return NotImplemented
        if len(self.nums) == len(other.nums):
            print(len(self.nums), len(other.nums))
            for i in range(len(self.nums)):
                if self.nums[i] != other.nums[i]:
                    return NotImplemented
            return True
    
    def __repr__(self):
        return f"{self.nums}"