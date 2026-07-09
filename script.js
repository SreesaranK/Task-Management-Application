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
function isTaskMissed(task) {
    if (task.completed || task.missed) return false;

    const taskDate = task.date;
    const taskTime = task.time;

    if (!taskDate || !taskTime) return false;

    const now = new Date();
    const taskDateTime = new Date(`${taskDate}T${convertTo24Hour(taskTime)}:00`);

    return taskDateTime < now;
}

function isTaskDueSoon(task) {
    if (!task || task.completed || task.missed) return false;

    const taskDate = task.date;
    const taskTime = task.time;

    if (!taskDate || !taskTime) return false;

    const now = new Date();
    const taskDateTime = new Date(`${taskDate}T${convertTo24Hour(taskTime)}:00`);
    const diffInMinutes = (taskDateTime - now) / (1000 * 60);

    return diffInMinutes > 0 && diffInMinutes <= 60;
}

function parseTaskTime(timeValue) {
    if (!timeValue || typeof timeValue !== "string") {
        return { hour: "", minute: "", period: "" };
    }

    const match = timeValue.trim().match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);
    if (match) {
        return {
            hour: match[1],
            minute: match[2],
            period: match[3].toUpperCase()
        };
    }

    return { hour: "", minute: "", period: "" };
}

function validateAndBuildTask(taskText, taskDate, taskHour, taskMinute, period, priority) {
    if (!taskText) throw new Error("Enter task");
    if (!taskDate) throw new Error("Select date");
    if (!taskHour || !taskMinute || !period) throw new Error("Select time");

    const hour = parseInt(taskHour, 10);
    const minute = parseInt(taskMinute, 10);

    if (!/^\d{1,2}$/.test(taskHour) || hour < 1 || hour > 12) {
        throw new Error("Hour must be between 1 and 12");
    }

    if (!/^\d{1,2}$/.test(taskMinute) || minute < 1 || minute > 59) {
        throw new Error("Minute must be between 1 and 59");
    }

    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (taskDate < todayString) {
        throw new Error("Past date not allowed");
    }

    if (taskDate === todayString) {
        let selectedHour = hour;

        if (period === "PM" && selectedHour !== 12) selectedHour += 12;
        if (period === "AM" && selectedHour === 12) selectedHour = 0;

        const selectedDateTime = new Date(`${taskDate}T${String(selectedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);

        if (selectedDateTime < today) {
            throw new Error("Past time is not allowed for today");
        }
    }

    return {
        text: taskText,
        date: taskDate,
        time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`,
        priority: priority || "Medium"
    };
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

    tasks.forEach(task => {
        if (!task.completed && isTaskMissed(task)) {
            task.missed = true;
        }
    });

    saveTasks();

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

        if (task.missed) {
            li.classList.add("missed-task");
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

        const statusBadge = document.createElement("span");
        statusBadge.className = "status-badge";
        statusBadge.textContent = task.completed ? "Completed" : task.missed ? "Missed" : "Pending";

        const dueSoonBadge = document.createElement("span");
        dueSoonBadge.className = "due-soon-badge";
        dueSoonBadge.textContent = isTaskDueSoon(task) ? "Due Soon" : "";

        details.appendChild(title);
        details.appendChild(meta);
        details.appendChild(priority);
        details.appendChild(statusBadge);
        if (isTaskDueSoon(task)) {
            details.appendChild(dueSoonBadge);
        }

        li.appendChild(details);

        const actions = document.createElement("div");
        actions.className = "actions";

        if (!task.completed) {
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.className = "edit-btn";
            editBtn.onclick = () => openEditModal(task, originalIndex);

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

            actions.appendChild(editBtn);
            actions.appendChild(completeBtn);
            actions.appendChild(deleteBtn);
        } else {
            const undoBtn = document.createElement("button");
            undoBtn.textContent = "Undo";
            undoBtn.className = "complete-btn";

            undoBtn.onclick = () => {
                tasks[originalIndex].completed = false;
                saveTasks();
                renderTasks();
                updateStats();
            };

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "❌";
            removeBtn.className = "delete-btn";

            removeBtn.onclick = () => {
                tasks.splice(originalIndex, 1);
                saveTasks();
                renderTasks();
                updateStats();
            };

            actions.appendChild(undoBtn);
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
function sanitizeTimeInput(input) {
    if (!input) return;
    input.value = input.value.replace(/\D/g, "").slice(0, 2);
}

function attachTimeValidation(input) {
    if (!input) return;

    input.addEventListener("input", () => sanitizeTimeInput(input));

    input.addEventListener("paste", (event) => {
        event.preventDefault();
        const pasted = (event.clipboardData || window.clipboardData).getData("text");
        input.value = pasted.replace(/\D/g, "").slice(0, 2);
    });

    input.addEventListener("keydown", (event) => {
        const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "Enter"];

        if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
            return;
        }

        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }
    });
}

const taskHourInput = document.getElementById("taskHour");
const taskMinuteInput = document.getElementById("taskMinute");
const taskDateInput = document.getElementById("taskDate");
const editModal = document.getElementById("editModal");
const editTaskForm = document.getElementById("editTaskForm");
const editTaskInput = document.getElementById("editTaskInput");
const editTaskDateInput = document.getElementById("editTaskDate");
const editTaskHourInput = document.getElementById("editTaskHour");
const editTaskMinuteInput = document.getElementById("editTaskMinute");
const editTaskPeriod = document.getElementById("editTaskPeriod");
const editTaskPriority = document.getElementById("editTaskPriority");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const saveEditBtn = document.getElementById("saveEditBtn");
let editingIndex = null;

attachTimeValidation(taskHourInput);
attachTimeValidation(taskMinuteInput);
attachTimeValidation(editTaskHourInput);
attachTimeValidation(editTaskMinuteInput);

function setDateInputMin(input) {
    if (!input) return;
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    input.min = `${year}-${month}-${day}`;
}

if (taskDateInput) {
    setDateInputMin(taskDateInput);
}

if (editTaskDateInput) {
    setDateInputMin(editTaskDateInput);
}

function openEditModal(task, index) {
    editingIndex = index;

    if (!editTaskInput || !editTaskDateInput || !editTaskHourInput || !editTaskMinuteInput || !editTaskPeriod || !editTaskPriority) return;

    editTaskInput.value = task.text || "";
    editTaskDateInput.value = task.date || "";

    const parsedTime = parseTaskTime(task.time);
    editTaskHourInput.value = parsedTime.hour || "";
    editTaskMinuteInput.value = parsedTime.minute || "";
    editTaskPeriod.value = parsedTime.period || "";
    editTaskPriority.value = task.priority || "Medium";

    editModal.classList.remove("hidden");
}

function closeEditModal() {
    if (editModal) {
        editModal.classList.add("hidden");
    }
    editingIndex = null;
}

function saveEditedTask(event) {
    if (event) {
        event.preventDefault();
    }

    if (editingIndex === null || !tasks[editingIndex]) return;

    const taskText = editTaskInput.value.trim();
    const taskDate = editTaskDateInput.value;
    const taskHour = editTaskHourInput.value.trim();
    const taskMinute = editTaskMinuteInput.value.trim();
    const period = editTaskPeriod.value;
    const priority = editTaskPriority.value || "Medium";

    try {
        const updatedTask = validateAndBuildTask(taskText, taskDate, taskHour, taskMinute, period, priority);
        Object.assign(tasks[editingIndex], updatedTask);
        saveTasks();
        renderTasks();
        updateStats();
        closeEditModal();
    } catch (error) {
        alert(error.message);
    }
}

if (editTaskForm) {
    editTaskForm.addEventListener("submit", saveEditedTask);
}

if (saveEditBtn) {
    saveEditBtn.addEventListener("click", saveEditedTask);
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", closeEditModal);
}

if (editModal) {
    editModal.addEventListener("click", (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    });
}

if (taskDateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    taskDateInput.min = `${year}-${month}-${day}`;
}

function addTask() {
    const taskText = document.getElementById("taskInput").value.trim();
    const taskDate = document.getElementById("taskDate").value;
    const taskHour = document.getElementById("taskHour").value.trim();
    const taskMinute = document.getElementById("taskMinute").value.trim();
    const period = document.getElementById("taskPeriod").value;
    const priority = document.getElementById("taskPriority").value || "Medium";

    try {
        const newTask = validateAndBuildTask(taskText, taskDate, taskHour, taskMinute, period, priority);
        tasks.push({
            ...newTask,
            completed: false
        });

        saveTasks();
        renderTasks();
        updateStats();

        document.getElementById("taskInput").value = "";
        document.getElementById("taskDate").value = "";
        document.getElementById("taskHour").value = "";
        document.getElementById("taskMinute").value = "";
        document.getElementById("taskPeriod").value = "";
        document.getElementById("taskPriority").value = "Medium";
    } catch (error) {
        alert(error.message);
    }
}

/* DARK MODE */
function applyTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const isDark = localStorage.getItem("theme") === "dark";

    document.body.classList.toggle("dark", isDark);

    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    }
}

applyTheme();

const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    });
}
