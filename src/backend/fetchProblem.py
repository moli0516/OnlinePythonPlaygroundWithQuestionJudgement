import requests
import json
import base64
import dataStructure as ds

REPO = "ProgrammingQuestions"
OWNER = "moli0516"
PATH = "data"
METANAME = "meta.json"
INNAME = "in.txt"
OUTNAME = "out.txt"

TOKEN = json.load(open('token.json', 'r', encoding='utf-8'))['token']

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    'Accept': 'application/json',
    'Authorization': f'Bearer {TOKEN}' 
}

class Problem:
    def __init__(self, id):
        self.id = id
        self.url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{PATH}/{self.id}"
    def getFullProblem(self):
        data = requests.get(f"{self.url}/{METANAME}", headers=HEADERS).json()['content']
        decodedJson = json.loads(base64.b64decode(data).decode('utf-8'))['problem']
        return decodedJson
    def getInNOut(self, name):
        data = requests.get(f"{self.url}/{name}", headers=HEADERS).json()['content']
        decodedJson = base64.b64decode(data).decode('utf-8')
        return eval(decodedJson)
    def getExecName(self):
        return self.getFullProblem()['content']['execName']


def getProblems():
    response = requests.get(f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{PATH}", headers=HEADERS)
    print(response.status_code)
    if response.status_code == 200:
        treeData = response.json()
        n = len(treeData)
        problems = []
        for i in range(n):
            data = requests.get(f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{PATH}/{treeData[i]['name']}/{METANAME}", headers=HEADERS).json()['content']
            decodedJson = json.loads(base64.b64decode(data).decode('utf-8'))['problem']
            problems.append({'id': decodedJson['id'],
                             'title': decodedJson['title']})
        return problems
    else:
        return -1