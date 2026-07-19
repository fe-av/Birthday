const screens = [...document.querySelectorAll("[data-screen]")];
const teamInline = [...document.querySelectorAll("[data-team-inline]")];
const letterBank = document.querySelector("[data-letter-bank]");
const profileGrid = document.querySelector("[data-profile-grid]");
const cafeChoices = document.querySelector("[data-cafe-choices]");
const cafeTray = document.querySelector("[data-cafe-tray]");
const selfieUpload = document.querySelector("[data-selfie-upload]");
const selfiePreview = document.querySelector("[data-selfie-preview]");

let teamName = "your team";
let selfieReady = false;

const workplaceLetters = "FORELLELSESSER".split("");
const cafeOrder = ["Coffee", "Cake", "Celebration"];
const cafeOptions = ["Confetti", "Coffee", "Cake", "Structural Drawings", "Celebration", "Mystery Sandwich"];
const profileOptions = [
  {
    name: "Aarav Venkat",
    title: "Analytics wizard seeking quiet spreadsheets",
    correct: false,
  },
  {
    name: "Abhishek Vijayan",
    title: "Structural designer, birthday main character, clue collector",
    correct: true,
  },
  {
    name: "Anika Verma",
    title: "Travel photographer with suspiciously perfect lighting",
    correct: false,
  },
  {
    name: "Aiden Varghese",
    title: "Coffee reviewer and professional meeting accepter",
    correct: false,
  },
];

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

function renderProfiles() {
  profileGrid.innerHTML = "";
  profileOptions.forEach((profile) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "profile-card";
    button.innerHTML = `<strong>${profile.name}</strong><span>${profile.title}</span>`;
    button.addEventListener("click", () => {
      const feedback = document.querySelector("[data-level-four-feedback]");
      if (profile.correct) {
        setFeedback(feedback, "Connection accepted. The portal respects this choice.", true);
        window.setTimeout(() => showScreen("level-5"), 800);
        return;
      }
      setFeedback(feedback, "Connection request ignored. Read the clue like a recruiter with coffee.", false);
    });
    profileGrid.append(button);
  });
}

function renderCafeChoices() {
  cafeChoices.innerHTML = "";
  cafeTray.innerHTML = "";
  cafeOptions.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-card";
    button.textContent = choice;
    button.addEventListener("click", () => {
      const trayItem = document.createElement("button");
      trayItem.type = "button";
      trayItem.className = "choice-card";
      trayItem.textContent = choice;
      trayItem.addEventListener("click", () => trayItem.remove());
      cafeTray.append(trayItem);
    });
    cafeChoices.append(button);
  });
}

document.querySelector("[data-team-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = document.querySelector("[data-team-feedback]");
  updateTeamName(event.currentTarget.teamNames.value);
  setFeedback(feedback, `${teamName}, your quest party is registered.`, true);
  window.setTimeout(() => showScreen("level-1"), 700);
});

document.querySelector("[data-level-one-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = normalizeDate(event.currentTarget.birthday.value);
  const feedback = document.querySelector("[data-level-one-feedback]");

  if (answer === "27072002" || answer === "07272002" || answer === "27200207") {
    setFeedback(feedback, "Correct. The cake calendar has accepted your offering.", true);
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
    setFeedback(feedback, "Correct. The passport stamp flashes dramatically.", true);
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
    setFeedback(feedback, "Correct. The office arc is unlocked.", true);
    window.setTimeout(() => showScreen("level-4"), 800);
    return;
  }

  setFeedback(feedback, "The letters are close, but the company name is still scrambled.", false);
});

document.querySelector("[data-reset-cafe]").addEventListener("click", () => {
  cafeTray.innerHTML = "";
  document.querySelector("[data-level-five-feedback]").textContent = "";
});

document.querySelector("[data-check-cafe]").addEventListener("click", () => {
  const selected = [...cafeTray.children].map((item) => item.textContent);
  const feedback = document.querySelector("[data-level-five-feedback]");
  const correct = selected.length === cafeOrder.length && selected.every((item, index) => item === cafeOrder[index]);

  if (correct) {
    setFeedback(feedback, `${teamName} and Abhi have secured the birthday cafe order.`, true);
    window.setTimeout(() => showScreen("level-6"), 800);
    return;
  }

  setFeedback(feedback, "Wrong order. The barista demands coffee, cake, then celebration.", false);
});

selfieUpload.addEventListener("change", () => {
  const file = selfieUpload.files[0];
  const feedback = document.querySelector("[data-level-six-feedback]");

  if (!file) {
    selfieReady = false;
    selfiePreview.classList.remove("visible");
    return;
  }

  selfieReady = true;
  selfiePreview.src = URL.createObjectURL(file);
  selfiePreview.classList.add("visible");
  setFeedback(feedback, "Selfie received. Confirm it to unlock the final boss.", true);
});

document.querySelector("[data-confirm-selfie]").addEventListener("click", () => {
  const feedback = document.querySelector("[data-level-six-feedback]");

  if (!selfieReady) {
    setFeedback(feedback, "Upload the selfie first. The story needs proof.", false);
    return;
  }

  setFeedback(feedback, "Selfie proof accepted.", true);
  window.setTimeout(() => showScreen("level-7"), 800);
});

document.querySelector("[data-finish-game]").addEventListener("click", () => {
  const feedback = document.querySelector("[data-level-seven-feedback]");
  setFeedback(feedback, "Oath accepted. Victory is loading.", true);
  window.setTimeout(() => showScreen("victory"), 900);
});

document.querySelector("[data-restart]").addEventListener("click", () => {
  document.querySelectorAll("form").forEach((form) => form.reset());
  document.querySelectorAll(".feedback").forEach((item) => {
    item.textContent = "";
    item.className = "feedback";
  });
  selfieReady = false;
  selfiePreview.removeAttribute("src");
  selfiePreview.classList.remove("visible");
  updateTeamName("");
  renderCafeChoices();
  showScreen("intro");
});

renderLetters();
renderProfiles();
renderCafeChoices();
