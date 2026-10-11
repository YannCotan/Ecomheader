// Ambiance lo-fi synthétisée (Web Audio) : accords doux, basse, kick et charleston. Démarre sur clic.
const CHORDS = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 349.23], // G7
];
const BPM = 74;

export function createLofi() {
  let ctx = null, master = null, timer = null, nextBeat = 0, beat = 0, playing = false, noiseBuf = null, lastKick = -10;

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function pad(freqs, t, dur) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.1, t + 0.5); g.gain.linearRampToValueAtTime(0, t + dur);
    lp.connect(g); g.connect(master);
    freqs.forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = (i - 1.5) * 6; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
  }
  function tone(f, t, dur, vol, type = 'sine') {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.3);
  }
  function hat(t, vol) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(hp); hp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.1);
  }
  function schedule() {
    const spb = 60 / BPM;
    while (nextBeat < ctx.currentTime + 0.25) {
      const bar = Math.floor(beat / 4) % CHORDS.length, b = beat % 4, ch = CHORDS[bar];
      if (b === 0) { pad(ch, nextBeat, spb * 4.2); tone(ch[0] / 2, nextBeat, spb * 1.8, 0.22); }
      if (b === 2) tone(ch[0] / 2, nextBeat, spb * 1.2, 0.16);
      if (b === 0 || b === 2) { kick(nextBeat); lastKick = nextBeat; }
      hat(nextBeat + spb / 2, 0.05); if (b % 2 === 1) hat(nextBeat, 0.03);
      if (b === 1 || b === 3) tone(ch[(beat * 3) % 4] * 2, nextBeat + spb * 0.5, 0.5, 0.05, 'triangle');
      nextBeat += spb; beat++;
    }
  }
  return {
    toggle() {
      if (!ctx) init();
      if (ctx.state === 'suspended') ctx.resume();
      playing = !playing;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(playing ? 0.55 : 0, ctx.currentTime + 0.6);
      if (playing) { nextBeat = ctx.currentTime + 0.1; beat = 0; schedule(); timer = setInterval(schedule, 100); }
      else { clearInterval(timer); }
      return playing;
    },
    stop() { if (playing) this.toggle(); },
    get playing() { return playing; },
    // pulsation 0..1, synchronisée sur le dernier kick
    pulse() { return playing && ctx ? Math.exp(-Math.max(0, ctx.currentTime - lastKick) * 7) : 0; },
  };
}
