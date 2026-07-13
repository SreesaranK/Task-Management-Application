let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editingIndex = null;

/* SAVE */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* STATS */
function updateStats() {
    const today = new Date().toISOString().split("T")[0];
    const todayTasks = tasks.filter(task => task.date === today);

    document.getElementById("totalTasks").textContent = todayTasks.length;
    document.getElementById("completedTasks").textContent =
        todayTasks.filter(task => task.completed).length;
    document.getElementById("pendingTasks").textContent =
        todayTasks.filter(task => !task.completed).length;
}

/* TIME HELPERS */
function convertTo24Hour(time) {
    if (!time || typeof time !== "string") return "00:00";

    const parts = time.split(" ");
    if (parts.length < 2) return "00:00";

    let [clock, period] = parts;
    let [hour, minute] = clock.split(":");

    hour = parseInt(hour || "0", 10);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${minute || "00"}`;
}

function parseTaskTime(timeValue) {
    if (!timeValue || typeof timeValue !== "string") {
        return { hour: "", minute: "", period: "" };
    }

    const match = timeValue.trim().match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);

    if (!match) {
        return { hour: "", minute: "", period: "" };
    }

    return {
        hour: match[1],
        minute: match[2],
        period: match[3].toUpperCase()
    };
}

function isTaskMissed(task) {
    if (task.completed || task.missed || !task.date || !task.time) {
        return false;
    }

    const taskDateTime = new Date(
        `${task.date}T${convertTo24Hour(task.time)}:00`
    );

    return taskDateTime < new Date();
}

function isTaskDueSoon(task) {
    if (task.completed || task.missed || !task.date || !task.time) {
        return false;
    }

    const taskDateTime = new Date(
        `${task.date}T${convertTo24Hour(task.time)}:00`
    );

    const difference = (taskDateTime - new Date()) / (1000 * 60);

    return difference > 0 && difference <= 60;
}

function validateAndBuildTask(
    taskText,
    taskDate,
    taskHour,
    taskMinute,
    period,
    priority,
    allowPast = false
) {
    if (!taskText) throw new Error("Enter task");
    if (!taskDate) throw new Error("Select date");
    if (!taskHour || !taskMinute || !period) throw new Error("Select time");

    const hour = parseInt(taskHour, 10);
    const minute = parseInt(taskMinute, 10);

    if (!/^\d{1,2}$/.test(taskHour) || hour < 0 || hour > 12) {
        throw new Error("Hour must be between 1 and 12");
    }

    if (!/^\d{1,2}$/.test(taskMinute) || minute < 0 || minute > 59) {
        throw new Error("Minute must be between 1 and 59");
    }

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    if (!allowPast && taskDate < today) {
        throw new Error("Past date not allowed");
    }

    if (!allowPast && taskDate === today) {
        let selectedHour = hour;

        if (period === "PM" && selectedHour !== 12) selectedHour += 12;
        if (period === "AM" && selectedHour === 12) selectedHour = 0;

        const selectedDateTime = new Date(
            `${taskDate}T${String(selectedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
        );

        if (selectedDateTime < now) {
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

/* INPUTS */
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

function sanitizeTimeInput(input) {
    input.value = input.value.replace(/\D/g, "").slice(0, 2);
}

function attachTimeValidation(input, max, allowZero) {
    if (!input) return;

    let lastValidValue = "";

    function validateValue(value) {
        const cleanValue = value.replace(/\D/g, "").slice(0, 2);

        if (cleanValue === "") {
            lastValidValue = "";
            return "";
        }

        // Allow a single 0 while the user is typing 01, 02, etc.
        if (cleanValue.length === 1) {
            lastValidValue = cleanValue;
            return cleanValue;
        }

        const number = Number(cleanValue);

        const isValid =
            number <= max &&
            (allowZero ? number >= 0 : number >= 1);

        if (!isValid) {
            return lastValidValue;
        }

        lastValidValue = cleanValue;
        return cleanValue;
    }

    input.addEventListener("input", () => {
        input.value = validateValue(input.value);
    });

    input.addEventListener("paste", event => {
        event.preventDefault();

        const pastedText = (event.clipboardData || window.clipboardData)
            .getData("text");

        input.value = validateValue(pastedText);
    });

    input.addEventListener("keydown", event => {
        const allowedKeys = [
            "Backspace", "Delete", "Tab", "ArrowLeft",
            "ArrowRight", "Home", "End", "Enter"
        ];

        if (
            allowedKeys.includes(event.key) ||
            event.ctrlKey ||
            event.metaKey
        ) {
            return;
        }

        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }
    });
}

attachTimeValidation(taskHourInput, 12, false);
attachTimeValidation(taskMinuteInput, 59, true);
attachTimeValidation(editTaskHourInput, 12, false);
attachTimeValidation(editTaskMinuteInput, 59, true);

function setDateInputMin(input) {
    if (!input) return;

    const now = new Date();
    input.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

setDateInputMin(taskDateInput);
setDateInputMin(editTaskDateInput);

/* EDIT TASK */
const editModalHome = editModal.parentElement;

function openEditModal(task, index, taskElement) {
    editingIndex = index;

    // Move the edit panel immediately before the selected task.
    taskElement.before(editModal);

    editModal.classList.remove("hidden");
    editModal.style.display = "block";
    editModal.style.position = "static";
    editModal.style.width = "100%";
    editModal.style.height = "auto";
    editModal.style.padding = "0";
    editModal.style.margin = "0 0 14px";
    editModal.style.background = "transparent";

    const modalContent = editModal.querySelector(".modal-content");
    modalContent.style.width = "100%";
    modalContent.style.margin = "0";

    editTaskInput.value = task.text || "";
    editTaskDateInput.value = task.date || "";

    const parsedTime = parseTaskTime(task.time);
    editTaskHourInput.value = parsedTime.hour || "";
    editTaskMinuteInput.value = parsedTime.minute || "";
    editTaskPeriod.value = parsedTime.period || "";
    editTaskPriority.value = task.priority || "Medium";

    editTaskInput.focus();
}

function closeEditModal() {
    editModal.classList.add("hidden");
    editModal.removeAttribute("style");

    const modalContent = editModal.querySelector(".modal-content");
    modalContent.removeAttribute("style");

    // Return the hidden panel to its original place.
    editModalHome.appendChild(editModal);

    editingIndex = null;
}
function saveEditedTask(event) {
    event.preventDefault();

    if (editingIndex === null || !tasks[editingIndex]) return;

    try {
        const updatedTask = validateAndBuildTask(
            editTaskInput.value.trim(),
            editTaskDateInput.value,
            editTaskHourInput.value.trim(),
            editTaskMinuteInput.value.trim(),
            editTaskPeriod.value,
            editTaskPriority.value,
            true
        );

        Object.assign(tasks[editingIndex], updatedTask);
        delete tasks[editingIndex].missed;

        saveTasks();
        closeEditModal();
        renderTasks();
        updateStats();
    } catch (error) {
        alert(error.message);
    }
}

editTaskForm.addEventListener("submit", saveEditedTask);
cancelEditBtn.addEventListener("click", closeEditModal);

editModal.addEventListener("click", event => {
    if (event.target === editModal) {
        closeEditModal();
    }
});

/* ADD TASK */
function addTask() {
    try {
        const newTask = validateAndBuildTask(
            document.getElementById("taskInput").value.trim(),
            document.getElementById("taskDate").value,
            document.getElementById("taskHour").value.trim(),
            document.getElementById("taskMinute").value.trim(),
            document.getElementById("taskPeriod").value,
            document.getElementById("taskPriority").value
        );

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

/* RENDER TASKS */
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
        if (a.date !== b.date) return (a.date || "").localeCompare(b.date || "");

        if (Boolean(a.completed) !== Boolean(b.completed)) {
            return Number(a.completed) - Number(b.completed);
        }

        return convertTo24Hour(a.time).localeCompare(convertTo24Hour(b.time));
    });

    sortedTasks.forEach(task => {
        const originalIndex = tasks.indexOf(task);

        const li = document.createElement("li");
        li.className = "task-item";

        if (task.completed) li.classList.add("completed-task");
        if (task.missed) li.classList.add("missed-task");

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.text || "Untitled Task";

        if (task.completed) title.classList.add("completed");

        const meta = document.createElement("div");
        meta.className = "task-meta";
        meta.textContent = `📅 ${task.date || "-"} | 🕒 ${task.time || "-"}`;

        const priority = document.createElement("span");
        const priorityValue = task.priority || "Medium";
        priority.className = `priority-badge priority-${priorityValue.toLowerCase()}`;
        priority.textContent = priorityValue;

        const status = document.createElement("span");
        status.className = "status-badge";
        status.textContent = task.completed ? "Completed" : task.missed ? "Missed" : "Pending";

        details.append(title, meta, priority, status);

        if (isTaskDueSoon(task)) {
            const dueSoon = document.createElement("span");
            dueSoon.className = "due-soon-badge";
            dueSoon.textContent = "Due Soon";
            details.appendChild(dueSoon);
        }

        const actions = document.createElement("div");
        actions.className = "actions";

        if (!task.completed) {
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.className = "edit-btn";
            editBtn.onclick = () => openEditModal(task, originalIndex, li);

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

            actions.append(editBtn, completeBtn, deleteBtn);
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
            removeBtn.textContent = "Delete";
            removeBtn.className = "delete-btn";
            removeBtn.onclick = () => {
                tasks.splice(originalIndex, 1);
                saveTasks();
                renderTasks();
                updateStats();
            };

            actions.append(undoBtn, removeBtn);
        }

        li.append(details, actions);

        const formattedDate = new Date(task.date || today).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        if (task.date === today) {
            todayList.appendChild(li);
        } else if (task.date > today) {
            if (!upcomingGroups[formattedDate]) {
                const heading = document.createElement("h3");
                heading.className = "date-header";
                heading.textContent = formattedDate;

                const list = document.createElement("ul");
                list.className = "date-group";

                upcomingGroups[formattedDate] = list;
                upcomingList.append(heading, list);
            }

            upcomingGroups[formattedDate].appendChild(li);
        } else {
            if (!pastGroups[formattedDate]) {
                const heading = document.createElement("h3");
                heading.className = "date-header";
                heading.textContent = formattedDate;

                const list = document.createElement("ul");
                list.className = "date-group";

                pastGroups[formattedDate] = list;
                pastList.append(heading, list);
            }

            pastGroups[formattedDate].appendChild(li);
        }
    });
}

/* DARK MODE */
function applyTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const isDark = localStorage.getItem("theme") === "dark";

    document.body.classList.toggle("dark", isDark);
    themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

applyTheme();

document.getElementById("themeToggle").addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");

    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("themeToggle").textContent =
        isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
});

renderTasks();
updateStats();