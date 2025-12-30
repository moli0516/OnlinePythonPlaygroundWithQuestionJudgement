console.log("JavaScript file successfully loaded in Flask app!");

const problemSelect = document.getElementById("problem_select");

// 頁面加載時恢復狀態
document.addEventListener('DOMContentLoaded', function() {
    // 從 URL 恢復問題選擇
    const urlParams = new URLSearchParams(window.location.search);
    const urlProblem = urlParams.get('problem');
    
    if (urlProblem) {
        // 設置下拉選單
        problemSelect.value = urlProblem;
        
        // 加載題目內容
        loadProblemContent(urlProblem);
    }
    
    // 從 localStorage 恢復（如果 URL 沒有）
    else {
        const storedProblem = localStorage.getItem('lastSelectedProblem');
        if (storedProblem) {
            problemSelect.value = storedProblem;
            loadProblemContent(storedProblem);
        }
    }
    
    // 初始化代碼編輯器
    const codeElement = document.getElementById("code");
    if (codeElement) {
        codeElement.addEventListener('keydown', function(e) {
            if (e.key === "Tab") {
                e.preventDefault();
                
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const spaces = "    ";
                
                this.value = this.value.substring(0, start) + spaces + this.value.substring(end);
                
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
        
        console.log("Code editor initialized successfully!");
    }
    
    // 為表單提交按鈕添加事件監聽
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        button.addEventListener('click', function(e) {
            // 保存當前選擇到 localStorage
            localStorage.setItem('lastSelectedProblem', problemSelect.value);
            
            // 更新 URL（如果可能）
            if (problemSelect.value) {
                const url = new URL(window.location);
                url.searchParams.set('problem', problemSelect.value);
                window.history.replaceState({}, '', url);
            }
        });
    });
});

// 處理問題選擇變化
problemSelect.addEventListener('change', function() {
    const id = this.value;
    
    // 保存到 localStorage
    if (id) {
        localStorage.setItem('lastSelectedProblem', id);
    } else {
        localStorage.removeItem('lastSelectedProblem');
    }
    
    // 更新 URL
    const url = new URL(window.location);
    if (id) {
        url.searchParams.set('problem', id);
    } else {
        url.searchParams.delete('problem');
    }
    window.history.replaceState({}, '', url);
    
    // 加載題目內容
    if (id) {
        loadProblemContent(id);
    } else {
        clearProblemDisplay();
    }
});

// 加載題目內容的函數
async function loadProblemContent(id) {
    console.log('Loading problem:', id);
    
    try {
        const response = await fetch(`/api/problem/${id}`);
        const data = await response.json();
        
        if (data.success) {
            updateProblemDisplay(data.info);
            
            // 如果代碼編輯器是空的，填入示例代碼
            const codeElement = document.getElementById("code");
            if (codeElement && !codeElement.value.trim() && data.info.content.sampleCode) {
                codeElement.value = data.info.content.sampleCode;
            }
        }
    } catch (error) {
        console.error('Error loading problem:', error);
    }
}

// 更新題目顯示
function updateProblemDisplay(info) {
    const title = document.getElementById("problem_title");
    const description = document.getElementById("problem_description");
    const constraints = document.getElementById("problem_constraints");
    const input = document.getElementById("problem_input");
    const output = document.getElementById("problem_output");
    const examples = document.getElementById("problem_examples");
    
    title.innerHTML = info.title;
    
    // 清空並重新填充
    examples.innerHTML = "";
    description.innerHTML = info.content.description;
    
    constraints.innerHTML = "<p><b>Constraints</b></p>";
    info.content.constraints.forEach(constraint => {
        constraints.innerHTML += "<p>" + constraint + "</p>";
    });
    
    input.innerHTML = "<p><b>Input format</b></p>" + info.content.input_format;
    output.innerHTML = "<p><b>Output format</b></p>" + info.content.output_format;
    
    info.content.examples.forEach((example, index) => {
        examples.innerHTML += `
            <p>Example ${index + 1}</p>
            <p>Input: ${example.input}</p>
            <p>Output: ${example.output}</p>
            <p>Explanation: ${example.explanation}</p>
            <br>
        `;
    });
}

// 清空題目顯示
function clearProblemDisplay() {
    const title = document.getElementById("problem_title");
    const description = document.getElementById("problem_description");
    const constraints = document.getElementById("problem_constraints");
    const input = document.getElementById("problem_input");
    const output = document.getElementById("problem_output");
    const examples = document.getElementById("problem_examples");
    
    title.innerHTML = '';
    description.innerHTML = 'Please select a problem from the dropdown';
    constraints.innerHTML = '';
    input.innerHTML = '';
    output.innerHTML = '';
    examples.innerHTML = '';
}