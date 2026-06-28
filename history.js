let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function renderHistory() {

    const container =
        document.getElementById("historyContainer");

    const searchText =
        document.getElementById("searchInput")
        .value
        .toLowerCase();

    const filterValue =
        document.getElementById("filterDays")
        .value;

    let filteredTasks = [...tasks];

    // SEARCH

    if(searchText !== ""){

        filteredTasks = filteredTasks.filter(task =>
            task.text
            .toLowerCase()
            .includes(searchText)
        );
    }

    // DATE FILTER

    if(filterValue !== "all"){

        const days = parseInt(filterValue);

        const today = new Date();

        filteredTasks = filteredTasks.filter(task => {

            const taskDate =
                new Date(task.date);

            const diffDays =
                (today - taskDate) /
                (1000 * 60 * 60 * 24);

            return diffDays <= days;
        });
    }

    // SHOW ONLY COMPLETED OR PAST TASKS

    const today =
        new Date().toISOString().split("T")[0];

    filteredTasks = filteredTasks.filter(task =>
        task.completed || task.date < today
    );

    // SORT

    filteredTasks.sort((a,b)=>{

        if(a.date !== b.date){
            return b.date.localeCompare(a.date);
        }

        return a.time.localeCompare(b.time);
    });

    container.innerHTML = "";

    if(filteredTasks.length === 0){

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
            .toLocaleDateString("en-IN",{
                day:"numeric",
                month:"short",
                year:"numeric"
            });

        if(!groups[formattedDate]){

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
            `🕒 ${task.time}`;

        const priority =
            document.createElement("span");

        priority.className =
            `priority-badge priority-${task.priority.toLowerCase()}`;

        priority.textContent =
            task.priority;

        details.appendChild(title);
        details.appendChild(meta);
        details.appendChild(priority);

        const status =
            document.createElement("strong");

        status.textContent =
            task.completed ? "✓ Completed" : "Past Task";

        taskCard.appendChild(details);
        taskCard.appendChild(status);

        groups[formattedDate]
            .appendChild(taskCard);
    });
}

renderHistory();