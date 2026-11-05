const TRACKS = ['rain', 'drops', 'leaves'];
export const GARDEN_VOLUME_CHANNELS = ['master', ...TRACKS, 'dial', 'rabbit'];
const VOLUME_STORAGE_KEY = 'quiet-garden-volumes';

export function readGardenVolumes() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(VOLUME_STORAGE_KEY));
  } catch {
    // The mixer still works when storage is unavailable.
  }
  return Object.fromEntries(GARDEN_VOLUME_CHANNELS.map(channel => {
    const value = saved?.[channel];
    return [channel, Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 100];
  }));
}

export function createGardenAudio({ volumes, getTime, getSpeed, onReady, onError }) {
  let context;
  const gains = {};
  let ambientGain;
  let buffers;
  let loading;
  let sources = [];
  let enabled = false;
  let active = true;
  let disposed = false;
  let lastClick = -Infinity;
  let landingBuffer;
  const abort = new AbortController();

  function stopSources() {
    for (const source of sources) {
      try { source.stop(); } catch (_) { /* already stopped */ }
      source.disconnect();
    }
    sources = [];
  }

  function startSources() {
    if (disposed || !enabled || !active || !buffers || !context || getSpeed() <= 0) return;
    stopSources();
    for (const [index, buffer] of buffers.entries()) {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = getSpeed();
      source.connect(gains[TRACKS[index]]);
      source.start(0, getTime() % buffer.duration);
      sources.push(source);
    }
  }

  async function activate() {
    if (disposed || !enabled || (context?.state === 'running' && sources.length)) return;
    try {
      if (!context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('Audio unavailable');
        context = new AudioContext();
        context.onstatechange = () => {
          if (!disposed) onReady(context.state === 'running');
        };
        for (const channel of GARDEN_VOLUME_CHANNELS) {
          const gain = context.createGain();
          gain.gain.value = volumes[channel] / 100;
          gains[channel] = gain;
        }
        gains.master.connect(context.destination);
        ambientGain = context.createGain();
        ambientGain.gain.value = 0.65;
        ambientGain.connect(gains.master);
        for (const channel of TRACKS) gains[channel].connect(ambientGain);
        gains.dial.connect(gains.master);
        gains.rabbit.connect(gains.master);
      }
      // A user gesture can resume audio when autoplay is blocked.
      if (context.state !== 'running') await context.resume();
      if (disposed || !enabled) return;
      onReady(context.state === 'running');
      if (!loading) {
        loading = Promise.all(TRACKS.map(async (name) => {
          const response = await fetch(`${import.meta.env.BASE_URL}items/quiet-garden/${name}.wav`, { signal: abort.signal });
          if (!response.ok) throw new Error(`Audio ${response.status}`);
          return context.decodeAudioData(await response.arrayBuffer());
        })).then((result) => { buffers = result; });
      }
      await loading;
      if (!sources.length) startSources();
    } catch (error) {
      if (!disposed && error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
        loading = undefined;
        enabled = false;
        stopSources();
        onError();
      }
    }
  }

  return {
    setVolume(channel, value) {
      if (!GARDEN_VOLUME_CHANNELS.includes(channel) || !Number.isFinite(value)) return;
      volumes[channel] = Math.max(0, Math.min(100, value));
      gains[channel]?.gain.setTargetAtTime(volumes[channel] / 100, context.currentTime, 0.02);
      try {
        localStorage.setItem(VOLUME_STORAGE_KEY, JSON.stringify(volumes));
      } catch {
        // Keep the new setting for this visit even if it cannot be saved.
      }
    },
    setEnabled(value) {
      enabled = value;
      if (!value) stopSources();
      else void activate();
    },
    activate,
    sync() {
      if (!enabled || !context || !active) return;
      if (getSpeed() <= 0) stopSources();
      else if (!sources.length) startSources();
      else for (const source of sources) source.playbackRate.setTargetAtTime(getSpeed(), context.currentTime, 0.025);
    },
    setActive(value) {
      active = value;
      if (!value) stopSources();
      else if (enabled && context) void activate();
    },
    click(direction) {
      if (!enabled || !context || context.state !== 'running') return;
      const now = context.currentTime;
      if (now - lastClick < 0.04) return;
      lastClick = now;
      const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.014), context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (samples.length * 0.14));
      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = direction > 0 ? 1600 : 1100;
      filter.Q.value = 0.6;
      const gain = context.createGain();
      gain.gain.value = 0.025;
      source.connect(filter).connect(gain).connect(gains.dial);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start();
    },
    land() {
      if (!enabled || !active || volumes.master <= 0 || volumes.rabbit <= 0 || context?.state !== 'running') return;
      if (!landingBuffer) {
        landingBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.09), context.sampleRate);
        const samples = landingBuffer.getChannelData(0);
        let gravel = 0;
        for (let i = 0; i < samples.length; i++) {
          const time = i / context.sampleRate;
          gravel = gravel * 0.92 + (Math.random() * 2 - 1) * 0.08;
          const envelope = Math.min(1, time / 0.006) * (1 - i / samples.length) ** 2 * Math.exp(-time * 15);
          samples[i] = (Math.sin(2 * Math.PI * 195 * time) * 0.038 + gravel * 0.13) * envelope;
        }
      }
      const source = context.createBufferSource();
      source.buffer = landingBuffer;
      source.playbackRate.value = 0.92 + Math.random() * 0.16;
      source.connect(gains.rabbit);
      source.onended = () => source.disconnect();
      source.start();
    },
    dispose() {
      disposed = true;
      enabled = false;
      abort.abort();
      stopSources();
      if (context) void context.close();
      buffers = undefined;
    },
  };
}
