import { chromium } from "playwright";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { addTourSfx } from "./add-tour-sfx.mjs";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const renderDir = resolve(root, ".tour-render");
const sample = process.argv.includes("--sample");
await mkdir(resolve(renderDir, "raw"), { recursive: true });
await run("sips", ["-s", "format", "png", resolve(root, "assets/cv.pdf"), "--out", resolve(renderDir, "cv.png")]);

const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".pdf": "application/pdf", ".mp4": "video/mp4", ".vtt": "text/vtt" };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(root + sep) || /\/(?:\.git|\.private|node_modules)\//.test(file)) throw new Error("Unavailable path");
    if (!(await stat(file)).isFile()) throw new Error("Not a file");
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, recordVideo: { dir: resolve(renderDir, "raw"), size: { width: 1280, height: 720 } } });
const recordingEpoch = Date.now();
const page = await context.newPage();
page.setDefaultTimeout(10000);
const video = page.video();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const cues = [];
const soundEvents = [];
let started;
let sceneIndex = 0;
const total = sample ? 5 : 30;
const wait = (ms) => page.waitForTimeout(sample ? ms * 0.6 : ms);
function sound(type, pan = 0) {
  if (started) soundEvents.push({ time: (Date.now() - started) / 1000, type, pan });
}
const stage = (method, ...args) => {
  if (method === "move") sound("move", (args[0] - 640) / 1600);
  if (method === "home") sound("move", -0.3);
  if (method === "click") sound("click", (args[0] - 640) / 1600);
  if (method === "start") sound("boot");
  if (method === "finish") sound("finish");
  if (method === "cv" && args[0]) sound("paper");
  return page.evaluate(({ method, args }) => window.tour[method](...args), { method, args });
};
function cue(chapter, label, text) {
  const time = (Date.now() - started) / 1000;
  if (cues.length && cues.at(-1).chapter !== chapter) sound("section");
  cues.push({ start: time, chapter, title: label, text });
  console.log(`${String(++sceneIndex).padStart(2, "0")} / ${total} · ${chapter} · ${label}`);
  return stage("scene", chapter, label, text, sceneIndex, total);
}

try {
  await page.goto(`${origin}/tools/tour-stage.html`, { waitUntil: "networkidle" });
  const frame = page.frames().find((item) => item.url().includes("?tour-capture"));
  if (!frame) throw new Error("Portfolio iframe is missing");
  await frame.locator(".project-row").nth(4).waitFor();
  await frame.addStyleTag({ content: `
    html{scroll-behavior:auto!important}*{overflow-anchor:none!important}.reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}
    [data-open-tour],.react-pointer-glow,.react-reading-progress{display:none!important}
    .hero{min-height:390px!important;padding-block:22px!important}.hero h1{font-size:68px!important}.hero-description{font-size:14px!important;margin-top:16px!important}.hero-actions{margin-top:18px!important}.portrait img{height:330px!important}.availability{font-size:10px!important;margin-top:14px!important}
    .section{padding-block:48px!important}.project-dialog{max-height:89vh!important;width:min(980px,calc(100% - 80px))!important}.modal-content{padding:25px!important}.modal-content h3{font-size:26px!important}.modal-close{position:sticky!important;top:0!important;z-index:5!important}.project-dialog img{max-height:250px!important;object-fit:contain}
  ` });
  await page.waitForTimeout(450);
  const poster = sample ? resolve(renderDir, "sample-poster.jpg") : resolve(root, "assets/portfolio-tour-poster.jpg");
  await page.screenshot({ path: poster, type: "jpeg", quality: 90 });
  const trimStart = (Date.now() - recordingEpoch) / 1000;
  started = Date.now();

  async function scrollTo(locator, offset = 132) {
    const top = await locator.evaluate((el, offset) => Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset), offset);
    await frame.evaluate((target) => new Promise((done) => {
      const from = window.scrollY;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / 650);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, from + (target - from) * eased);
        if (t < 1) requestAnimationFrame(tick); else done();
      }
      requestAnimationFrame(tick);
    }), top);
  }
  async function tap(locator, move = true) {
    const box = await locator.boundingBox();
    if (!box) throw new Error(`Missing target: ${await locator.textContent()}`);
    const x = box.x + Math.min(box.width * 0.72, box.width - 18);
    const y = box.y + box.height / 2;
    if (move) await stage("move", Math.max(10, Math.min(1175, x - 75)), Math.max(76, Math.min(463, y - 60)), 550);
    await stage("click", x, y);
    const opensPanel = await locator.evaluate((el) => el.matches("[data-modal], #open-code") || (el.tagName === "SUMMARY" && !el.parentElement.open));
    await locator.click();
    if (opensPanel) sound("pop", (x - 640) / 1600);
    await wait(260);
  }

  await cue("BIENVENUE", "Un petit guide. Un grand tour.", "Découvrons le portfolio d’Adam Giuglardo, étape par étape.");
  await stage("start");
  await wait(2700);
  await stage("reveal");
  await stage("home");
  await cue("À PROPOS DE MOI", "Comprendre. Connecter. Sécuriser.", "Un parcours en Réseaux & Télécommunications, construit projet après projet.");
  await wait(2400);

  const projects = [
    ["modal-sae24", "Projet intégratif SAE 2.04", "Une infrastructure d’entreprise : routage, services et administration réseau."],
    ["modal-reseau", "Infrastructure réseau", "Du Wi-Fi, de l’adressage et des services sur de vrais équipements."],
    ["modal-web", "Portfolio", "Le site que tu explores : mon parcours, mes compétences et mes réalisations."],
    ["modal-telecom", "Analyse de signaux", "Observer les signaux, mesurer leurs propriétés et interpréter les résultats."],
    ["modal-telephonie", "Téléphonie sur IP", "Faire communiquer des postes SIP, DECT et analogiques grâce à un IPBX."],
  ];
  for (const [id, title, description] of sample ? projects.slice(0, 1) : projects) {
    await cue("PROJETS", title, description);
    const button = frame.locator(`[data-modal="${id}"]`);
    await scrollTo(button, 175);
    await tap(button);
    const dialog = frame.locator(`#${id}`);
    await dialog.waitFor({ state: "visible" });
    await stage("home");
    await wait(1450);
    await dialog.evaluate((el) => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
    await wait(1350);
    await tap(dialog.locator(".modal-close"), false);
    if (await dialog.evaluate((el) => el.open)) throw new Error(`Project dialog did not close: ${id}`);
  }

  const skillDescriptions = [
    "Switchs Cisco, routeurs et points d’accès : apprendre à connecter les équipements.",
    "VMware et VirtualBox pour déployer des serveurs et simuler des architectures.",
    "DNS, DHCP, Active Directory et SSH : les services au cœur du réseau.",
    "Créer des interfaces web pour présenter des informations et des projets.",
    "Administrer Linux et automatiser les tâches avec des scripts Bash.",
    "Développer des scripts et traiter des données avec Python.",
    "Organiser les données et travailler avec les bases de données.",
    "Générer des signaux pour les observer et les comparer.",
    "Mesurer l’amplitude, la période et le bruit à l’oscilloscope.",
    "Configurer et tester des communications téléphoniques sur IP.",
  ];
  const skillSummaries = frame.locator("#competences details > summary");
  const skillCount = await skillSummaries.count();
  if (skillCount !== 10) throw new Error(`Expected 10 technical skills, found ${skillCount}`);
  for (let index = 0; index < (sample ? 1 : skillCount); index++) {
    const summary = skillSummaries.nth(index);
    const title = (await summary.textContent()).trim();
    await cue("COMPÉTENCES", title, skillDescriptions[index]);
    await scrollTo(summary, 140);
    await tap(summary);
    if (!(await summary.evaluate((el) => el.parentElement.open))) throw new Error(`Skill did not open: ${title}`);
    await scrollTo(summary, 112);
    await stage("home");
    await wait(1250);
    sound("click");
    await summary.click();
  }

  if (!sample) {
    await cue("FORMATION", "Un parcours tourné vers le numérique", "Le BUT Réseaux & Télécommunications, à l’IUT Clermont Auvergne.");
    await scrollTo(frame.locator("#formation h2"), 112);
    await wait(900);
    await scrollTo(frame.locator("#formation .timeline"), 115);
    await wait(1900);

    const qualities = frame.locator(".qualities details > summary");
    const qualityDescriptions = [
      "Des routines et des échéances pour avancer avec constance.",
      "Planifier, découper les étapes et garder ses projets organisés.",
      "Tester, comprendre l’erreur et chercher une solution, étape par étape.",
      "Choisir des méthodes simples et automatiser ce qui peut l’être.",
      "Écouter, communiquer et avancer ensemble vers un objectif commun.",
      "Soigner les détails et anticiper les besoins des autres.",
    ];
    if (await qualities.count() !== 6) throw new Error("Expected six personal qualities");
    for (let index = 0; index < 6; index++) {
      const summary = qualities.nth(index);
      await cue("QUALITÉS PERSONNELLES", (await summary.textContent()).trim(), qualityDescriptions[index]);
      await scrollTo(summary, 142);
      await tap(summary);
      await scrollTo(summary, 112);
      await stage("home");
      await wait(700);
      sound("click");
      await summary.click();
    }

    await cue("LANGUES", "Échanger dans plusieurs langues", "Français, anglais, italien, arabe et espagnol : cinq langues présentées sur le site.");
    await scrollTo(frame.locator(".languages"), 140);
    await wait(1900);
    await cue("DIVERS", "Et en dehors des réseaux ?", "Veille technologique, travail en équipe, jeux vidéo, musique et podcasts.");
    await scrollTo(frame.locator("#divers h2"), 130);
    await wait(900);
    await scrollTo(frame.locator("#divers .interests"), 132);
    await wait(1800);
    await cue("C.V", "Tout mon parcours, dans un document", "Le CV est consultable et téléchargeable directement depuis le portfolio.");
    await scrollTo(frame.locator("#cv"), 110);
    const cvButton = await frame.locator("#cv .button").boundingBox();
    await stage("click", cvButton.x + cvButton.width / 2, cvButton.y + cvButton.height / 2);
    await stage("cv", true);
    await wait(3000);
    await stage("cv", false);
    await cue("CODE", "Le portfolio a un autre niveau", "Un code d’accès ouvre l’arcade du portfolio et ses cinq jeux.");
    await tap(frame.locator("#open-code"));
    await frame.locator("#code-gate").waitFor({ state: "visible" });
    await stage("home");
    await wait(1600);
    await tap(frame.locator(".gate-close"), false);
    await cue("CONTACT", "Construisons la suite", "Une alternance, un projet ou un échange : les coordonnées sont à portée de clic.");
    await scrollTo(frame.locator("#contact"), 100);
    await wait(2600);
  }

  await cue("À TOI DE JOUER", "La visite continue avec toi", "Explore les projets, ouvre les compétences et prenons contact.");
  await stage("move", 900, 305, 800, 2.3);
  await stage("finish");
  await wait(2800);
  const duration = (Date.now() - started) / 1000;
  if (sceneIndex !== total) throw new Error(`Scene count mismatch: ${sceneIndex} instead of ${total}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join("; ")}`);
  await context.close();
  await browser.close();
  const raw = await video.path();
  const destination = sample ? resolve(renderDir, "sample.mp4") : resolve(root, "assets/portfolio-tour-v6.mp4");
  console.log(`Encoding ${Math.round(duration)} seconds to MP4…`);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(trimStart), "-i", raw, "-t", String(duration), "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-movflags", "+faststart", "-an", destination], { maxBuffer: 2 ** 20 });
  const timestamp = (seconds) => new Date(Math.max(0, seconds) * 1000).toISOString().slice(11, 23);
  const vtt = "WEBVTT\n\n" + cues.map((item, index) => `${index + 1}\n${timestamp(item.start)} --> ${timestamp(cues[index + 1]?.start ?? duration)}\n${item.title}\n${item.text}\n`).join("\n");
  const manifest = { title: "Le portfolio en mouvement — Adam Giuglardo", width: 1280, height: 720, fps: 30, duration, scenes: cues, source: "Local portfolio HTML and assets; original vector mascot and motion composition", soundEffects: { timingSource: "Recorded browser action timestamps", events: soundEvents } };
  const manifestPath = sample ? resolve(renderDir, "sample-scenes.json") : resolve(root, "assets/portfolio-tour-scenes.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(sample ? resolve(renderDir, "sample.vtt") : resolve(root, "assets/portfolio-tour.vtt"), vtt);
  await addTourSfx({ videoPath: destination, manifestPath });
  console.log(`Ready: ${destination} (${((await stat(destination)).size / 1024 / 1024).toFixed(1)} MB).`);
} finally {
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  server.close();
}
