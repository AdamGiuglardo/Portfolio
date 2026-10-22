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
  const chapterAt = time => manifest.scenes.findLast(scene => scene.start <= time)?.chapter;
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
        const chapter = chapterAt(time);
        if (!["COMPÉTENCES", "FORMATION"].includes(chapter)) add(time, "click", 0.065, pan);
        break;
      }
      // A soft fixed-pitch felt tap marks openings only; no rising/falling sweep.
      case "pop": add(time, "soft-open", 0.085, pan); break;
      case "paper":
        add(time, "paper", 0.24, -0.2);
        add(time + 0.15, "paper", 0.14, 0.2);
        break;
      case "finish":
        break;
    }
  }
  // Sound follows the edit: an airy transition only on chapter changes.
  const transitions = manifest.scenes.filter((scene, index) => index > 0 && scene.chapter !== manifest.scenes[index - 1].chapter);
  let seed = 937;
  for (const scene of transitions) {
    const start = Math.round(Math.max(0, scene.start - 0.08) * rate);
    const length = Math.round(0.42 * rate);
    let filtered = 0;
    for (let i = 0; i < length && start + i < frames; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      filtered += 0.08 * (seed / 2147483648 - 1 - filtered);
      const value = filtered * Math.pow(Math.sin(Math.PI * i / length), 2) * 0.26;
      mix[(start + i) * 2] += value * (0.8 - 0.3 * i / length);
      mix[(start + i) * 2 + 1] += value * (0.5 + 0.3 * i / length);
    }
  }
  events.sort((a, b) => a.time - b.time);
  const decoded = new Map();
  for (const source of new Set(events.map(event => event.source))) {
    if (source === "original/felt-open") {
      const samples = new Float32Array(Math.round(rate * 0.30));
      for (let i = 0; i < samples.length; i++) {
        const t = i / rate;
        const attack = Math.pow(1 - Math.exp(-t / 0.014), 2);
        const release = Math.exp(-t / 0.060) * Math.pow(1 - i / samples.length, 2);
        // Low, rounded mallet body with a faint harmonic; no sharp transient.
        samples[i] = attack * release * (Math.sin(2 * Math.PI * 220 * t) + 0.10 * Math.sin(2 * Math.PI * 440 * t));
      }
      let peak = 0;
      for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
      for (let i = 0; i < samples.length; i++) samples[i] /= peak;
      decoded.set(source, samples);
      continue;
    }
    const file = resolve(root, "tools/tour-sounds", source + ".ogg");
    const result = await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-i", file, "-t", source.includes("impactWood") ? "0.065" : "0.5", "-af", "highpass=f=120,lowpass=f=2800", "-ac", "1", "-ar", String(rate), "-f", "f32le", "pipe:1"], { encoding: "buffer", maxBuffer: 2 ** 20 });
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
  const musicPath = resolve(root, "tools/tour-sounds/music/reverie-excerpt.mp3");
  const music = `[2:a]atrim=duration=${duration},asetpts=PTS-STARTPTS,loudnorm=I=-22:TP=-3:LRA=7,afade=t=in:d=1.6,afade=t=out:st=${duration - 3}:d=3[bed];[bed][1:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89:level=false[a]`;
  const creditPath = resolve(root, "tools/tour-sounds/music/credit.png");
  const filters = `[0:v][3:v]overlay=x=36:y=H-h-28:enable='gte(t,${duration - 7})'[v];${music}`;
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", videoPath, "-i", wavPath, "-i", musicPath, "-loop", "1", "-i", creditPath, "-filter_complex", filters, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-c:a", "aac", "-b:a", "192k", "-ar", String(rate), "-t", String(duration), "-metadata", "comment=Music: Reverie by Scott Buckley, CC BY 4.0, https://www.scottbuckley.com.au/library/reverie/ . Excerpt trimmed, faded and mixed with Kenney CC0 effects.", "-movflags", "+faststart", output]);
  await rename(output, videoPath);
  manifest.audio = "Continuous instrumental music bed: Reverie by Scott Buckley (CC BY 4.0), trimmed and faded. Short low-level dry taps, paper cues and gentle chapter transitions; gentle fixed-pitch felt tap on panel openings; no closing sounds during skills or education and no laser sweeps. Robot movement remains silent. AAC stereo, 48 kHz.";
  manifest.soundEffects = { timingSource: "Recorded browser action timestamps", rawEvents: actions, events, transitions: transitions.map(scene => scene.start), distinctRecordings: decoded.size, music: { title: "Reverie", artist: "Scott Buckley", license: "CC BY 4.0", source: "https://www.scottbuckley.com.au/library/reverie/", edits: "Excerpt from 8 seconds, normalized, faded and mixed under action effects" }, sources: ["https://kenney.nl/assets/interface-sounds", "https://kenney.nl/assets/impact-sounds"] };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Mixed ${events.length} cues using ${decoded.size} distinct recordings.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await addTourSfx({ videoPath: resolve(root, "assets/portfolio-tour-v8.mp4"), manifestPath: resolve(root, "assets/portfolio-tour-scenes.json") });
}
