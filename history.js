let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function toggleDatePicker() {

    const filter =
        document.getElementById("dateFilter").value;

    const picker =
        document.getElementById("customDate");

    picker.style.display =
        filter === "specific"
        ? "block"
        : "none";
}

function renderHistory() {

    const container =
        document.getElementById("historyContainer");

    const searchText =
        document.getElementById("searchInput")
        .value
        .toLowerCase();

    const dateFilter =
        document.getElementById("dateFilter")
        .value;

    const priorityFilter =
        document.getElementById("priorityFilter")
        .value;

    const statusFilter =
        document.getElementById("statusFilter")
        .value;

    const sortFilter =
        document.getElementById("sortFilter")
        .value;

    let filteredTasks = [...tasks];

    const today =
        new Date().toISOString().split("T")[0];

    /* SEARCH */

    if (searchText !== "") {

        filteredTasks = filteredTasks.filter(task => {

            const taskText =
                (task.text || "")
                .toLowerCase();

            return taskText.includes(searchText);
        });
    }

    /* HISTORY TASKS ONLY */

    filteredTasks = filteredTasks.filter(task =>
        task.completed || task.date < today
    );

    /* DATE FILTER */

    if (dateFilter === "today") {

        filteredTasks = filteredTasks.filter(task =>
            task.date === today
        );

    }
    else if (dateFilter === "specific") {

        const selectedDate =
            document.getElementById("customDate").value;

        if (selectedDate) {

            filteredTasks = filteredTasks.filter(task =>
                task.date === selectedDate
            );
        }
    }
    else if (dateFilter !== "all") {

        const days =
            parseInt(dateFilter);

        const currentDate =
            new Date();

        filteredTasks = filteredTasks.filter(task => {

            const taskDate =
                new Date(task.date);

            const diffDays =
                (currentDate - taskDate) /
                (1000 * 60 * 60 * 24);

            return diffDays <= days;
        });
    }

    /* PRIORITY FILTER */

    if (priorityFilter !== "all") {

        filteredTasks = filteredTasks.filter(task =>
            task.priority === priorityFilter
        );
    }

    /* STATUS FILTER */

    if (statusFilter === "completed") {

        filteredTasks = filteredTasks.filter(task =>
            task.completed
        );

    }
    else if (statusFilter === "past") {

        filteredTasks = filteredTasks.filter(task =>
            !task.completed && task.date < today
        );
    }

    /* SORT */

    const priorityOrder = {
        High: 3,
        Medium: 2,
        Low: 1
    };

    if (sortFilter === "newest") {

        filteredTasks.sort((a, b) => {

            if (a.date !== b.date) {
                return new Date(b.date) - new Date(a.date);
            }

            return b.time.localeCompare(a.time);
        });

    }
    else if (sortFilter === "oldest") {

        filteredTasks.sort((a, b) => {

            if (a.date !== b.date) {
                return new Date(a.date) - new Date(b.date);
            }

            return a.time.localeCompare(b.time);
        });

    }
    else if (sortFilter === "high") {

        filteredTasks.sort((a, b) =>
            priorityOrder[b.priority] -
            priorityOrder[a.priority]
        );

    }
    else if (sortFilter === "low") {

        filteredTasks.sort((a, b) =>
            priorityOrder[a.priority] -
            priorityOrder[b.priority]
        );
    }

    container.innerHTML = "";

    if (filteredTasks.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                No matching tasks found
            </div>
        `;

        return;
    }

    const groups = {};

    filteredTasks.forEach(task => {

        const formattedDate =
            new Date(task.date)
            .toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

        if (!groups[formattedDate]) {

            const section =
                document.createElement("div");

            section.className =
                "history-group";

            const heading =
                document.createElement("h3");

            heading.className =
                "date-header";

            heading.textContent =
                formattedDate;

            const list =
                document.createElement("div");

            section.appendChild(heading);
            section.appendChild(list);

            groups[formattedDate] = list;

            container.appendChild(section);
        }

        const taskCard =
            document.createElement("div");

        taskCard.className =
            "history-task";

        const details =
            document.createElement("div");

        details.className =
            "history-details";

        const title =
            document.createElement("div");

        title.className =
            "history-title";

        title.textContent =
            task.text;

        const meta =
            document.createElement("div");

        meta.className =
            "history-meta";

        meta.textContent =
            `📅 ${formattedDate} | 🕒 ${task.time}`;

        const priority =
            document.createElement("span");

        priority.className =
            `priority-badge priority-${task.priority.toLowerCase()}`;

        priority.textContent =
            `${task.priority} Priority`;

        details.appendChild(title);
        details.appendChild(meta);
        details.appendChild(priority);

        const status =
            document.createElement("strong");

        status.textContent =
            task.completed
                ? "✓ Completed"
                : "Past Task";

        taskCard.appendChild(details);
        taskCard.appendChild(status);

        groups[formattedDate]
            .appendChild(taskCard);
    });
}

toggleDatePicker();
renderHistory();
/* DARK MODE */

const themeToggle =
    document.getElementById("themeToggle");

if(localStorage.getItem("theme")==="dark"){
    document.body.classList.add("dark");
}

if(themeToggle){

    themeToggle.addEventListener("click",()=>{

        document.body.classList.toggle("dark");

        localStorage.setItem(
            "theme",
            document.body.classList.contains("dark")
                ? "dark"
                : "light"
        );
    });
}