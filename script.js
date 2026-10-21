const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  nav.classList.remove("open");
}
window.closeMenu = closeMenu;
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("open", open);
});
nav
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    closeMenu();
    menu.focus();
  }
});
window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});

// Native dialogs provide focus trapping, Escape support and accessible semantics.
let returnTarget;
document.addEventListener("click", (event) => {
  const button = event.target.closest(".project-open[data-modal]");
  if (!button) return;
  const dialog = document.getElementById(button.dataset.modal);
  if (!dialog?.showModal) return;
  returnTarget = button;
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add("dialog-open");
});
document.querySelectorAll(".project-dialog").forEach((dialog) => {
  dialog
    .querySelector(".modal-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    returnTarget?.focus({ preventScroll: true });
  });
});

const navLinks = [...nav.querySelectorAll("a")];
navLinks.forEach((link, index) => link.style.setProperty("--nav-index", index));
const sections = navLinks.map((link) => document.querySelector(link.hash));
const header = document.querySelector(".site-header");
let scrollFrame = 0;
function updateReadingPosition() {
  scrollFrame = 0;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const progress =
    maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
  header.style.setProperty("--reading-progress", progress);
  let active = 0;
  const readingLine = header.offsetHeight + Math.min(innerHeight * 0.25, 200);
  sections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= readingLine) active = index;
  });
  if (maxScroll > 0 && scrollY >= maxScroll - 2) active = sections.length - 1;
  navLinks.forEach((link, index) => {
    if (index === active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
function queueReadingPosition() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateReadingPosition);
}
window.queueReadingPosition = queueReadingPosition;
addEventListener("scroll", queueReadingPosition, { passive: true });
addEventListener("resize", queueReadingPosition);
addEventListener("load", queueReadingPosition);
document.addEventListener("toggle", queueReadingPosition, true);
updateReadingPosition();
