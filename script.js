let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateStats() {

    const today = new Date().toISOString().split("T")[0];

    const todayTasks = tasks.filter(
        task => task.date === today
    );

    const total = todayTasks.length;

    const completed = todayTasks.filter(
        task => task.completed
    ).length;

    const pending = total - completed;

    document.getElementById("totalTasks").textContent = total;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("pendingTasks").textContent = pending;
}

function convertTo24Hour(time) {

    let [clock, period] = time.split(" ");
    let [hour, minute] = clock.split(":");

    hour = parseInt(hour);

    if (period === "PM" && hour !== 12) {
        hour += 12;
    }

    if (period === "AM" && hour === 12) {
        hour = 0;
    }

    return `${hour.toString().padStart(2, "0")}:${minute}`;
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

    const sortedTasks = [...tasks].sort((a, b) => {

        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }

        if (a.completed !== b.completed) {
            return a.completed - b.completed;
        }

        return convertTo24Hour(a.time)
            .localeCompare(convertTo24Hour(b.time));
    });

    sortedTasks.forEach(task => {

        const originalIndex = tasks.indexOf(task);

        const li = document.createElement("li");
        li.className = "task-item";

        if (task.completed) {
            li.classList.add("completed-task");
        }

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.text;

        if (task.completed) {
            title.classList.add("completed");
        }

        const meta = document.createElement("div");
        meta.className = "task-meta";

        meta.textContent =
            `📅 ${task.date} | 🕒 ${task.time}`;

        const priority = document.createElement("span");

        priority.className =
            `priority-badge priority-${task.priority.toLowerCase()}`;

        priority.textContent = task.priority;

        details.appendChild(title);
        details.appendChild(meta);
        details.appendChild(priority);

        li.appendChild(details);

        const actions = document.createElement("div");
        actions.className = "actions";

        if (!task.completed) {

            const completeBtn = document.createElement("button");
            completeBtn.textContent = "Done";
            completeBtn.className = "complete-btn";

            completeBtn.onclick = function () {

                tasks[originalIndex].completed = true;

                saveTasks();
                renderTasks();
                updateStats();
            };

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.className = "delete-btn";

            deleteBtn.onclick = function () {

                tasks.splice(originalIndex, 1);

                saveTasks();
                renderTasks();
                updateStats();
            };

            actions.appendChild(completeBtn);
            actions.appendChild(deleteBtn);

        } else {

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "❌";
            removeBtn.className = "delete-btn";

            removeBtn.onclick = function () {

                tasks.splice(originalIndex, 1);

                saveTasks();
                renderTasks();
                updateStats();
            };

            actions.appendChild(removeBtn);
        }

        li.appendChild(actions);

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

    const timeInput =
        document.getElementById("taskTime");

    const periodInput =
        document.getElementById("taskPeriod");

    const priorityInput =
        document.getElementById("taskPriority");

    const taskText = taskInput.value.trim();
    const taskDate = dateInput.value;

    const selectedTime = timeInput.value;
    const period = periodInput.value;

    const priority = priorityInput.value;

    if (taskText === "") {
        alert("Please enter a task");
        return;
    }

    if (taskDate === "") {
        alert("Please select a date");
        return;
    }

    if (
        selectedTime === "" ||
        period === ""
    ) {
        alert("Please select time");
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (taskDate < today) {
        alert("Past dates are not allowed");
        return;
    }

    const taskTime =
        `${selectedTime} ${period}`;

    tasks.push({
        text: taskText,
        date: taskDate,
        time: taskTime,
        priority: priority,
        completed: false
    });

    saveTasks();
    renderTasks();
    updateStats();

    taskInput.value = "";
    dateInput.value = "";

    timeInput.value = "";
    periodInput.value = "";

    priorityInput.value = "Medium";
}

const today = new Date().toISOString().split("T")[0];

document.getElementById("taskDate").min = today;

renderTasks();
updateStats();