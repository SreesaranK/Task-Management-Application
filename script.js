const taskList = document.getElementById("taskList");

let total = 0;
let completed = 0;

function updateStats() {
    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = total - completed;
}

function addTask() {
    const input = document.getElementById("taskInput");
    const taskText = input.value.trim();

    if(taskText === "") {
        alert("Please enter a task");
        return;
    }

    const li = document.createElement("li");
    li.className = "task-item";

    const span = document.createElement("span");
    span.textContent = taskText;

    const actions = document.createElement("div");
    actions.className = "actions";

    const completeBtn = document.createElement("button");
    completeBtn.textContent = "Done";
    completeBtn.className = "complete-btn";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "delete-btn";

    completeBtn.onclick = function() {
        if(!span.classList.contains("completed")) {
            span.classList.add("completed");
            completed++;
            updateStats();
        }
    };

    deleteBtn.onclick = function() {
        if(span.classList.contains("completed")) {
            completed--;
        }

        total--;
        li.remove();
        updateStats();
    };

    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(actions);

    taskList.appendChild(li);

    total++;
    updateStats();

    input.value = "";
}

updateStats();