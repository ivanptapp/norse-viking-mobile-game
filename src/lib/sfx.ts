// Efectos de sonido sintetizados con WebAudio (sin assets externos)
let ctx: AudioContext | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = typeof window !== "undefined" && window.localStorage?.getItem("valhalla_muted") === "1";

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem("valhalla_muted", m ? "1" : "0"); } catch { /* noop */ }
}

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}

function noise(c: AudioContext, dur: number, vol: number, type: BiquadFilterType, freq: number, freqEnd?: number) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = c.createBufferSource(); src.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, c.currentTime);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, c.currentTime + dur);
  const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(); src.stop(c.currentTime + dur);
}

function tone(c: AudioContext, freq: number, dur: number, type: OscillatorType, vol: number, freqEnd?: number, delay = 0) {
  const o = c.createOscillator(); o.type = type;
  const t = c.currentTime + delay;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

export type SfxName = "hit" | "crit" | "shoot" | "cast" | "heal" | "ult" | "win" | "lose" | "death" | "dash" | "horn";

export function sfx(name: SfxName) {
  if (muted) return;
  const c = ac(); if (!c) return;
  try {
    switch (name) {
      case "hit": noise(c, 0.12, 0.45, "lowpass", 900, 200); tone(c, 140, 0.1, "square", 0.07, 60); break;
      case "crit": noise(c, 0.22, 0.6, "lowpass", 1400, 150); tone(c, 220, 0.2, "sawtooth", 0.1, 50); break;
      case "shoot": noise(c, 0.18, 0.3, "bandpass", 2500, 600); break;
      case "dash": noise(c, 0.16, 0.18, "bandpass", 500, 1600); break;
      case "cast": tone(c, 520, 0.3, "sine", 0.07, 1040); break;
      case "heal": tone(c, 660, 0.25, "sine", 0.09); tone(c, 880, 0.3, "sine", 0.09, undefined, 0.12); break;
      case "ult": tone(c, 90, 0.9, "sawtooth", 0.12, 30); noise(c, 0.8, 0.35, "lowpass", 400, 60); tone(c, 440, 0.5, "triangle", 0.05, 880, 0.1); break;
      case "death": tone(c, 300, 0.4, "sawtooth", 0.07, 50); break;
      case "horn": tone(c, 196, 0.7, "sawtooth", 0.08, 220); tone(c, 294, 0.6, "triangle", 0.06, undefined, 0.35); break;
      case "win": [523, 659, 784, 1047].forEach((f, i) => tone(c, f, 0.35, "triangle", 0.11, undefined, i * 0.14)); break;
      case "lose": [392, 330, 262].forEach((f, i) => tone(c, f, 0.45, "triangle", 0.09, undefined, i * 0.22)); break;
    }
  } catch { /* noop */ }
}
