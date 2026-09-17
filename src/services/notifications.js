// Web Audio API Synthesizer & Browser Notifications

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const SOUND_PROFILES = [
  { id: 'crystal', label: 'Melodic Crystal', description: 'Sweet uplifting 4-note chime', emoji: '✨' },
  { id: 'radar', label: 'Pulse Radar', description: 'Crisp dual ping alert', emoji: '📡' },
  { id: 'marimba', label: 'Gentle Marimba', description: 'Warm ambient acoustic chord', emoji: '🪵' },
  { id: 'subtle', label: 'Subtle Tick', description: 'Discreet minimal double blip', emoji: '💧' },
];

/**
 * Play a customizable arrival chime using Web Audio API
 */
export function playArrivalChime(profile = 'crystal') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (profile === 'radar') {
      // Crisp radar dual ping
      const pings = [
        { freq: 1200, time: 0.0, duration: 0.22, gain: 0.28 },
        { freq: 1600, time: 0.14, duration: 0.35, gain: 0.32 },
      ];
      pings.forEach((p) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.freq, now + p.time);
        gain.gain.setValueAtTime(0, now + p.time);
        gain.gain.linearRampToValueAtTime(p.gain, now + p.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.time + p.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + p.time);
        osc.stop(now + p.time + p.duration);
      });
      return;
    }

    if (profile === 'marimba') {
      // Warm acoustic triad chord (E4, G#4, B4, E5)
      const chord = [
        { freq: 329.63, time: 0.0, duration: 0.6, gain: 0.26 },
        { freq: 415.30, time: 0.04, duration: 0.6, gain: 0.24 },
        { freq: 493.88, time: 0.08, duration: 0.65, gain: 0.26 },
        { freq: 659.25, time: 0.12, duration: 0.8, gain: 0.22 },
      ];
      chord.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);
        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(n.gain, now + n.time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.duration);
      });
      return;
    }

    if (profile === 'subtle') {
      // Soft gentle blip
      const blips = [
        { freq: 740, time: 0.0, duration: 0.12, gain: 0.16 },
        { freq: 880, time: 0.08, duration: 0.18, gain: 0.18 },
      ];
      blips.forEach((b) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(b.freq, now + b.time);
        gain.gain.setValueAtTime(0, now + b.time);
        gain.gain.linearRampToValueAtTime(b.gain, now + b.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + b.time + b.duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + b.time);
        osc.stop(now + b.time + b.duration);
      });
      return;
    }

    // Default: 'crystal' (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: 0.00, duration: 0.45, gain: 0.22, type: 'sine' },
      { freq: 659.25, time: 0.09, duration: 0.45, gain: 0.24, type: 'sine' },
      { freq: 783.99, time: 0.18, duration: 0.50, gain: 0.26, type: 'sine' },
      { freq: 1046.50, time: 0.27, duration: 0.75, gain: 0.32, type: 'triangle' },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0, now + n.time);
      gain.gain.linearRampToValueAtTime(n.gain, now + n.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration);
    });

  } catch (err) {
    console.warn('Audio playback not allowed or failed:', err);
  }
}

/**
 * Preview sound tone on user click
 */
export function playSoundPreview(profile = 'crystal') {
  playArrivalChime(profile);
}

/**
 * Play a departure notification tone
 */
export function playDepartureChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Descending two tones
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(587.33, now + 0.18);
    gain2.gain.setValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('Audio playback failed:', err);
  }
}

/**
 * Trigger device hardware vibration (for mobile devices)
 */
export function triggerVibration(pattern = [500, 200, 500, 200, 800]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignored
    }
  }
}


/**
 * Request system notification permission
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return 'denied';
  }
}

/**
 * Dispatch desktop / mobile browser system notification
 */
export function sendNotification(title, options = {}) {
  // Try vibration & chime sound first
  if (options.tag === 'departure') {
    playDepartureChime();
  } else {
    playArrivalChime(options.soundProfile || 'crystal');
  }
  triggerVibration();

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options.body || '',
        icon: '/favicon.svg',
        tag: options.tag || 'georemind-alert',
        renotify: true,
        requireInteraction: true,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return notif;
    } catch (err) {
      console.warn('Could not display system notification:', err);
    }
  }
  return null;
}
