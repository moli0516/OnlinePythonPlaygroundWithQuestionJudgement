> # Online Python Playground With Question Judgement
>
> ### By Moli
>
> ![Static Badge](https://img.shields.io/badge/pypi-v1.0.5-blue) ![Static Badge](https://img.shields.io/badge/python-3-blue) ![Static Badge](https://img.shields.io/badge/licence-MIT-yellow) ![Static Badge](https://img.shields.io/badge/node.js-25.2.1-green)

---

## Install

### Windows

```shell
# Windows
pip install Flask

cd src/frontend

npm install
```

### MacOS

#### First terminal

```shell
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install Flask Flask-Cors
cd src/backend
python3 app.py 
```

#### Second terminal

```shell
cd src/frontend
npm install
npm start 
```

---

## Run on Local

```shell
# Windows and MacOS
cd src/backend

python app.py

cd ../frontend

npm start
```

---

## Update

> ### Migrate the frontend from tradition js to React

---

## Api

```
/api/run_code
```

> ### Execute the code you typed on Editor and show the standard output

```
/api/submit_code
```

> ### Execute the function provided by sample code and do comparison test for the return value of the function and the test cases
