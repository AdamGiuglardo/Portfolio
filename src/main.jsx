import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  MotionConfig,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import {
  article as MotionArticle,
  button as MotionButton,
  div as MotionDiv,
} from "motion/react-m";
import "./motion.css";

const projects = [
  {
    number: "01",
    category: "reseau",
    label: "Réseaux",
    title: "Projet intégratif SAE 2.04",
    description: "Une infrastructure d’entreprise, du routage aux services.",
    dialog: "modal-sae24",
  },
  {
    number: "02",
    category: "reseau",
    label: "Réseaux",
    title: "Infrastructure réseau",
    description: "Wi-Fi, adressage et services réseau sur équipements réels.",
    dialog: "modal-reseau",
  },
  {
    number: "03",
    category: "web",
    label: "Web",
    title: "Portfolio",
    description: "Un site pour présenter mon parcours et mes réalisations.",
    dialog: "modal-web",
  },
  {
    number: "04",
    category: "telecom",
    label: "Télécoms",
    title: "Analyse de signaux",
    description: "Observer, mesurer et comprendre les signaux à l’oscilloscope.",
    dialog: "modal-telecom",
  },
  {
    number: "05",
    category: "telecom",
    label: "Télécoms",
    title: "Téléphonie sur IP",
    description: "Connecter des postes SIP, DECT et analogiques via un IPBX.",
    dialog: "modal-telephonie",
  },
];

const filters = [
  ["all", "Tous"],
  ["reseau", "Réseaux"],
  ["web", "Web"],
  ["telecom", "Télécoms"],
];

function ProjectExperience() {
  const [activeFilter, setActiveFilter] = useState("all");
  const visibleProjects = projects.filter(
    (project) => activeFilter === "all" || project.category === activeFilter,
  );
  const controls = document.getElementById("project-filter-root");
  const list = document.getElementById("project-list-root");
  const status = document.getElementById("project-status-root");

  return (
    <>
      {controls &&
        createPortal(
          filters.map(([value, label]) => (
            <MotionButton
              key={value}
              type="button"
              aria-pressed={activeFilter === value}
              onClick={() => setActiveFilter(value)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              {label}
            </MotionButton>
          )),
          controls,
        )}
      {status &&
        createPortal(
          `${visibleProjects.length} projet${visibleProjects.length > 1 ? "s" : ""} affiché${visibleProjects.length > 1 ? "s" : ""}`,
          status,
        )}
      {list &&
        createPortal(
          <AnimatePresence initial={false}>
            {visibleProjects.map((project, index) => (
              <MotionArticle
                className="project-row"
                key={project.number}
                initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{
                  layout: { type: "spring", stiffness: 310, damping: 32 },
                  opacity: { duration: 0.22, delay: index * 0.055 },
                  y: { type: "spring", stiffness: 260, damping: 24, delay: index * 0.045 },
                  filter: { duration: 0.28, delay: index * 0.04 },
                }}
              >
                <MotionButton
                  className="project-open"
                  type="button"
                  data-modal={project.dialog}
                  aria-haspopup="dialog"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 340, damping: 25 }}
                >
                  <span className="project-number">{project.number}</span>
                  <span className="project-text">
                    <span className="project-title">{project.title}</span>
                    <span className="project-description">
                      {project.description}
                    </span>
                  </span>
                  <span className="project-category">{project.label}</span>
                  <span className="project-arrow">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M5 19 19 5M5 5h14v14" />
                    </svg>
                  </span>
                </MotionButton>
              </MotionArticle>
            ))}
          </AnimatePresence>,
          list,
        )}
    </>
  );
}

function ScrollEffects() {
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 115,
    damping: 28,
    restDelta: 0.001,
  });
  const pointerX = useMotionValue(-500);
  const pointerY = useMotionValue(-500);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 25, mass: 0.7 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 25, mass: 0.7 });

  useEffect(() => {
    const targets = document.querySelectorAll(
      ".section-head, .section > h2, .section > .section-label, .skill-column, .timeline article, .personal-grid > div, .interests article, .cv-section > *, .contact-grid > *",
    );
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px 0px" },
    );
    targets.forEach((target) => {
      const siblings = [...target.parentElement.children];
      target.style.setProperty(
        "--reveal-delay",
        `${Math.min(siblings.indexOf(target) * 70, 210)}ms`,
      );
      target.classList.add("reveal");
      observer.observe(target);
    });
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  useEffect(() => {
    const movePointer = (event) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
    };
    window.addEventListener("pointermove", movePointer, { passive: true });
    return () => window.removeEventListener("pointermove", movePointer);
  }, [pointerX, pointerY]);

  return (
    <>
      <MotionDiv className="react-reading-progress" style={{ scaleX: progress }} />
      {!prefersReducedMotion && (
        <MotionDiv
          className="react-pointer-glow"
          style={{ x: smoothX, y: smoothY }}
        />
      )}
    </>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>
        <ProjectExperience />
        <ScrollEffects />
      </LazyMotion>
    </MotionConfig>
  );
}

createRoot(document.getElementById("motion-react-root")).render(<App />);
