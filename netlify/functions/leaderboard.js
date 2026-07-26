const REPO_OWNER = "fe-av";
const REPO_NAME = "Birthday";
const BRANCH = "main";
const LEADERBOARD_PATH = "leaderboard/progress.json";

const responseHeaders = {
  "Content-Type": "application/json",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: responseHeaders,
    body: JSON.stringify(body),
  };
}

function sanitizeText(value, fallback) {
  const clean = String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);
  return clean || fallback;
}

function sanitizePlayerId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);
}

async function githubRequest(path, options = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Server is missing GITHUB_TOKEN.");
  }

  return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "birthday-quest-leaderboard",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
}

async function readLeaderboard() {
  const response = await githubRequest(`/contents/${LEADERBOARD_PATH}?ref=${BRANCH}`);

  if (response.status === 404) {
    return { sha: null, entries: {} };
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Could not read leaderboard.");
  }

  const content = Buffer.from(result.content || "", "base64").toString("utf8");
  const parsed = content ? JSON.parse(content) : { entries: {} };
  return {
    sha: result.sha,
    entries: parsed.entries || {},
  };
}

async function writeLeaderboard(state, sha, message) {
  const body = {
    message,
    content: Buffer.from(JSON.stringify({ entries: state.entries }, null, 2)).toString("base64"),
    branch: BRANCH,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await githubRequest(`/contents/${LEADERBOARD_PATH}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.message || "Could not write leaderboard.");
    error.status = response.status;
    throw error;
  }
}

function publicEntries(entries) {
  return Object.values(entries)
    .sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.elapsedSeconds - b.elapsedSeconds;
    })
    .map((entry) => ({
      teamName: entry.teamName,
      level: entry.level,
      levelName: entry.levelName,
      elapsedSeconds: entry.elapsedSeconds,
      status: entry.status,
      selfieUploaded: Boolean(entry.selfieUploaded),
      updatedAt: entry.updatedAt,
    }));
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const state = await readLeaderboard();
      return json(200, { ok: true, entries: publicEntries(state.entries), updatedAt: new Date().toISOString() });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { ok: false, error: "Method not allowed." });
    }

    const payload = JSON.parse(event.body || "{}");
    const playerId = sanitizePlayerId(payload.playerId);
    if (!playerId) {
      return json(400, { ok: false, error: "Missing player id." });
    }

    const level = Math.max(0, Math.min(7, Number.parseInt(payload.level, 10) || 0));
    const elapsedSeconds = Math.max(0, Number.parseInt(payload.elapsedSeconds, 10) || 0);
    const now = new Date().toISOString();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const state = await readLeaderboard();
      const previous = state.entries[playerId] || {};
      const entry = {
        playerId,
        teamName: sanitizeText(payload.teamName, previous.teamName || "Unnamed team"),
        level: Math.max(level, previous.level || 0),
        levelName: sanitizeText(payload.levelName, previous.levelName || "Registered"),
        elapsedSeconds,
        status: sanitizeText(payload.status, previous.status || "Playing"),
        selfieUploaded: Boolean(payload.selfieUploaded || previous.selfieUploaded),
        startedAt: previous.startedAt || payload.startedAt || now,
        updatedAt: now,
      };

      if (entry.level >= 7 && entry.status !== "Finished") {
        entry.status = "Final lock";
      }

      state.entries[playerId] = entry;

      try {
        await writeLeaderboard(state, state.sha, `Update birthday leaderboard for ${entry.teamName}`);
        return json(200, { ok: true, entry });
      } catch (error) {
        if (error.status !== 409 || attempt === 2) {
          throw error;
        }
      }
    }

    return json(500, { ok: false, error: "Leaderboard update conflict." });
  } catch (error) {
    return json(500, { ok: false, error: error.message || "Leaderboard failed." });
  }
};
