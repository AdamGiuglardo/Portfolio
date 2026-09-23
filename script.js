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
window.matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
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
      if (!project.hidden) count++;
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

// Progressive enhancement: content stays visible without JavaScript or motion.
if (
  "IntersectionObserver" in window &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  const revealObserver = new IntersectionObserver(
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
  document
    .querySelectorAll(
      ".section-head, .skills-grid, .timeline, .personal-grid, .interests",
    )
    .forEach((element) => {
      element.classList.add("reveal");
      revealObserver.observe(element);
    });
}
if ("IntersectionObserver" in window) {
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          nav.querySelectorAll("a").forEach((link) => {
            if (link.hash === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      });
    },
    { rootMargin: "-10% 0px -65% 0px" },
  );
  document
    .querySelectorAll("main > section")
    .forEach((section) => activeObserver.observe(section));
}
