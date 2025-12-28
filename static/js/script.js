console.log("JavaScript file successfully loaded in Flask app!");

const problemSelect = document.getElementById("problem_select");

problemSelect.addEventListener('change', async function (){
    const id = this.value;
    console.log(id)
    const response = await fetch(`/api/problem/${id}`);
    const data = await response.json();
    if(data.success){
        const title = document.getElementById("problem_title");
        const description = document.getElementById("problem_description");
        const constraints = document.getElementById("problem_constraints");
        const input = document.getElementById("problem_input");
        const output = document.getElementById("problem_output");
        const examples = document.getElementById("problem_examples");
        const codeElement = document.getElementById("code");
        title.innerHTML = data.info.title;
        examples.innerHTML = "";
        description.innerHTML = data.info.content.description;
        constraints.innerHTML = "<p><b>Constraints</b></p>"
        input.innerHTML = "<p><b>Input format</b></p>" +data.info.content.input_format;
        output.innerHTML = "<p><b>Output format</b></p>" + data.info.content.output_format;
        for (var i = 0; i < data.info.content.constraints.length; i++){
            constraints.innerHTML += "<p>" + data.info.content.constraints[i] + "</p>";
        }
        for (var i = 0; i < data.info.content.examples.length; i++){
            examples.innerHTML += "<p>Example " + (i + 1).toString() + "</p>";
            examples.innerHTML += "<p>Input: " + data.info.content.examples[i].input + "</p>";
            examples.innerHTML += "<p>Output: " + data.info.content.examples[i].output + "</p>";
            examples.innerHTML += "<p>Explanation: " + data.info.content.examples[i].explanation + "</p><br>";
        }
        codeElement.textContent = data.info.content.sampleCode;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const codeElement = document.getElementById("code");
    
    if (codeElement) {
        codeElement.addEventListener('keydown', function(e) {
            if (e.key === "Tab") {
                e.preventDefault();
                
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const spaces = "    "; // 4 spaces
                
                // Insert 4 spaces at cursor position
                this.value = this.value.substring(0, start) + spaces + this.value.substring(end);
                
                // Move cursor forward by 4 positions
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
        
        console.log("Code editor initialized successfully!");
    }
});

