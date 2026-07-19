const screens = [...document.querySelectorAll("[data-screen]")];
const words = ["Abhi", "birthday", "quest", "unlocked"];
const correctSentence = "Abhi birthday quest unlocked";

let timerId = null;
let rollingValue = 0;

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === name);
  });
}

function setFeedback(element, message, isGood) {
  element.textContent = message;
  element.className = `feedback ${isGood ? "good" : "bad"}`;
}

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function renderWords() {
  const bank = document.querySelector("[data-word-bank]");
  const zone = document.querySelector("[data-drop-zone]");
  bank.innerHTML = "";
  zone.innerHTML = "";

  ["quest", "unlocked", "Abhi", "birthday"].forEach((word) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-chip";
    button.textContent = word;
    button.addEventListener("click", () => zone.append(button));
    bank.append(button);
  });
}

document.querySelector("[data-start]").addEventListener("click", () => {
  showScreen("level-1");
});

document.querySelector("[data-restart]").addEventListener("click", () => {
  document.querySelector("[data-level-one-form]").reset();
  document.querySelectorAll(".feedback").forEach((item) => {
    item.textContent = "";
    item.className = "feedback";
  });
  renderWords();
  rollingValue = 0;
  document.querySelector("[data-rolling-number]").textContent = "00";
  showScreen("intro");
});

document.querySelector("[data-level-one-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const answer = normalizeAnswer(event.currentTarget.country.value);
  const feedback = document.querySelector("[data-level-one-feedback]");

  if (answer === "france") {
    setFeedback(feedback, "Correct. Level 2 is unlocked.", true);
    window.setTimeout(() => showScreen("level-2"), 700);
    return;
  }

  setFeedback(feedback, "Try again. The hint is on Instagram.", false);
});

document.querySelector("[data-reset-words]").addEventListener("click", () => {
  renderWords();
  document.querySelector("[data-level-two-feedback]").textContent = "";
});

document.querySelector("[data-check-words]").addEventListener("click", () => {
  const selected = [...document.querySelector("[data-drop-zone]").children]
    .map((item) => item.textContent)
    .join(" ");
  const feedback = document.querySelector("[data-level-two-feedback]");

  if (selected === correctSentence) {
    setFeedback(feedback, "Nice. Final level unlocked.", true);
    window.setTimeout(() => showScreen("level-3"), 700);
    return;
  }

  setFeedback(feedback, "Try again. Make it read like a sentence.", false);
});

document.querySelector("[data-start-timer]").addEventListener("click", () => {
  const display = document.querySelector("[data-rolling-number]");
  const feedback = document.querySelector("[data-level-three-feedback]");
  feedback.textContent = "";
  window.clearInterval(timerId);
  timerId = window.setInterval(() => {
    rollingValue = (rollingValue + 1) % 40;
    display.textContent = String(rollingValue).padStart(2, "0");
  }, 85);
});

document.querySelector("[data-stop-timer]").addEventListener("click", () => {
  const feedback = document.querySelector("[data-level-three-feedback]");
  window.clearInterval(timerId);

  if (rollingValue === 23) {
    setFeedback(feedback, "Perfect stop. Final stage unlocked.", true);
    window.setTimeout(() => showScreen("finale"), 700);
    return;
  }

  setFeedback(feedback, `You stopped at ${rollingValue}. Try for 23.`, false);
});

renderWords();
