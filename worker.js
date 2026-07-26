const REPO_OWNER = "fe-av";
const REPO_NAME = "Birthday";
const BRANCH = "main";
const LEADERBOARD_PATH = "leaderboard/progress.json";
const MAX_FILE_SIZE = 6 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function sanitizeText(value, fallback) {
  const clean = String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 80);
  return clean || fallback;
}

function sanitizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "team";
}

function sanitizePlayerId(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);
}

function sanitizeUrl(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";

  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== "https:") return "";
    if (!["github.com", "raw.githubusercontent.com"].includes(parsed.hostname)) return "";
    return parsed.toString();
  } catch (error) {
    return "";
  }
}

function extensionFromMime(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function base64ToText(value) {
  return decodeURIComponent(
    [...atob(String(value || "").replace(/\n/g, ""))]
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("")
  );
}

async function githubRequest(env, path, options = {}) {
  if (!env.GITHUB_TOKEN) {
    throw new Error("Worker is missing GITHUB_TOKEN.");
  }

  return fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "birthday-quest-cloudflare-worker",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });
}

async function readLeaderboard(env) {
  const response = await githubRequest(env, `/contents/${LEADERBOARD_PATH}?ref=${BRANCH}`);

  if (response.status === 404) {
    return { sha: null, entries: {} };
  }

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Could not read leaderboard.");
  }

  const parsed = result.content ? JSON.parse(base64ToText(result.content)) : { entries: {} };
  return {
    sha: result.sha,
    entries: parsed.entries || {},
  };
}

async function writeLeaderboard(env, state, sha, message) {
  const content = bytesToBase64(new TextEncoder().encode(JSON.stringify({ entries: state.entries }, null, 2)));
  const body = {
    message,
    content,
    branch: BRANCH,
  };

  if (sha) body.sha = sha;

  const response = await githubRequest(env, `/contents/${LEADERBOARD_PATH}`, {
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
      selfieUrl: entry.selfieUrl || "",
      updatedAt: entry.updatedAt,
      playerId: entry.playerId,
    }));
}

function requireAdminCode(env, payload) {
  if (!env.LEADERBOARD_ADMIN_CODE) {
    const error = new Error("Worker is missing LEADERBOARD_ADMIN_CODE.");
    error.statusCode = 500;
    throw error;
  }

  if (String(payload.adminCode || "") !== env.LEADERBOARD_ADMIN_CODE) {
    const error = new Error("Invalid admin code.");
    error.statusCode = 403;
    throw error;
  }
}

async function handleLeaderboard(request, env) {
  if (request.method === "GET") {
    const state = await readLeaderboard(env);
    return json({ ok: true, entries: publicEntries(state.entries), updatedAt: new Date().toISOString() });
  }

  async function deletePlayer(payload) {
    requireAdminCode(env, payload);

    const playerId = sanitizePlayerId(payload.playerId);
    if (!playerId) return json({ ok: false, error: "Missing player id." }, 400);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const state = await readLeaderboard(env);
      const deletedEntry = state.entries[playerId];
      delete state.entries[playerId];

      try {
        await writeLeaderboard(env, state, state.sha, `Delete birthday leaderboard entry ${deletedEntry ? deletedEntry.teamName : playerId}`);
        return json({ ok: true });
      } catch (error) {
        if (error.status !== 409 || attempt === 2) throw error;
      }
    }
  }

  if (request.method === "DELETE") {
    const payload = await request.json();
    return deletePlayer(payload);
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const payload = await request.json();
  if (payload.action === "delete") {
    return deletePlayer(payload);
  }

  const playerId = sanitizePlayerId(payload.playerId);
  if (!playerId) return json({ ok: false, error: "Missing player id." }, 400);

  const level = Math.max(0, Math.min(7, Number.parseInt(payload.level, 10) || 0));
  const elapsedSeconds = Math.max(0, Number.parseInt(payload.elapsedSeconds, 10) || 0);
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const state = await readLeaderboard(env);
    const previous = state.entries[playerId] || {};
    const entry = {
      playerId,
      teamName: sanitizeText(payload.teamName, previous.teamName || "Unnamed team"),
      level: Math.max(level, previous.level || 0),
      levelName: sanitizeText(payload.levelName, previous.levelName || "Registered"),
      elapsedSeconds,
      status: sanitizeText(payload.status, previous.status || "Playing"),
      selfieUploaded: Boolean(payload.selfieUploaded || previous.selfieUploaded),
      selfieUrl: sanitizeUrl(payload.selfieUrl) || previous.selfieUrl || "",
      startedAt: previous.startedAt || payload.startedAt || now,
      updatedAt: now,
    };

    if (entry.level >= 7 && entry.status !== "Finished") {
      entry.status = "Final lock";
    }

    state.entries[playerId] = entry;

    try {
      await writeLeaderboard(env, state, state.sha, `Update birthday leaderboard for ${entry.teamName}`);
      return json({ ok: true, entry });
    } catch (error) {
      if (error.status !== 409 || attempt === 2) throw error;
    }
  }

  return json({ ok: false, error: "Leaderboard update conflict." }, 500);
}

async function handleSelfieUpload(request, env) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const formData = await request.formData();
  const file = formData.get("selfie");
  const teamName = String(formData.get("teamName") || "team");

  if (!(file instanceof File)) {
    return json({ ok: false, error: "No selfie file received." }, 400);
  }

  if (!file.type.startsWith("image/")) {
    return json({ ok: false, error: "Upload must be an image." }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return json({ ok: false, error: "Image is too large. Keep it under 6 MB." }, 400);
  }

  const teamSlug = sanitizeName(teamName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const extension = extensionFromMime(file.type);
  const repoPath = `selfies/${teamSlug}-${timestamp}.${extension}`;
  const content = bytesToBase64(new Uint8Array(await file.arrayBuffer()));

  const response = await githubRequest(env, `/contents/${repoPath}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `Add selfie proof for ${teamName || "team"}`,
      content,
      branch: BRANCH,
    }),
  });
  const result = await response.json();

  if (!response.ok) {
    return json({ ok: false, error: result.message || "GitHub upload failed." }, 500);
  }

  return json({
    ok: true,
    path: repoPath,
    url: result.content && result.content.html_url,
    rawUrl: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${repoPath}`,
  });
}

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      const { pathname } = new URL(request.url);
      if (pathname === "/leaderboard") return handleLeaderboard(request, env);
      if (pathname === "/upload-selfie") return handleSelfieUpload(request, env);

      return json({ ok: false, error: "Route not found." }, 404);
    } catch (error) {
      return json({ ok: false, error: error.message || "Worker failed." }, error.statusCode || 500);
    }
  },
};
