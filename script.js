/* =========================================================
   script.js (version commentée)
   Objectif : expliquer ce que fait chaque partie du JS
   ========================================================= */

/* =========================================
   NAVBAR: BURGER + SHRINK ON SCROLL
========================================= */

// On récupère des éléments HTML par leur id (ce sont des "poignées" pour les manipuler en JS)
const burger = document.getElementById("burger"); // bouton ☰ (menu mobile)
const nav = document.getElementById("nav");       // la barre de navigation <nav>
const headerEl = document.querySelector("header"); // le <header> (barre en haut du site)

// On vérifie que les éléments existent (évite une erreur si l'id n'est pas dans la page)
if (burger && nav) {
  // Quand on clique sur le burger, on ajoute/enlève la classe "open" sur <nav>
  // -> en CSS, nav.open = menu visible sur mobile
  burger.addEventListener("click", () => {
    nav.classList.toggle("open"); // toggle = si la classe existe -> on enlève, sinon -> on ajoute
  });

  // Fermer le menu mobile quand on clique sur un lien du menu
  // querySelectorAll("a") = récupère tous les liens <a> à l'intérieur du nav
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open"); // on force la fermeture du menu
    });
  });
}

// Écouteur sur le scroll de la page
window.addEventListener("scroll", () => {
  // window.scrollY = nombre de pixels déjà "descendus" dans la page
  if (window.scrollY > 10) {
    headerEl.classList.add("scrolled"); // en CSS, header.scrolled = header plus petit + ombre
  } else {
    headerEl.classList.remove("scrolled"); // on remet le header normal
  }
});

/* =========================================
   TOGGLE : TECHNIQUES / HUMAINES
========================================= */

// Boutons qui changent l'onglet "Compétences techniques" / "Qualités"
const btnTech = document.getElementById("btn-tech");
const btnHum = document.getElementById("btn-hum");

// Sections à afficher / cacher
const secTech = document.getElementById("section-tech");
const secHum = document.getElementById("section-hum");

// Vérification existence (évite une erreur si une section manque)
if (btnTech && btnHum && secTech && secHum) {
  // Quand on clique sur "Compétences techniques"
  btnTech.onclick = () => {
    // Les classes "active" servent à :
    // - styliser le bouton actif
    // - afficher la section active (en CSS .comp-section.active { display:block; })
    btnTech.classList.add("active");
    btnHum.classList.remove("active");
    secTech.classList.add("active");
    secHum.classList.remove("active");
  };

  // Quand on clique sur "Qualités"
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

// Les items du menu à gauche ("Réseaux", "Programmation", "Télécommunications")
const techItems = document.querySelectorAll(".tech-item");

// Les panneaux de détail à droite (les blocs .tech-detail)
const techDetails = document.querySelectorAll(".tech-detail");

/**
 * Active un panneau technique (ex: "tech-reseau")
 * - cache tous les autres
 * - affiche le bon
 * - anime la barre de progression en fonction du data-percent
 */
function activateTechDetail(id) {
  // 1) On cache tous les panneaux
  techDetails.forEach(detail => {
    // Barre de progression à l'intérieur du panneau (si elle existe)
    const fill = detail.querySelector(".progress-fill");

    // On remet la barre à 0% avant de changer (sinon l'animation peut être bizarre)
    if (fill) fill.style.width = "0%";

    // On enlève la classe active et on cache le panneau
    detail.classList.remove("active");
    detail.style.display = "none";
  });

  // 2) On récupère le panneau ciblé grâce à son id
  const target = document.getElementById(id);
  if (!target) return; // si on ne le trouve pas, on stop

  // 3) On affiche le panneau choisi
  target.style.display = "block";
  target.classList.add("active");

  // 4) Récupération du pourcentage depuis l'attribut data-percent="85"
  // dataset.percent = ce qu'il y a dans data-percent
  const percent = target.dataset.percent || 0;

  // Éléments dans le panneau : la barre + le texte "85%"
  const fill = target.querySelector(".progress-fill");
  const label = target.querySelector(".percent-label");

  // On met à jour le texte
  if (label) label.textContent = percent + "%";

  // Animation de la barre
  if (fill) {
    // requestAnimationFrame = attend le prochain "rafraîchissement" du navigateur
    // Ça aide à déclencher l'animation CSS (transition) correctement.
    requestAnimationFrame(() => {
      fill.style.width = percent + "%";
    });
  }
}

// Ajout des clics sur chaque item du menu
techItems.forEach(item => {
  item.addEventListener("click", () => {
    // On enlève "active" partout (pour n'avoir qu'un seul item sélectionné)
    techItems.forEach(i => i.classList.remove("active"));

    // On active celui sur lequel on vient de cliquer
    item.classList.add("active");

    // item.dataset.target = l'id du panneau à afficher (ex: "tech-reseau")
    activateTechDetail(item.dataset.target);
  });
});

/* =========================================
   ACCORDÉONS (Sous-compétences)
========================================= */

// Les boutons qui ouvrent/ferment les sous-compétences
const headers = document.querySelectorAll(".subskill-header");

headers.forEach(header => {
  // parentElement = le bloc .subskill qui contient ce header
  const parent = header.parentElement;

  // Le contenu qu'on va ouvrir/fermer
  const body = parent.querySelector(".subskill-body");

  // On force un état "fermé" au chargement (sécurité)
  header.classList.remove("open");
  parent.classList.remove("open");
  if (body) {
    body.style.maxHeight = null; // maxHeight null = pas de hauteur forcée
    body.classList.remove("open");
  }

  header.addEventListener("click", () => {
    // Est-ce que ce header est déjà ouvert ?
    const isOpen = header.classList.contains("open");

    // On ferme TOUS les accordéons (comportement "un seul ouvert à la fois")
    document.querySelectorAll(".subskill-header").forEach(h => h.classList.remove("open"));
    document.querySelectorAll(".subskill").forEach(s => s.classList.remove("open"));
    document.querySelectorAll(".subskill-body").forEach(b => {
      b.classList.remove("open");
      b.style.maxHeight = null;
    });

    // Si celui cliqué n'était pas ouvert, on l'ouvre
    if (!isOpen) {
      header.classList.add("open"); // change le style du bouton
      parent.classList.add("open"); // change le style du bloc

      if (body) {
        body.classList.add("open");

        // body.scrollHeight = hauteur "réelle" du contenu (même caché)
        // On l'utilise pour donner une max-height et permettre une transition
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

// Les cartes de formation à gauche (IUT / Lycée)
const formationCards = document.querySelectorAll(".formation-card");

// Les panneaux de texte à droite
const formationPanels = document.querySelectorAll(".formation-panel");

formationCards.forEach(card => {
  card.addEventListener("click", () => {
    // data-target="form-iut" -> id du panneau à afficher
    const targetId = card.dataset.target;

    // On met "active" uniquement sur la carte cliquée
    formationCards.forEach(c => c.classList.remove("active"));
    card.classList.add("active");

    // On cache tous les panneaux
    formationPanels.forEach(p => p.classList.remove("active"));

    // Puis on affiche le bon
    const target = document.getElementById(targetId);
    if (target) target.classList.add("active");
  });
});

/* =========================================
   INITIALISATION
========================================= */

// Au chargement complet de la page
window.addEventListener("load", () => {
  // On prend le panneau technique déjà actif au départ
  const init = document.querySelector(".tech-detail.active");
  if (init) {
    // Même logique que plus haut : on met la barre au bon pourcentage dès le départ
    const percent = init.dataset.percent || 0;
    const fill = init.querySelector(".progress-fill");
    const label = init.querySelector(".percent-label");
    if (label) label.textContent = percent + "%";
    if (fill) fill.style.width = percent + "%";
  }

  // On cache tous les panneaux techniques qui ne sont pas actifs (propreté)
  techDetails.forEach(detail => {
    if (!detail.classList.contains("active")) {
      detail.style.display = "none";
    }
  });
});

/* ==========================
   PROJETS VERSION PRO
========================== */

/* ---- FILTRE DES PROJETS ---- */

// Boutons "Tous / Réseau / Web / Télécom"
const filterButtons = document.querySelectorAll(".filter-btn");

// Toutes les cartes projets
const projectCards = document.querySelectorAll(".project-pro-card");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // data-filter="reseau" par exemple
    const filter = btn.dataset.filter;

    // Style: un seul bouton actif à la fois
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Pour chaque carte, on regarde sa catégorie (data-category)
    projectCards.forEach(card => {
      const category = card.dataset.category;

      // Si filter == all -> on affiche tout
      // Sinon on affiche seulement les cartes dont la catégorie correspond
      card.style.display =
        filter === "all" || filter === category ? "block" : "none";
    });
  });
});

/* ---- MODALES DES PROJETS ---- */

// Toutes les modales (les grandes fenêtres qui s'ouvrent)
const modals = document.querySelectorAll(".modal");

// Les éléments qui déclenchent l'ouverture (ici: les cartes projets)
const modalTriggers = document.querySelectorAll(".project-pro-card");

/**
 * Ouvre une modale (affiche la fenêtre)
 */
function openModal(modal) {
  modal.style.display = "flex"; // "flex" car en CSS la modale est centrée avec flexbox

  // Important: empêche de scroller la page derrière la modale
  document.body.style.overflow = "hidden";

  // On remet le scroll de la modale en haut (utile si on l'a déjà scrollée avant)
  const content = modal.querySelector(".modal-content");
  if (content) content.scrollTop = 0;
}

/**
 * Ferme une modale (cache la fenêtre)
 */
function closeModal(modal) {
  modal.style.display = "none";

  // On réactive le scroll normal de la page
  document.body.style.overflow = "";
}

// Clic sur une carte projet -> ouvre la modale correspondante
modalTriggers.forEach(card => {
  card.addEventListener("click", () => {
    // data-modal="modal-web" par exemple
    const modalId = card.dataset.modal;

    // On récupère la modale par son id
    const modal = document.getElementById(modalId);

    // Si elle existe, on l'ouvre
    if (modal) openModal(modal);
  });
});

// Bouton ✖ dans la modale -> ferme la modale
document.querySelectorAll(".modal-close").forEach(btn => {
  btn.addEventListener("click", () => {
    // closest(".modal") = remonte dans le HTML jusqu'au parent qui a la classe .modal
    const modal = btn.closest(".modal");
    if (modal) closeModal(modal);
  });
});

// Clique sur le fond sombre (en dehors du contenu) -> ferme la modale
modals.forEach(modal => {
  modal.addEventListener("click", e => {
    // e.target = l'élément cliqué
    // Si on a cliqué directement sur le "fond" .modal (et pas sur le contenu),
    // alors e.target === modal est vrai.
    if (e.target === modal) closeModal(modal);
  });
});

/* ===========================
   "QUALITÉS HUMAINES" : carte explicative au clic
=========================== */

// Les éléments de la petite carte d'explication
const qualityStoryEl = document.getElementById("qualityStory");
const qualityStoryTitleEl = document.getElementById("qualityStoryTitle");
const qualityStoryBodyEl = document.getElementById("qualityStoryBody");
const qualityStoryCloseBtn = document.getElementById("qualityStoryClose");

// Dictionnaire : "Nom de la qualité" -> "Texte affiché"
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

/**
 * Affiche la carte et remplit le titre + le texte
 */
function showQualityStory(title) {
  // Si l'un des éléments n'existe pas, on arrête (évite erreur)
  if (!qualityStoryEl || !qualityStoryTitleEl || !qualityStoryBodyEl) return;

  // Titre : on met le nom de la qualité (ou "Qualité" si title est vide)
  qualityStoryTitleEl.textContent = title || "Qualité";

  // Corps : on prend le texte dans qualityStories, sinon on met un texte par défaut
  qualityStoryBodyEl.textContent =
    qualityStories[title] || "Je l’ai acquise grâce à mes expériences (projets, cours, travail en groupe) et en cherchant à progresser régulièrement.";

  // Affiche la carte (en CSS: .quality-story.is-visible { display:block; })
  qualityStoryEl.classList.add("is-visible");

  // ⚠️ IMPORTANT : on ne fait PAS de scroll automatique ici
  // (sinon la page descend toute seule)
}

/**
 * Cache la carte
 */
function hideQualityStory() {
  if (!qualityStoryEl) return;
  qualityStoryEl.classList.remove("is-visible");
}

// Bouton "✕" -> ferme la carte
if (qualityStoryCloseBtn) {
  qualityStoryCloseBtn.addEventListener("click", hideQualityStory);
}

// Clic sur une carte de qualité -> affiche le texte correspondant
document.querySelectorAll(".human-card").forEach(card => {
  card.addEventListener("click", () => {
    // On récupère le texte du titre dans la carte (ex: "Organisation")
    // Le "?.": si l'élément n'existe pas, ça renvoie undefined au lieu de faire une erreur
    const title = card.querySelector(".human-title")?.textContent?.trim();

    showQualityStory(title);
  });
});