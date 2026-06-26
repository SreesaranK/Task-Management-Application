let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateStats() {
    const today = new Date().toISOString().split("T")[0];

    const todayTasks = tasks.filter(task => task.date === today);

    const total = todayTasks.length;
    const completed = todayTasks.filter(task => task.completed).length;
    const pending = total - completed;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
}

function renderTasks() {

    const todayList = document.getElementById("todayTasks");
    const upcomingList = document.getElementById("upcomingTasks");
    const pastList = document.getElementById("pastTasks");

    todayList.innerHTML = "";
    upcomingList.innerHTML = "";
    pastList.innerHTML = "";

    const today = new Date().toISOString().split("T")[0];

    const upcomingGroups = {};
    const pastGroups = {};

    tasks.forEach((task, index) => {

        const li = document.createElement("li");
        li.className = "task-item";

        const span = document.createElement("span");
        span.textContent = task.text;

        if (task.completed) {
            span.classList.add("completed");
        }

        li.appendChild(span);

        if (task.completed) {

            const removeBtn = document.createElement("button");
            removeBtn.innerHTML = "❌";
            removeBtn.className = "delete-btn";

            removeBtn.onclick = function () {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
                updateStats();
            };

            li.appendChild(removeBtn);
        } else {

            const actions = document.createElement("div");
            actions.className = "actions";

            const completeBtn = document.createElement("button");
            completeBtn.textContent = "Done";
            completeBtn.className = "complete-btn";

            completeBtn.onclick = function () {
                tasks[index].completed = true;
                saveTasks();
                renderTasks();
                updateStats();
            };

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.className = "delete-btn";

            deleteBtn.onclick = function () {
                tasks.splice(index, 1);
                saveTasks();
                renderTasks();
                updateStats();
            };

            actions.appendChild(completeBtn);
            actions.appendChild(deleteBtn);

            li.appendChild(actions);
        }

        const formattedDate = new Date(task.date)
            .toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

        if (task.date === today) {

            todayList.appendChild(li);

        } else if (task.date > today) {

            if (!upcomingGroups[formattedDate]) {

                const dateHeader = document.createElement("h3");
                dateHeader.className = "date-header";
                dateHeader.textContent = formattedDate;

                const groupList = document.createElement("ul");
                groupList.className = "date-group";

                upcomingGroups[formattedDate] = groupList;

                upcomingList.appendChild(dateHeader);
                upcomingList.appendChild(groupList);
            }

            upcomingGroups[formattedDate].appendChild(li);

        } else {

            if (!pastGroups[formattedDate]) {

                const dateHeader = document.createElement("h3");
                dateHeader.className = "date-header";
                dateHeader.textContent = formattedDate;

                const groupList = document.createElement("ul");
                groupList.className = "date-group";

                pastGroups[formattedDate] = groupList;

                pastList.appendChild(dateHeader);
                pastList.appendChild(groupList);
            }

            pastGroups[formattedDate].appendChild(li);
        }
    });
}

function addTask() {

    const taskInput = document.getElementById("taskInput");
    const dateInput = document.getElementById("taskDate");

    const taskText = taskInput.value.trim();
    const taskDate = dateInput.value;

    if (taskText === "") {
        alert("Please enter a task");
        return;
    }

    if (taskDate === "") {
        alert("Please select a date");
        return;
    }

    tasks.push({
        text: taskText,
        date: taskDate,
        completed: false
    });

    saveTasks();
    renderTasks();
    updateStats();

    taskInput.value = "";
    dateInput.value = "";
}

renderTasks();
updateStats();