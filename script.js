let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

/* SAVE */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* STATS */
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

/* SAFE TIME PARSER */
function convertTo24Hour(time) {

    if (!time || typeof time !== "string") {
        return "00:00";
    }

    const parts = time.split(" ");
    if (parts.length < 2) return "00:00";

    let [clock, period] = parts;

    if (!clock || !period) return "00:00";

    let [hour, minute] = clock.split(":");

    hour = parseInt(hour || "0");

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${minute || "00"}`;
}

/* RENDER */
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

        const dateA = a.date || "";
        const dateB = b.date || "";

        if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
        }

        if ((a.completed || false) !== (b.completed || false)) {
            return (a.completed || false) - (b.completed || false);
        }

        const timeA = convertTo24Hour(a.time);
        const timeB = convertTo24Hour(b.time);

        return timeA.localeCompare(timeB);
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
        title.textContent = task.text || "Untitled Task";

        if (task.completed) {
            title.classList.add("completed");
        }

        const meta = document.createElement("div");
        meta.className = "task-meta";
        meta.textContent = `📅 ${task.date || "-"} | 🕒 ${task.time || "-"}`;

        const priority = document.createElement("span");

        const priorityValue = (task.priority || "Medium").toString();

        priority.className =
            `priority-badge priority-${priorityValue.toLowerCase()}`;

        priority.textContent = priorityValue;

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

            completeBtn.onclick = () => {
                tasks[originalIndex].completed = true;
                saveTasks();
                renderTasks();
                updateStats();
            };

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.className = "delete-btn";

            deleteBtn.onclick = () => {
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

            removeBtn.onclick = () => {
                tasks.splice(originalIndex, 1);
                saveTasks();
                renderTasks();
                updateStats();
            };

            actions.appendChild(removeBtn);
        }

        li.appendChild(actions);

        const formattedDate = new Date(task.date || today)
            .toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

        if (task.date === today) {
            todayList.appendChild(li);

        } else if (task.date > today) {

            if (!upcomingGroups[formattedDate]) {

                const h3 = document.createElement("h3");
                h3.className = "date-header";
                h3.textContent = formattedDate;

                const ul = document.createElement("ul");
                ul.className = "date-group";

                upcomingGroups[formattedDate] = ul;

                upcomingList.appendChild(h3);
                upcomingList.appendChild(ul);
            }

            upcomingGroups[formattedDate].appendChild(li);

        } else {

            if (!pastGroups[formattedDate]) {

                const h3 = document.createElement("h3");
                h3.className = "date-header";
                h3.textContent = formattedDate;

                const ul = document.createElement("ul");
                ul.className = "date-group";

                pastGroups[formattedDate] = ul;

                pastList.appendChild(h3);
                pastList.appendChild(ul);
            }

            pastGroups[formattedDate].appendChild(li);
        }
    });
}

/* ADD TASK */
function addTask() {

    const taskText = document.getElementById("taskInput").value.trim();
    const taskDate = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;
    const period = document.getElementById("taskPeriod").value;
    const priority = document.getElementById("taskPriority").value || "Medium";

    if (!taskText) return alert("Enter task");
    if (!taskDate) return alert("Select date");
    if (!time || !period) return alert("Select time");

    const today = new Date().toISOString().split("T")[0];

    if (taskDate < today) return alert("Past date not allowed");

    tasks.push({
        text: taskText,
        date: taskDate,
        time: `${time} ${period}`,
        priority: priority,
        completed: false
    });

    saveTasks();
    renderTasks();
    updateStats();

    document.getElementById("taskInput").value = "";
    document.getElementById("taskDate").value = "";
    document.getElementById("taskTime").value = "";
    document.getElementById("taskPeriod").value = "";
    document.getElementById("taskPriority").value = "Medium";
}

/* INIT */
const today = new Date().toISOString().split("T")[0];
document.getElementById("taskDate").min = today;

renderTasks();
updateStats();

/* GLOBAL FIX FOR GITHUB PAGES */
window.addTask = addTask;