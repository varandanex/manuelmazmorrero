import { CUES, MUSIC, IMPACTS, DANGERS, TERMINALS } from './audio-config.js';

export function createAudio({
  createContext = () => new (window.AudioContext || window.webkitAudioContext)(),
  fetchFile = url => fetch(url),
  createMedia = () => new Audio(),
  onChange = () => {},
  setTimer = (fn, delay) => setTimeout(fn, delay), clearTimer = id => clearTimeout(id),
} = {}) {
  let context, effectsGain, musicGain, media, loading, enabled = false, scene = 'lobby', currentTrack = null;
  let paused = false, background = false, musicWaiting = false;
  let musicEpoch = 0, musicError = '', error = '';
  const pending = new Set();
  const volumes = { effects: .7, music: .45 };
  const buffers = new Map(), voices = new Map(), missing = new Set();
  const variants = new Map(), lastPlayed = new Map();
  const status = () => ({ enabled, scene, paused, background, musicError, error, volumes: { ...volumes }, ready: !!loading && buffers.size + missing.size === 31, missing: [...missing] });
  const notify = () => onChange(status());
  function later(callback, seconds) {
    const id = setTimer(() => { pending.delete(id); callback(); }, seconds * 1000);
    pending.add(id);
  }
  function stopEffects() {
    for (const id of pending) clearTimer(id);
    pending.clear(); musicWaiting = false; musicEpoch++;
    for (const voice of [...voices.keys()]) { voice.stop(); voice.disconnect(); }
    voices.clear(); lastPlayed.clear();
  }
  async function unlock() {
    if (!enabled) return;
    try {
      if (!context) {
        context = createContext(); effectsGain = context.createGain();
        const compressor = context.createDynamicsCompressor(), master = context.createGain();
        compressor.threshold.value = -12; compressor.knee.value = 12; compressor.ratio.value = 8;
        compressor.attack.value = .003; compressor.release.value = .15;
        master.gain.value = .8; compressor.connect(master); master.connect(context.destination);
        effectsGain.connect(compressor);
        musicGain = context.createGain(); musicGain.connect(compressor);
        media = createMedia(); media.preload = 'none';
        media.addEventListener('error', () => { if (enabled && MUSIC[scene]) { musicError = 'load'; notify(); } });
        context.createMediaElementSource(media).connect(musicGain);
        applyVolumes();
      }
      const resumed = context.resume();
      syncMusic();
      await resumed;
      loading ||= Promise.all(Object.values(CUES).flatMap(cue => cue.files).map(async file => {
        try {
          const response = await fetchFile(`/assets/audio/sfx/${file}`);
          if (!response.ok) throw new Error('Missing effect');
          buffers.set(file, await context.decodeAudioData(await response.arrayBuffer()));
        } catch { missing.add(file); }
      })).then(notify);
      await loading;
    } catch { enabled = false; error = 'unavailable'; stopEffects(); media?.pause(); notify(); }
  }
  function setEnabled(value) {
    enabled = !!value;
    if (!enabled) { stopEffects(); media?.pause(); }
    notify(); return enabled ? unlock() : Promise.resolve();
  }
  function applyVolumes() {
    if (!context) return;
    effectsGain.gain.cancelScheduledValues(context.currentTime);
    musicGain.gain.cancelScheduledValues(context.currentTime);
    effectsGain.gain.setValueAtTime(volumes.effects, context.currentTime);
    musicGain.gain.setValueAtTime(volumes.music * .5 * (MUSIC[scene]?.trim || 1), context.currentTime);
  }
  function setVolumes(next) {
    for (const channel of ['effects', 'music']) if (Number.isFinite(next[channel])) volumes[channel] = Math.max(0, Math.min(1, next[channel]));
    applyVolumes(); notify();
  }
  function syncMusic() {
    if (!media || !enabled) return;
    if (paused || background || musicWaiting) { media.pause(); return; }
    const track = MUSIC[scene];
    if (!track) { media.pause(); currentTrack = null; return; }
    const changed = currentTrack !== scene;
    if (changed) {
      media.pause(); media.src = `/assets/audio/${encodeURIComponent(track.file)}`;
      media.loop = track.loop; currentTrack = scene;
    }
    applyVolumes();
    if (changed) {
      const target = musicGain.gain.value;
      musicGain.gain.cancelScheduledValues(context.currentTime);
      musicGain.gain.setValueAtTime(0, context.currentTime);
      musicGain.gain.linearRampToValueAtTime(target, context.currentTime + .25);
    }
    if (media.paused && (changed || !media.ended)) {
      const epoch = ++musicEpoch;
      media.play().then(() => { if (epoch === musicEpoch) { musicError = ''; notify(); } })
        .catch(() => { if (epoch === musicEpoch && enabled && !paused && !background) { musicError = 'playback'; notify(); } });
    }
  }
  function setScene(next, { restart = false, musicDelay = 0 } = {}) {
    if (next === scene && !restart) return;
    stopEffects(); scene = next; musicError = '';
    if (restart) { currentTrack = null; }
    if (musicDelay && enabled && !paused && !background) {
      media?.pause(); musicWaiting = true;
      later(() => { musicWaiting = false; syncMusic(); }, musicDelay);
    } else syncMusic();
    notify();
  }
  function handleEvents(events, state) {
    const names = events.filter(e => e.type === 'sound').map(e => e.name);
    const terminal = state.mode === 'dead' ? 'player_death' : state.mode === 'won' ? 'victory' : state.mode === 'upgrade' ? 'boss_defeat' : null;
    if (terminal && names.includes(terminal)) {
      setScene(state.mode, { restart: true, musicDelay: CUES[terminal].duration + .05 });
      play(terminal); return;
    }
    if (events.some(e => e.type === 'floor')) {
      setScene(`floor${state.floor}`, { restart: true }); setPaused(false);
      const prefix = names.includes('retry') ? 'retry' : names.includes('upgrade_select') ? 'upgrade_select' : null;
      if (prefix && play(prefix)) later(() => play('floor_start'), CUES[prefix].duration + .05);
      else play('floor_start');
      return;
    }
    for (const name of names) play(name);
  }
  function setPaused(value) {
    paused = !!value;
    if (paused) { stopEffects(); media?.pause(); } else syncMusic();
    notify();
  }
  function setBackground(value) {
    background = !!value;
    if (background) { stopEffects(); media?.pause(); } else syncMusic();
    notify();
  }
  function play(name) {
    const cue = CUES[name];
    if (!enabled || background || (paused && name !== 'ui_confirm') || context?.state !== 'running' || !cue || !volumes.effects) return false;
    const index = variants.get(name) || 0, buffer = buffers.get(cue.files[index % cue.files.length]);
    if (!buffer || context.currentTime - (lastPlayed.get(name) ?? -Infinity) < (IMPACTS.has(name) ? .065 : .04)) return false;
    const group = IMPACTS.has(name) ? 'impact' : DANGERS.has(name) ? 'danger' : 'other';
    const priority = TERMINALS.has(name) ? 100 : DANGERS.has(name) ? 80 : ['shield_break', 'host_phase_two', 'boss_intro'].includes(name) ? 70 : IMPACTS.has(name) ? 30 : 20;
    const groupLimit = group === 'impact' ? 2 : group === 'danger' ? 3 : 6;
    const groupVoices = [...voices].filter(([, info]) => info.group === group);
    if (groupVoices.length >= groupLimit) { groupVoices[0][0].stop(); voices.delete(groupVoices[0][0]); }
    if (voices.size >= 6) {
      const [weakest, info] = [...voices].sort((a, b) => a[1].priority - b[1].priority)[0];
      if (info.priority > priority) return false;
      weakest.stop(); voices.delete(weakest);
    }
    const source = context.createBufferSource(); source.buffer = buffer;
    source.connect(effectsGain); source.onended = () => { voices.delete(source); source.disconnect(); };
    voices.set(source, { group, priority }); variants.set(name, index + 1); lastPlayed.set(name, context.currentTime);
    source.start(context.currentTime); return true;
  }
  return { setEnabled, unlock, play, status, setScene, setVolumes, setPaused, setBackground, handleEvents };
}
