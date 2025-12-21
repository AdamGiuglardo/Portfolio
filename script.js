/* =========================================
   NAVBAR: BURGER + SHRINK ON SCROLL
========================================= */
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
const headerEl = document.querySelector("header");

if (burger && nav) {
  burger.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  // Fermer le menu mobile quand on clique sur un lien
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });
}

window.addEventListener("scroll", () => {
  if (window.scrollY > 10) {
    headerEl.classList.add("scrolled");
  } else {
    headerEl.classList.remove("scrolled");
  }
});

/* =========================================
   TOGGLE : TECHNIQUES / HUMAINES
========================================= */
const btnTech = document.getElementById("btn-tech");
const btnHum = document.getElementById("btn-hum");
const secTech = document.getElementById("section-tech");
const secHum = document.getElementById("section-hum");

if (btnTech && btnHum && secTech && secHum) {
  btnTech.onclick = () => {
    btnTech.classList.add("active");
    btnHum.classList.remove("active");
    secTech.classList.add("active");
    secHum.classList.remove("active");
  };

  btnHum.onclick = () => {
    btnHum.classList.add("active");
    btnTech.classList.remove("active");
    secHum.classList.add("active");
    secTech.classList.remove("active");
  };
}

/* =========================================
   COMPÉTENCES TECHNIQUES – MENU GAUCHE
========================================= */
const techItems = document.querySelectorAll(".tech-item");
const techDetails = document.querySelectorAll(".tech-detail");

function activateTechDetail(id) {
  techDetails.forEach(detail => {
    const fill = detail.querySelector(".progress-fill");
    if (fill) fill.style.width = "0%";
    detail.classList.remove("active");
    detail.style.display = "none";
  });

  const target = document.getElementById(id);
  if (!target) return;

  target.style.display = "block";
  target.classList.add("active");

  const percent = target.dataset.percent || 0;
  const fill = target.querySelector(".progress-fill");
  const label = target.querySelector(".percent-label");

  if (label) label.textContent = percent + "%";
  if (fill) {
    requestAnimationFrame(() => {
      fill.style.width = percent + "%";
    });
  }
}

techItems.forEach(item => {
  item.addEventListener("click", () => {
    techItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    activateTechDetail(item.dataset.target);
  });
});

/* =========================================
   ACCORDÉONS (Sous-compétences)
========================================= */
const headers = document.querySelectorAll(".subskill-header");

headers.forEach(header => {
  const parent = header.parentElement;
  const body = parent.querySelector(".subskill-body");

  header.classList.remove("open");
  parent.classList.remove("open");
  if (body) {
    body.style.maxHeight = null;
    body.classList.remove("open");
  }

  header.addEventListener("click", () => {
    const isOpen = header.classList.contains("open");

    document.querySelectorAll(".subskill-header").forEach(h => h.classList.remove("open"));
    document.querySelectorAll(".subskill").forEach(s => s.classList.remove("open"));
    document.querySelectorAll(".subskill-body").forEach(b => {
      b.classList.remove("open");
      b.style.maxHeight = null;
    });

    if (!isOpen) {
      header.classList.add("open");
      parent.classList.add("open");
      if (body) {
        body.classList.add("open");
        requestAnimationFrame(() => {
          body.style.maxHeight = body.scrollHeight + "px";
        });
      }
    }
  });
});

/* =========================================
   FORMATION – Cartes + panneau détail
========================================= */
const formationCards = document.querySelectorAll(".formation-card");
const formationPanels = document.querySelectorAll(".formation-panel");

formationCards.forEach(card => {
  card.addEventListener("click", () => {
    const targetId = card.dataset.target;

    formationCards.forEach(c => c.classList.remove("active"));
    card.classList.add("active");

    formationPanels.forEach(p => p.classList.remove("active"));
    const target = document.getElementById(targetId);
    if (target) target.classList.add("active");
  });
});

/* =========================================
   INITIALISATION
========================================= */
window.addEventListener("load", () => {
  const init = document.querySelector(".tech-detail.active");
  if (init) {
    const percent = init.dataset.percent || 0;
    const fill = init.querySelector(".progress-fill");
    const label = init.querySelector(".percent-label");
    if (label) label.textContent = percent + "%";
    if (fill) fill.style.width = percent + "%";
  }

  techDetails.forEach(detail => {
    if (!detail.classList.contains("active")) {
      detail.style.display = "none";
    }
  });
});
/* ==========================
   PROJETS VERSION PRO
========================== */

// FILTRE
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".project-pro-card");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;

    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    projectCards.forEach(card => {
      const category = card.dataset.category;
      card.style.display =
        filter === "all" || filter === category ? "block" : "none";
    });
  });
});

const modals = document.querySelectorAll(".modal");
const modalTriggers = document.querySelectorAll(".project-pro-card");

function openModal(modal) {
  modal.style.display = "flex";

  document.body.style.overflow = "hidden";

  const content = modal.querySelector(".modal-content");
  if (content) content.scrollTop = 0;
}

function closeModal(modal) {
  modal.style.display = "none";

  document.body.style.overflow = "";
}

modalTriggers.forEach(card => {
  card.addEventListener("click", () => {
    const modalId = card.dataset.modal;
    const modal = document.getElementById(modalId);
    if (modal) openModal(modal);
  });
});

document.querySelectorAll(".modal-close").forEach(btn => {
  btn.addEventListener("click", () => {
    const modal = btn.closest(".modal");
    if (modal) closeModal(modal);
  });
});

modals.forEach(modal => {
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal(modal);
  });
});

/* ===========================
   "QUALITÉS HUMAINES" : carte explicative au clic
   =========================== */
const qualityStoryEl = document.getElementById("qualityStory");
const qualityStoryTitleEl = document.getElementById("qualityStoryTitle");
const qualityStoryBodyEl = document.getElementById("qualityStoryBody");
const qualityStoryCloseBtn = document.getElementById("qualityStoryClose");

const qualityStories = {
  "Assiduité":
    "Je l’ai développée en me fixant une routine (cours, devoirs, projets) et en respectant des échéances, même quand la motivation baisse. Le fait de livrer régulièrement du travail m’a appris la constance.",
  "Organisation":
    "Je l’ai acquise en planifiant mes tâches (to-do, priorités, découpage en étapes) et en gardant mes fichiers/projets propres. Sur des projets plus longs, ça m’a permis d’éviter le stress de dernière minute.",
  "Patience":
    "Je l’ai renforcée en résolvant des problèmes techniques : tester, comprendre l’erreur, recommencer, chercher une solution. Ça m’a appris à rester calme et à avancer étape par étape.",
  "Efficacité":
    "Je l’ai travaillée en cherchant des méthodes simples : automatiser ce qui peut l’être, réutiliser des composants, et aller à l’essentiel. Avec le temps, j’ai appris à produire plus vite sans sacrifier la qualité.",
  "Esprit d’équipe":
    "Je l’ai acquise en travaillant en groupe (répartition des tâches, communication, entraide). J’ai appris à écouter, à proposer des solutions, et à m’adapter pour atteindre un objectif commun.",
  "Prévenance":
    "Je l’ai développée en portant attention aux détails (soin du rendu, vérifications, anticipation des erreurs) et en me mettant à la place des autres (utilisateur/équipe) pour améliorer l’expérience et la qualité finale."
};

function showQualityStory(title) {
  if (!qualityStoryEl || !qualityStoryTitleEl || !qualityStoryBodyEl) return;

  qualityStoryTitleEl.textContent = title || "Qualité";
  qualityStoryBodyEl.textContent =
    qualityStories[title] || "Je l’ai acquise grâce à mes expériences (projets, cours, travail en groupe) et en cherchant à progresser régulièrement.";

  qualityStoryEl.classList.add("is-visible");

}

function hideQualityStory() {
  if (!qualityStoryEl) return;
  qualityStoryEl.classList.remove("is-visible");
}

if (qualityStoryCloseBtn) {
  qualityStoryCloseBtn.addEventListener("click", hideQualityStory);
}

document.querySelectorAll(".human-card").forEach(card => {
  card.addEventListener("click", () => {
    const title = card.querySelector(".human-title")?.textContent?.trim();
    showQualityStory(title);
  });
});
