const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("#nav");
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  nav.classList.remove("open");
}
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

const filters = document.querySelectorAll("[data-filter]");
const projects = document.querySelectorAll(".project-row");
filters.forEach((button) =>
  button.addEventListener("click", () => {
    filters.forEach((filter) =>
      filter.setAttribute("aria-pressed", String(filter === button)),
    );
    let count = 0;
    projects.forEach((project) => {
      project.hidden =
        button.dataset.filter !== "all" &&
        project.dataset.category !== button.dataset.filter;
      if (!project.hidden) {
        if (!reducedMotion.matches) {
          project.getAnimations().forEach((animation) => animation.cancel());
          project.animate(
            [
              { opacity: 0, transform: "translateY(16px)" },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: 450,
              delay: count * 65,
              easing: "cubic-bezier(.2,.7,.2,1)",
              fill: "backwards",
            },
          );
        }
        count++;
      }
    });
    document.querySelector("#filter-status").textContent =
      `${count} projet${count > 1 ? "s" : ""} affiché${count > 1 ? "s" : ""}`;
  }),
);

// Native dialogs provide focus trapping, Escape support and accessible semantics.
document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.modal);
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add("dialog-open");
    dialog.addEventListener(
      "close",
      () => {
        document.body.classList.remove("dialog-open");
        button.focus({ preventScroll: true });
      },
      { once: true },
    );
  });
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
});

// Progressive enhancement: no hidden content without JS or with reduced motion.
const revealTargets = document.querySelectorAll(
  ".section-head, .section > h2, .section > .section-label, .project-row, .skill-column, .timeline article, .personal-grid > div, .interests article, .cv-section > *, .contact-grid > *",
);
let revealObserver;
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  revealTargets.forEach((element) => {
    const siblings = [...element.parentElement.children];
    element.style.setProperty(
      "--reveal-delay",
      `${Math.min(siblings.indexOf(element) * 65, 195)}ms`,
    );
    element.classList.add("reveal");
    revealObserver.observe(element);
  });
}
reducedMotion.addEventListener("change", (event) => {
  if (event.matches) {
    revealObserver?.disconnect();
    revealTargets.forEach((element) => element.classList.add("visible"));
    projects.forEach((project) =>
      project.getAnimations().forEach((animation) => animation.cancel()),
    );
  }
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
addEventListener("scroll", queueReadingPosition, { passive: true });
addEventListener("resize", queueReadingPosition);
addEventListener("load", queueReadingPosition);
document.addEventListener("toggle", queueReadingPosition, true);
filters.forEach((button) =>
  button.addEventListener("click", queueReadingPosition),
);
updateReadingPosition();
