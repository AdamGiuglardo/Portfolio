import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rate = 48000;

export async function addTourSfx({ videoPath, manifestPath }) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const catalog = JSON.parse(await readFile(resolve(root, "tools/tour-sounds/catalog.json"), "utf8"));
  const probe = JSON.parse((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "json", videoPath])).stdout);
  const duration = Number(probe.format.duration);
  const frames = Math.ceil(duration * rate);
  const mix = new Float32Array(frames * 2);
  const rawEvents = manifest.soundEffects?.rawEvents ?? manifest.soundEffects?.events;
  if (!rawEvents?.length) throw new Error("Render action timestamps are required");
  const actionTypes = new Set(["boot", "section", "move", "click", "pop", "paper", "finish"]);
  const actions = rawEvents.filter(event => actionTypes.has(event.type));
  const events = [];
  const counts = {};
  function add(time, family, gain, pan = 0) {
    const index = counts[family] ?? 0;
    counts[family] = index + 1;
    const pool = catalog[family];
    events.push({ time, family, source: pool[index % pool.length], gain, pan: Math.max(-0.6, Math.min(0.6, pan)) });
  }
  for (let index = 0; index < actions.length; index++) {
    const event = actions[index];
    const { time, type } = event;
    const pan = event.pan ?? 0;
    switch (type) {
      // Robot entrance and movement are intentionally silent.
      case "boot":
      case "move":
        break;
      case "click": {
        const opening = actions.slice(index + 1, index + 3).some(next => next.type === "pop" && next.time - time < 0.4);
        // An opening already has its own sound; avoid stacking the same three cues.
        if (!opening) add(time, "close", 0.15, pan);
        else add(time, "click", 0.10, pan);
        break;
      }
      case "pop": add(time, "open", 0.20, pan); break;
      case "paper":
        add(time, "paper", 0.24, -0.2);
        add(time + 0.15, "paper", 0.14, 0.2);
        break;
      case "finish":
        add(time, "finish", 0.24, -0.15);
        add(time + 0.35, "finish", 0.14, 0.15);
        break;
      // No repeated chapter beep. Chapter-specific recordings are cued below.
    }
  }
  const families = { PROJETS: "project", COMPÉTENCES: "skill", FORMATION: "formation", "QUALITÉS PERSONNELLES": "quality", LANGUES: "langues", DIVERS: "divers", CODE: "code", CONTACT: "contact" };
  for (const scene of manifest.scenes) {
    const family = families[scene.chapter];
    if (family) add(scene.start + 0.22, family, family === "formation" ? 0.13 : 0.23);
  }
  events.sort((a, b) => a.time - b.time);
  const decoded = new Map();
  for (const source of new Set(events.map(event => event.source))) {
    const file = resolve(root, "tools/tour-sounds", source + ".ogg");
    const result = await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file, "-t", "1.8", "-af", "highpass=f=100,lowpass=f=4500", "-ac", "1", "-ar", String(rate), "-f", "f32le", "pipe:1"], { encoding: "buffer", maxBuffer: 2 ** 20 });
    const buffer = result.stdout;
    const samples = new Float32Array(buffer.length / 4);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      samples[i] = buffer.readFloatLE(i * 4);
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    if (!peak) throw new Error(`Empty source recording: ${source}`);
    for (let i = 0; i < samples.length; i++) samples[i] /= peak;
    decoded.set(source, samples);
  }
  for (const event of events) {
    const samples = decoded.get(event.source);
    const start = Math.round(event.time * rate);
    const left = Math.sqrt((1 - event.pan) / 2);
    const right = Math.sqrt((1 + event.pan) / 2);
    for (let i = 0; i < samples.length && start + i < frames; i++) {
      if (start + i < 0) continue;
      // Short fades prevent trim clicks on longer mechanical recordings.
      const fade = Math.min(1, i / 100, (samples.length - i - 1) / 1200);
      const value = samples[i] * event.gain * fade;
      mix[(start + i) * 2] += value * left;
      mix[(start + i) * 2 + 1] += value * right;
    }
  }
  let peak = 0;
  for (const value of mix) peak = Math.max(peak, Math.abs(value));
  if (!peak) throw new Error("Sound effect mix is empty");
  const gain = Math.min(2, 0.65 / peak);
  const wav = Buffer.alloc(44 + mix.length * 2);
  wav.write("RIFF", 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(mix.length * 2, 40);
  for (let i = 0; i < mix.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix[i] * gain)) * 32767), 44 + i * 2);
  const work = resolve(root, ".tour-render");
  await mkdir(work, { recursive: true });
  const output = resolve(dirname(videoPath), "portfolio-tour-with-sfx.mp4");
  const wavPath = resolve(work, "portfolio-tour-sfx.wav");
  await writeFile(wavPath, wav);
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", videoPath, "-i", wavPath, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", String(rate), "-t", String(duration), "-movflags", "+faststart", output]);
  await rename(output, videoPath);
  manifest.audio = "Sample-based stereo sound design from Kenney Interface Sounds, Sci-fi Sounds and Impact Sounds (CC0). Gentle chapter cues and tactile controls; silent robot entrance and movement, no engines, footsteps, computer chatter or laser cues. Sources filtered to soften sharp high frequencies. AAC, 48 kHz.";
  manifest.soundEffects = { timingSource: "Recorded browser action timestamps", rawEvents: actions, events, distinctRecordings: decoded.size, sources: ["https://kenney.nl/assets/interface-sounds", "https://kenney.nl/assets/sci-fi-sounds", "https://kenney.nl/assets/impact-sounds"] };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Mixed ${events.length} cues using ${decoded.size} distinct recordings.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await addTourSfx({ videoPath: resolve(root, "assets/portfolio-tour-v5.mp4"), manifestPath: resolve(root, "assets/portfolio-tour-scenes.json") });
}
