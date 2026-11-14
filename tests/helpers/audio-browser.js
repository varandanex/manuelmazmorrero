// Browser boundaries only: Web Audio, media, fetch and timers.
export function browserAudio() {
  const sources = [], gains = [], requests = [], timers = new Map();
  let nextTimer = 0, contexts = 0;
  const param = () => ({ value: 1, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, cancelScheduledValues() {} });
  const node = () => ({ connect(target) { this.target = target; return target; }, disconnect() { this.disconnected = true; } });
  const context = {
    state: 'suspended', currentTime: 0, destination: node(),
    resume() { this.state = 'running'; return Promise.resolve(); },
    decodeAudioData: async bytes => ({ id: new TextDecoder().decode(bytes), duration: .5 }),
    createGain() { const gain = { ...node(), gain: param() }; gains.push(gain); return gain; },
    createBufferSource() { const source = { ...node(), start(when) { this.started = when; }, stop() { this.stopped = true; this.onended?.(); } }; sources.push(source); return source; },
    createMediaElementSource() { return node(); },
    createDynamicsCompressor() { return { ...node(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() }; },
  };
  const media = { src: '', currentTime: 0, paused: true, loop: false, ended: false, playCount: 0,
    play() { this.paused = false; this.playCount++; return Promise.resolve(); }, pause() { this.paused = true; }, load() {}, addEventListener(type, fn) { this[`on${type}`] = fn; } };
  const options = {
    createContext() { contexts++; return context; }, createMedia: () => media,
    fetchFile: async url => { requests.push(url); return { ok: true, arrayBuffer: async () => new TextEncoder().encode(url).buffer }; },
    setTimer(fn, delay) { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; }, clearTimer(id) { timers.delete(id); },
  };
  return { options, context, media, sources, gains, requests, timers, get contexts() { return contexts; },
    advance(seconds) { context.currentTime += seconds; },
    flush() { const pending = [...timers.values()]; timers.clear(); for (const { fn } of pending) fn(); },
    live() { return sources.filter(s => !s.stopped); },
  };
}
