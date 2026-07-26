const leaderboardBody = document.querySelector("[data-leaderboard-body]");
const feedback = document.querySelector("[data-dashboard-feedback]");
const totalTeams = document.querySelector("[data-total-teams]");
const finishedTeams = document.querySelector("[data-finished-teams]");
const leadingLevel = document.querySelector("[data-leading-level]");
const lastRefresh = document.querySelector("[data-last-refresh]");
const refreshButton = document.querySelector("[data-refresh-dashboard]");
const API_BASE_URL = "PASTE_CLOUDFLARE_WORKER_URL_HERE";
let adminCode = window.sessionStorage.getItem("birthdayQuestAdminCode") || "";

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSelfie(entry) {
  if (!entry.selfieUploaded) {
    return '<span class="selfie-state pending">Pending</span>';
  }

  if (!entry.selfieUrl) {
    return '<span class="selfie-state uploaded">Uploaded</span>';
  }

  const safeUrl = escapeHtml(entry.selfieUrl);
  const safeName = escapeHtml(entry.teamName);
  return `
    <a class="selfie-thumb-link" href="${safeUrl}" target="_blank" rel="noopener">
      <img class="leaderboard-selfie" src="${safeUrl}" alt="Selfie uploaded by ${safeName}">
      <span>View</span>
    </a>
  `;
}

function renderEntries(entries) {
  totalTeams.textContent = entries.length;
  finishedTeams.textContent = entries.filter((entry) => entry.status === "Finished").length;
  leadingLevel.textContent = entries.length ? Math.max(...entries.map((entry) => entry.level)) : 0;
  lastRefresh.textContent = formatUpdatedAt(new Date().toISOString());

  if (!entries.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="8">Waiting for teams to start...</td></tr>';
    return;
  }

  leaderboardBody.innerHTML = entries
    .map((entry, index) => {
      const levelText = `${entry.level}/7 ${entry.levelName}`;
      return `
        <tr>
          <td><strong>#${index + 1}</strong></td>
          <td>${escapeHtml(entry.teamName)}</td>
          <td>${escapeHtml(levelText)}</td>
          <td><span class="status-pill">${escapeHtml(entry.status)}</span></td>
          <td>${formatDuration(entry.elapsedSeconds)}</td>
          <td>${renderSelfie(entry)}</td>
          <td>${formatUpdatedAt(entry.updatedAt)}</td>
          <td>
            <button type="button" class="delete-player" data-delete-player="${escapeHtml(entry.playerId)}" data-team-name="${escapeHtml(entry.teamName)}">
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`, {
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

async function deletePlayer(playerId, teamName) {
  if (!adminCode) {
    adminCode = window.prompt("Enter leaderboard admin code:") || "";
    if (adminCode) {
      window.sessionStorage.setItem("birthdayQuestAdminCode", adminCode);
    }
  }

  if (!adminCode) return;

  const confirmed = window.confirm(`Delete ${teamName || "this player"} from the leaderboard?`);
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playerId, adminCode }),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      if (response.status === 403) {
        adminCode = "";
        window.sessionStorage.removeItem("birthdayQuestAdminCode");
      }
      throw new Error(result.error || "Could not delete player.");
    }

    feedback.textContent = "Player deleted.";
    feedback.className = "feedback good";
    loadDashboard();
  } catch (error) {
    feedback.textContent = `Delete failed: ${error.message}`;
    feedback.className = "feedback bad";
  }
}

leaderboardBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-player]");
  if (!button) return;
  deletePlayer(button.dataset.deletePlayer, button.dataset.teamName);
});

refreshButton.addEventListener("click", loadDashboard);
loadDashboard();
window.setInterval(loadDashboard, 4000);
