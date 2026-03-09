import { create } from 'zustand';

interface AudioState {
    volume: number;
    muted: boolean;
    playing: boolean;
    setVolume: (v: number) => void;
    toggleMute: () => void;
    play: () => void;
    initOnInteraction: () => void;
}

const STORAGE_KEY = 'rekkaimon_audio';
const DEFAULT_VOLUME = 0.15;

function loadPrefs(): { volume: number; muted: boolean } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { volume: DEFAULT_VOLUME, muted: false };
}

function savePrefs(volume: number, muted: boolean) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, muted }));
}

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
    if (!audio) {
        audio = new Audio('/audio/Sala Libro.mp3');
        audio.loop = true;
        audio.preload = 'auto';
    }
    return audio;
}

function applyVolume(volume: number, muted: boolean) {
    const el = getAudio();
    el.volume = muted ? 0 : volume;
}

export const useAudioStore = create<AudioState>((set, get) => {
    const prefs = loadPrefs();

    return {
        volume: prefs.volume,
        muted: prefs.muted,
        playing: false,

        setVolume: (v: number) => {
            const clamped = Math.max(0, Math.min(1, v));
            applyVolume(clamped, get().muted);
            savePrefs(clamped, get().muted);
            set({ volume: clamped });
        },

        toggleMute: () => {
            const newMuted = !get().muted;
            applyVolume(get().volume, newMuted);
            savePrefs(get().volume, newMuted);
            set({ muted: newMuted });
        },

        play: () => {
            const el = getAudio();
            applyVolume(get().volume, get().muted);
            el.play().then(() => set({ playing: true })).catch(() => { /* blocked */ });
        },

        initOnInteraction: () => {
            if (get().playing) return;
            get().play();
        },
    };
});
