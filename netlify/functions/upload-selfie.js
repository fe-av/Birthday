const REPO_OWNER = "fe-av";
const REPO_NAME = "Birthday";
const BRANCH = "main";
const MAX_FILE_SIZE = 6 * 1024 * 1024;

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

function sanitizeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "team";
}

function extensionFromMime(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function parseMultipart(event) {
  const contentType = event.headers["content-type"] || event.headers["Content-Type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw new Error("Missing multipart boundary.");
  }

  const boundary = `--${boundaryMatch[1] || boundaryMatch[2]}`;
  const body = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
  const parts = body.toString("binary").split(boundary).slice(1, -1);
  const fields = {};
  let file = null;

  for (const part of parts) {
    const cleanPart = part.replace(/^\r\n/, "").replace(/\r\n$/, "");
    const headerEnd = cleanPart.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const rawHeaders = cleanPart.slice(0, headerEnd);
    const rawContent = cleanPart.slice(headerEnd + 4);
    const nameMatch = rawHeaders.match(/name="([^"]+)"/);
    const filenameMatch = rawHeaders.match(/filename="([^"]*)"/);
    const typeMatch = rawHeaders.match(/Content-Type:\s*([^\r\n]+)/i);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const content = Buffer.from(rawContent, "binary");

    if (filenameMatch && filenameMatch[1]) {
      file = {
        fieldName: name,
        filename: filenameMatch[1],
        mimeType: typeMatch ? typeMatch[1].trim() : "application/octet-stream",
        content,
      };
    } else {
      fields[name] = content.toString("utf8");
    }
  }

  return { fields, file };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed." });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return json(500, { ok: false, error: "Server is missing GITHUB_TOKEN." });
  }

  let parsed;
  try {
    parsed = parseMultipart(event);
  } catch (error) {
    return json(400, { ok: false, error: error.message });
  }

  const { fields, file } = parsed;
  if (!file) {
    return json(400, { ok: false, error: "No selfie file received." });
  }

  if (!file.mimeType.startsWith("image/")) {
    return json(400, { ok: false, error: "Upload must be an image." });
  }

  if (file.content.length > MAX_FILE_SIZE) {
    return json(400, { ok: false, error: "Image is too large. Keep it under 6 MB." });
  }

  const teamSlug = sanitizeName(fields.teamName || "team");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const extension = extensionFromMime(file.mimeType);
  const repoPath = `selfies/${teamSlug}-${timestamp}.${extension}`;
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${repoPath}`;

  const githubResponse = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "birthday-quest-selfie-uploader",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      message: `Add selfie proof for ${fields.teamName || "team"}`,
      content: file.content.toString("base64"),
      branch: BRANCH,
    }),
  });

  const githubResult = await githubResponse.json();
  if (!githubResponse.ok) {
    return json(500, {
      ok: false,
      error: githubResult.message || "GitHub upload failed.",
    });
  }

  return json(200, {
    ok: true,
    path: repoPath,
    url: githubResult.content && githubResult.content.html_url,
  });
};
