const API_BASE_URL = "https://abhi.vijayan-62b.workers.dev";
const SLIDE_DURATION_MS = 5200;
const REFRESH_DURATION_MS = 12000;

const bg = document.querySelector("[data-showcase-bg]");
const image = document.querySelector("[data-showcase-image]");
const title = document.querySelector("[data-showcase-title]");
const subtitle = document.querySelector("[data-showcase-subtitle]");
const team = document.querySelector("[data-showcase-team]");
const meta = document.querySelector("[data-showcase-meta]");
const feedback = document.querySelector("[data-showcase-feedback]");
const prevButton = document.querySelector("[data-showcase-prev]");
const nextButton = document.querySelector("[data-showcase-next]");
const toggleButton = document.querySelector("[data-showcase-toggle]");

let slides = [];
let activeIndex = 0;
let isPlaying = true;
let slideTimer;

function formatUpdatedAt(value) {
  if (!value) return "recently";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function validSelfieEntries(entries) {
  return entries
    .filter((entry) => entry.selfieUploaded && entry.selfieUrl)
    .map((entry) => ({
      teamName: entry.teamName || "Birthday crew",
      selfieUrl: entry.selfieUrl,
      level: entry.level || 0,
      status: entry.status || "Uploaded",
      updatedAt: entry.updatedAt,
    }));
}

function setEmptyState(message) {
  title.textContent = "Selfie Showcase";
  subtitle.textContent = message;
  team.textContent = "No selfie photos yet";
  meta.textContent = "Waiting for uploads";
  feedback.textContent = "Open the game, finish the selfie level, and uploaded photos will appear here.";
  image.removeAttribute("src");
  bg.style.backgroundImage = "";
}

function renderSlide(index) {
  if (!slides.length) {
    setEmptyState("Waiting for uploaded proof shots...");
    return;
  }

  activeIndex = (index + slides.length) % slides.length;
  const slide = slides[activeIndex];

  image.classList.remove("is-visible");
  window.setTimeout(() => {
    image.src = slide.selfieUrl;
    bg.style.backgroundImage = `url("${slide.selfieUrl}")`;
    title.textContent = "Selfie Showcase";
    subtitle.textContent = `Now featuring ${activeIndex + 1} of ${slides.length}`;
    team.textContent = slide.teamName;
    meta.textContent = `${slide.status} • Level ${slide.level}/7 • ${formatUpdatedAt(slide.updatedAt)}`;
    feedback.textContent = "Live from the Birthday Quest archive.";
    image.classList.add("is-visible");
  }, 120);
}

function queueNextSlide() {
  window.clearTimeout(slideTimer);
  if (!isPlaying || slides.length <= 1) return;

  slideTimer = window.setTimeout(() => {
    renderSlide(activeIndex + 1);
    queueNextSlide();
  }, SLIDE_DURATION_MS);
}

function showPreviousSlide() {
  renderSlide(activeIndex - 1);
  queueNextSlide();
}

function showNextSlide() {
  renderSlide(activeIndex + 1);
  queueNextSlide();
}

function togglePlayback() {
  isPlaying = !isPlaying;
  toggleButton.textContent = isPlaying ? "Pause" : "Play";
  queueNextSlide();
}

async function loadShowcase() {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`, {
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Could not load showcase.");
    }

    const nextSlides = validSelfieEntries(result.entries);
    const currentUrl = slides[activeIndex] && slides[activeIndex].selfieUrl;
    slides = nextSlides;

    if (!slides.length) {
      setEmptyState("Selfies will appear here automatically after upload.");
      return;
    }

    const preservedIndex = slides.findIndex((slide) => slide.selfieUrl === currentUrl);
    renderSlide(preservedIndex >= 0 ? preservedIndex : activeIndex);
    queueNextSlide();
  } catch (error) {
    feedback.textContent = `Showcase error: ${error.message}`;
  }
}

prevButton.addEventListener("click", showPreviousSlide);
nextButton.addEventListener("click", showNextSlide);
toggleButton.addEventListener("click", togglePlayback);

loadShowcase();
window.setInterval(loadShowcase, REFRESH_DURATION_MS);
