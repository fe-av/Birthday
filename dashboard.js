const leaderboardBody = document.querySelector("[data-leaderboard-body]");
const feedback = document.querySelector("[data-dashboard-feedback]");
const totalTeams = document.querySelector("[data-total-teams]");
const finishedTeams = document.querySelector("[data-finished-teams]");
const leadingLevel = document.querySelector("[data-leading-level]");
const lastRefresh = document.querySelector("[data-last-refresh]");
const refreshButton = document.querySelector("[data-refresh-dashboard]");

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatUpdatedAt(value) {
  if (!value) return "--";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function renderEntries(entries) {
  totalTeams.textContent = entries.length;
  finishedTeams.textContent = entries.filter((entry) => entry.status === "Finished").length;
  leadingLevel.textContent = entries.length ? Math.max(...entries.map((entry) => entry.level)) : 0;
  lastRefresh.textContent = formatUpdatedAt(new Date().toISOString());

  if (!entries.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="7">Waiting for teams to start...</td></tr>';
    return;
  }

  leaderboardBody.innerHTML = entries
    .map((entry, index) => {
      const levelText = `${entry.level}/7 ${entry.levelName}`;
      return `
        <tr>
          <td><strong>#${index + 1}</strong></td>
          <td>${entry.teamName}</td>
          <td>${levelText}</td>
          <td><span class="status-pill">${entry.status}</span></td>
          <td>${formatDuration(entry.elapsedSeconds)}</td>
          <td>${entry.selfieUploaded ? "Uploaded" : "Pending"}</td>
          <td>${formatUpdatedAt(entry.updatedAt)}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadDashboard() {
  try {
    const response = await fetch("/.netlify/functions/leaderboard", {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Could not load leaderboard.");
    }

    renderEntries(result.entries);
    feedback.textContent = "Dashboard is live.";
    feedback.className = "feedback good";
  } catch (error) {
    feedback.textContent = `Dashboard error: ${error.message}`;
    feedback.className = "feedback bad";
  }
}

refreshButton.addEventListener("click", loadDashboard);
loadDashboard();
window.setInterval(loadDashboard, 4000);
