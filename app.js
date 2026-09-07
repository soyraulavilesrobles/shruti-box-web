const TONIC_BASE_FREQ = 130.81; // C3, base "Sa" octave for a shruti-box-like register
const FADE_TIME = 0.6; // seconds, avoids clicks and mimics bellows swell

let audioCtx = null;
let compressor = null;
let outputEl = null;
const drones = new Map(); // button -> { oscA, oscB, lfo, gain, filter }

function setupMediaSession() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: "Caja Shruti Virtual",
    artist: "Bordón continuo",
  });
  navigator.mediaSession.setActionHandler("play", () => ensureContext());
  navigator.mediaSession.setActionHandler("pause", stopAllDrones);
  navigator.mediaSession.setActionHandler("stop", stopAllDrones);
}

function updatePlaybackState() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = drones.size > 0 ? "playing" : "paused";
}

function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    compressor = audioCtx.createDynamicsCompressor();

    // Enrutamos toda la salida a través de un <audio> real (vía MediaStreamDestination)
    // en vez de audioCtx.destination directo: los navegadores móviles solo permiten que
    // el sonido siga con la pantalla apagada cuando viene de un elemento de medios real,
    // no de un AudioContext "puro" — que se suspende al pasar a segundo plano.
    const streamDest = audioCtx.createMediaStreamDestination();
    compressor.connect(streamDest);

    outputEl = document.getElementById("output");
    outputEl.srcObject = streamDest.stream;

    setupMediaSession();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  if (outputEl && outputEl.paused) {
    outputEl.play().catch(() => {});
  }
  return audioCtx;
}

function currentTonicFreq() {
  const semitone = parseInt(document.getElementById("tonic").value, 10);
  return TONIC_BASE_FREQ * Math.pow(2, semitone / 12);
}

function freqForDrone(semitonesFromTonic) {
  return currentTonicFreq() * Math.pow(2, semitonesFromTonic / 12);
}

function startDrone(button) {
  const ctx = ensureContext();
  const semitones = parseInt(button.dataset.semitones, 10);
  const freq = freqForDrone(semitones);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + FADE_TIME);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.7;

  // two slightly detuned oscillators, reed-like beating
  const oscA = ctx.createOscillator();
  oscA.type = "sawtooth";
  oscA.frequency.value = freq;
  oscA.detune.value = -4;

  const oscB = ctx.createOscillator();
  oscB.type = "sawtooth";
  oscB.frequency.value = freq;
  oscB.detune.value = 4;

  // slow vibrato, like a reed's natural pitch wobble
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 4.5 + Math.random() * 1.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 3; // cents-scale wobble via detune

  lfo.connect(lfoGain);
  lfoGain.connect(oscA.detune);
  lfoGain.connect(oscB.detune);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  gain.connect(compressor);

  oscA.start();
  oscB.start();
  lfo.start();

  drones.set(button, { oscA, oscB, lfo, gain, filter });
  button.classList.add("active");
  updatePlaybackState();
}

function stopDrone(button) {
  const d = drones.get(button);
  if (!d) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  d.gain.gain.cancelScheduledValues(now);
  d.gain.gain.setValueAtTime(d.gain.gain.value, now);
  d.gain.gain.linearRampToValueAtTime(0, now + FADE_TIME);

  setTimeout(() => {
    d.oscA.stop();
    d.oscB.stop();
    d.lfo.stop();
  }, FADE_TIME * 1000 + 50);

  drones.delete(button);
  button.classList.remove("active");
  updatePlaybackState();
}

function stopAllDrones() {
  Array.from(drones.keys()).forEach(stopDrone);
}

function updateAllFrequencies() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  drones.forEach((d, button) => {
    const semitones = parseInt(button.dataset.semitones, 10);
    const freq = freqForDrone(semitones);
    d.oscA.frequency.setTargetAtTime(freq, now, 0.05);
    d.oscB.frequency.setTargetAtTime(freq, now, 0.05);
  });
}

document.querySelectorAll(".drone-btn").forEach((button) => {
  button.addEventListener("click", () => {
    if (drones.has(button)) {
      stopDrone(button);
    } else {
      startDrone(button);
    }
  });
});

document.getElementById("tonic").addEventListener("change", updateAllFrequencies);

document.getElementById("stopAll").addEventListener("click", stopAllDrones);
