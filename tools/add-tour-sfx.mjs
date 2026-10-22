import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rate = 48000;
const tau = 2 * Math.PI;

// The first film predates event logging; its chapter cues locate the actions.
function eventsFromChapters(manifest) {
  const events = [{ time: 0.15, type: "boot" }];
  manifest.scenes.forEach((scene, index) => {
    const next = manifest.scenes[index + 1]?.start ?? manifest.duration;
    const add = (offset, type, pan = 0) => events.push({ time: scene.start + offset, type, pan });
    if (index && scene.chapter !== manifest.scenes[index - 1].chapter) add(0.02, "section");
    if (["PROJETS", "COMPÉTENCES", "QUALITÉS PERSONNELLES"].includes(scene.chapter)) {
      add(0.65, "move", -0.15);
      add(1.25, "click", -0.1);
      add(1.30, "pop");
      add(scene.chapter === "PROJETS" ? 1.65 : 2.2, "move", -0.25);
      events.push({ time: next - (scene.chapter === "PROJETS" ? 0.36 : 0.14), type: "click", pan: 0.15 });
    } else if (scene.chapter === "C.V") {
      add(0.72, "click", 0.25);
      add(0.76, "paper");
    } else if (scene.chapter === "CODE") {
      add(0.02, "move", 0.3);
      add(0.62, "click", 0.3);
      add(0.67, "pop");
      add(0.95, "move", -0.2);
      events.push({ time: next - 0.35, type: "click", pan: 0.2 });
    } else if (scene.chapter === "À TOI DE JOUER") {
      add(0.02, "move", 0.3);
      add(0.85, "finish");
    }
  });
  return events.sort((a, b) => a.time - b.time);
}

export async function addTourSfx({ videoPath, manifestPath }) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const probe = JSON.parse((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "json", videoPath])).stdout);
  const duration = Number(probe.format.duration);
  const frames = Math.ceil(duration * rate);
  const mix = new Float32Array(frames * 2);
  const baseEvents = (manifest.soundEffects?.events ?? eventsFromChapters(manifest)).filter(event => ["boot", "section", "move", "click", "pop", "paper", "finish"].includes(event.type));
  // Chapter motifs and detail cues complement the recorded robot/UI actions.
  const events = [...baseEvents];
  for (const scene of manifest.scenes) {
    const type = ({ PROJETS: "data", COMPÉTENCES: "keys", FORMATION: "bell", "QUALITÉS PERSONNELLES": "sparkle", LANGUES: "bubble", DIVERS: "pluck", "C.V": "stamp", CODE: "arcade", CONTACT: "send" })[scene.chapter];
    if (type) events.push({ time: scene.start + 0.30, type, pan: 0 });
  }
  events.sort((a, b) => a.time - b.time);
  const counts = {};
  let randomState = 41279;
  const noise = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 2147483648 - 1;
  };
  function sound(time, length, amplitude, pan, sample) {
    const start = Math.round(time * rate);
    const count = Math.round(length * rate);
    const left = Math.sqrt((1 - pan) / 2);
    const right = Math.sqrt((1 + pan) / 2);
    for (let i = 0; i < count && start + i < frames; i++) {
      if (start + i < 0) continue;
      const value = sample(i / rate, i / count, i) * amplitude;
      mix[(start + i) * 2] += value * left;
      mix[(start + i) * 2 + 1] += value * right;
    }
  }
  function tone(time, frequency, amplitude = 0.16, length = 0.24, pan = 0) {
    sound(time, length, amplitude, pan, (t) => {
      const env = (1 - Math.exp(-t * 1300)) * Math.exp(-t * 23);
      return env * (Math.sin(tau * frequency * t) + 0.18 * Math.sin(tau * frequency * 2.01 * t));
    });
  }
  function sweep(time, amplitude, length, pan = 0) {
    let slow = 0, fast = 0;
    sound(time, length, amplitude, pan, (t, u) => {
      const n = noise();
      slow += 0.025 * (n - slow);
      fast += (0.10 + 0.24 * Math.sin(Math.PI * u)) * (n - fast);
      return (fast - slow) * Math.pow(Math.sin(Math.PI * u), 1.8);
    });
  }
  for (const event of events) {
    const t = event.time;
    const variant = (counts[event.type] ?? 0);
    counts[event.type] = variant + 1;
    const pitch = [1, 1.122, 0.891, 1.26, 0.944, 1.059][variant % 6];
    event.variant = variant % 6;
    const pan = Math.max(-0.4, Math.min(0.4, event.pan ?? 0));
    switch (event.type) {
      case "boot":
        [440, 659.25, 880].forEach((frequency, i) => tone(t + i * 0.12, frequency, 0.18, 0.34, (i - 1) * 0.15));
        break;
      case "section":
        sweep(t, 0.10, 0.32, pan);
        tone(t + 0.05, 523.25 * pitch, 0.055, 0.18, pan);
        break;
      case "move":
        sweep(t, 0.16, 0.30 + (variant % 4) * 0.07, pan);
        [0.06, 0.20, 0.34, 0.48].forEach((offset, i) => tone(t + offset, (i % 2 ? 145 : 112) * pitch, 0.075, 0.07, pan + (i % 2 ? 0.04 : -0.04)));
        break;
      case "click":
        tone(t, (variant % 2 ? 680 : 1180) * pitch, 0.18, 0.06 + (variant % 3) * 0.018, pan);
        sound(t, 0.014, 0.09, pan, (dt) => noise() * Math.exp(-dt * 330));
        break;
      case "pop":
        sound(t, 0.23, 0.18, pan, (dt) => Math.sin(tau * ((220 + (variant % 5) * 65) * dt + 500 * pitch * dt * dt)) * (1 - Math.exp(-dt * 500)) * Math.exp(-dt * 22));
        tone(t + 0.035, 698.46 * pitch, 0.075, 0.16, pan);
        break;
      case "paper":
        sweep(t, 0.24, 0.32, -0.15);
        sweep(t + 0.12, 0.18, 0.23, 0.15);
        break;
      case "data":
        [330, 495, 660, 990, 1320].forEach((f, i) => tone(t + i * 0.055, f * pitch, 0.075, 0.12, (i - 2) * 0.12));
        break;
      case "keys":
        for (let i = 0; i < 7; i++) {
          sound(t + i * 0.055, 0.025, 0.12, (i - 3) * 0.08, dt => noise() * Math.exp(-dt * 170));
          tone(t + i * 0.055, (180 + i * 37) * pitch, 0.045, 0.035, pan);
        }
        break;
      case "bell":
        [1, 2.76, 5.4].forEach((harmonic, i) => sound(t, 1.1, 0.09 / (i + 1), pan, dt => Math.sin(tau * 660 * harmonic * dt) * (1 - Math.exp(-dt * 1500)) * Math.exp(-dt * (4 + i * 2))));
        break;
      case "sparkle":
        [1046.5, 1568, 1318.5].forEach((f, i) => tone(t + i * 0.085, f * pitch, 0.075, 0.30, (i - 1) * 0.25));
        break;
      case "bubble":
        for (let i = 0; i < 4; i++) sound(t + i * 0.11, 0.12, 0.11, (i - 1.5) * 0.15, dt => Math.sin(tau * (400 * dt + 2200 * dt * dt)) * Math.exp(-dt * 35));
        break;
      case "pluck":
        [261.63, 329.63, 392].forEach((f, i) => sound(t + i * 0.12, 0.6, 0.10, (i - 1) * 0.15, dt => Math.sin(tau * f * dt) * Math.exp(-dt * 8) * Math.cos(tau * 1.8 * dt)));
        break;
      case "stamp":
        sound(t + 0.12, 0.18, 0.24, pan, dt => (Math.sin(tau * 90 * dt) + noise() * 0.3) * Math.exp(-dt * 35));
        break;
      case "arcade":
        [261.63, 523.25, 392, 783.99, 1046.5].forEach((f, i) => sound(t + i * 0.09, 0.075, 0.055, pan, dt => Math.tanh(Math.sin(tau * f * dt) * 4) * Math.sin(Math.PI * dt / 0.075)));
        break;
      case "send":
        sweep(t, 0.24, 0.7, -0.2);
        [783.99, 1046.5].forEach((f, i) => tone(t + 0.3 + i * 0.12, f, 0.12, 0.4, 0.2));
        break;
      case "finish":
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => tone(t + i * 0.13, frequency, 0.18, 0.48, (i - 1.5) * 0.13));
        break;
    }
  }
  let peak = 0;
  for (const value of mix) peak = Math.max(peak, Math.abs(value));
  if (!peak) throw new Error("Sound effect mix is empty");
  const gain = 0.5 / peak;
  const wav = Buffer.alloc(44 + mix.length * 2);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(mix.length * 2, 40);
  for (let i = 0; i < mix.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix[i] * gain)) * 32767), 44 + i * 2);
  const work = resolve(root, ".tour-render");
  await mkdir(work, { recursive: true });
  const wavPath = resolve(work, "portfolio-tour-sfx.wav");
  const output = resolve(dirname(videoPath), "portfolio-tour-with-sfx.mp4");
  await writeFile(wavPath, wav);
  // Copy the picture stream so adding sound never re-encodes the existing film.
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", videoPath, "-i", wavPath, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", String(rate), "-t", String(duration), "-movflags", "+faststart", output]);
  await rename(output, videoPath);
  manifest.audio = "Original stereo sound design: six pitch/timbre variations per action; robot footsteps, airy transitions, UI clicks, spring pops, paper, data arpeggios, keyboard taps, metallic bell, sparkles, bubbles, string plucks, stamp, arcade and send cues. AAC, 48 kHz. No third-party recordings.";
  manifest.soundEffects = { timingSource: manifest.soundEffects?.timingSource ?? "Chapter cues and recorded action offsets", events };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Added ${events.length} original sound effects to ${videoPath}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await addTourSfx({ videoPath: resolve(root, "assets/portfolio-tour.mp4"), manifestPath: resolve(root, "assets/portfolio-tour-scenes.json") });
}
