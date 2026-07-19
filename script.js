const screens = [...document.querySelectorAll("[data-screen]")];
const teamInline = [...document.querySelectorAll("[data-team-inline]")];
const letterBank = document.querySelector("[data-letter-bank]");
const selfieUpload = document.querySelector("[data-selfie-upload]");
const selfiePreview = document.querySelector("[data-selfie-preview]");

let teamName = "your team";

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === name);
  });
}

function setFeedback(element, message, isGood) {
  element.textContent = message;
  element.className = `feedback ${isGood ? "good" : "bad"}`;
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeDate(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/july/g, "07")
    .replace(/jul/g, "07")
    .replace(/[^0-9]/g, "");
}

function updateTeamName(value) {
  const names = value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length === 0) {
    teamName = "your team";
  } else if (names.length === 1) {
    teamName = names[0];
  } else {
    teamName = `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  }

  teamInline.forEach((item) => {
    item.textContent = teamName;
  });
}

function renderLetters() {
  const shuffled = ["S", "E", "F", "L", "O", "R", "L", "E", "E", "S", "S", "E", "R", "L"];
  letterBank.innerHTML = "";
  shuffled.forEach((letter) => {
    const tile = document.createElement("div");
    tile.className = "letter-tile";
    tile.textContent = letter;
    letterBank.append(tile);
  });
}

document.querySelector("[data-team-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = document.querySelector("[data-team-feedback]");
  updateTeamName(event.currentTarget.teamNames.value);
  setFeedback(feedback, `${teamName}, your quest party is registered. The first page is turning.`, true);
  window.setTimeout(() => showScreen("level-1"), 700);
});

document.querySelector("[data-level-one-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = normalizeDate(event.currentTarget.birthday.value);
  const feedback = document.querySelector("[data-level-one-feedback]");

  if (answer === "27072002" || answer === "07272002") {
    setFeedback(feedback, "Origin Fragment recovered. The cake calendar stops glitching.", true);
    window.setTimeout(() => showScreen("level-2"), 800);
    return;
  }

  setFeedback(feedback, "Not it. Somewhere, Facebook is quietly judging this attempt.", false);
});

document.querySelector("[data-level-two-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = normalize(event.currentTarget.country.value);
  const feedback = document.querySelector("[data-level-two-feedback]");

  if (answer === "france") {
    setFeedback(feedback, "Passport Fragment recovered. The travel flashback is complete.", true);
    window.setTimeout(() => showScreen("level-3"), 800);
    return;
  }

  setFeedback(feedback, "Try again. The Instagram side quest has more evidence.", false);
});

document.querySelector("[data-level-three-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = normalize(event.currentTarget.workplace.value);
  const feedback = document.querySelector("[data-level-three-feedback]");

  if (answer === "forellelsesser") {
    setFeedback(feedback, "Work Fragment recovered. The letter forge cools down.", true);
    window.setTimeout(() => showScreen("level-4"), 800);
    return;
  }

  setFeedback(feedback, "The letters are close, but the company name is still scrambled.", false);
});

document.querySelector("[data-check-coordinates]").addEventListener("click", () => {
  const latitude = document.querySelector("#latitude-answer").value.trim();
  const longitude = document.querySelector("#longitude-answer").value.trim();
  const feedback = document.querySelector("[data-level-four-feedback]");
  const cleanLatitude = latitude.replace(/\s+/g, "");
  const cleanLongitude = longitude.replace(/\s+/g, "");

  if (cleanLatitude === "10.762" && cleanLongitude === "78.816") {
    setFeedback(feedback, "Campus Fragment recovered. The map folds into a concert ticket.", true);
    window.setTimeout(() => showScreen("level-5"), 800);
    return;
  }

  setFeedback(feedback, "Wrong coordinates. Keep the N and E, but fix the numbers.", false);
});

document.querySelector("[data-level-five-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = document.querySelector("[data-level-five-feedback]");
  const answer = normalize(event.currentTarget.artist.value);

  if (answer === "onedirection" || answer === "1direction") {
    setFeedback(feedback, "Concert Fragment recovered. The sound gate opens in one direction only.", true);
    window.setTimeout(() => showScreen("level-6"), 800);
    return;
  }

  setFeedback(feedback, "Nope. Listen again. The portal wants the band name.", false);
});

selfieUpload.addEventListener("change", () => {
  const file = selfieUpload.files[0];
  if (!file) {
    selfiePreview.removeAttribute("src");
    selfiePreview.classList.remove("visible");
    return;
  }

  selfiePreview.src = URL.createObjectURL(file);
  selfiePreview.classList.add("visible");
});

document.querySelector("[data-selfie-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = document.querySelector("[data-level-six-feedback]");
  const file = selfieUpload.files[0];

  if (!file) {
    setFeedback(feedback, "Choose a selfie first. The archive needs an actual image.", false);
    return;
  }

  const submitButton = event.currentTarget.querySelector("button");
  submitButton.disabled = true;
  submitButton.textContent = "Uploading...";
  setFeedback(feedback, "Uploading selfie proof into the quest archive...", true);

  const payload = new FormData();
  payload.append("selfie", file);
  payload.append("teamName", teamName);

  try {
    const response = await fetch("/.netlify/functions/upload-selfie", {
      method: "POST",
      body: payload,
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Upload failed.");
    }

    setFeedback(feedback, "Proof Fragment recovered. The selfie is saved in the quest archive.", true);
    window.setTimeout(() => showScreen("level-7"), 900);
  } catch (error) {
    setFeedback(feedback, `Upload failed: ${error.message}`, false);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Upload Selfie Proof";
  }
});

document.querySelector("[data-level-seven-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = document.querySelector("[data-level-seven-feedback]");
  const answer = event.currentTarget.code.value.trim();

  if (answer === "3600") {
    setFeedback(feedback, "Final Fragment recovered. The Birthday Core is unlocking.", true);
    window.setTimeout(() => showScreen("victory"), 900);
    return;
  }

  setFeedback(feedback, "Lock denied. Re-check the three clues and try the 4-digit code again.", false);
});

document.querySelector("[data-restart]").addEventListener("click", () => {
  document.querySelectorAll("form").forEach((form) => form.reset());
  document.querySelectorAll(".feedback").forEach((item) => {
    item.textContent = "";
    item.className = "feedback";
  });
  selfiePreview.removeAttribute("src");
  selfiePreview.classList.remove("visible");
  updateTeamName("");
  showScreen("intro");
});

renderLetters();
