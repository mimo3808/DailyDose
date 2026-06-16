type Utterance = {
  text: string;
  rate: number;
  voice: SpeechSynthesisVoice | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
};

type SpeakOptions = {
  rate?: number;
  voice?: SpeechSynthesisVoice | null;
  voiceName?: string;
  onDone?: () => void;
  onError?: (e: any) => void;
};

const MAX_CHUNK = 5000;

function chunkText(s: string): string[] {
  if (s.length <= MAX_CHUNK) return [s];
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    out.push(s.slice(i, i + MAX_CHUNK));
    i += MAX_CHUNK;
  }
  return out;
}

export function createTts() {
  if (typeof window === 'undefined') {
    return {
      listVoices: () => [],
      speak: () => {},
      stop: () => {},
      pause: () => {},
      resume: () => {},
      isSpeaking: () => false,
    };
  }
  const synth = window.speechSynthesis;
  return {
    listVoices: () => synth.getVoices() ?? [],
    speak: (text: string, opts: SpeakOptions = {}) => {
      synth.cancel();
      const chunks = chunkText(text);
      // Resolve voice by name or use the one passed directly
      let selectedVoice: SpeechSynthesisVoice | null = opts.voice ?? null;
      if (!selectedVoice && opts.voiceName) {
        selectedVoice = synth.getVoices().find(v => v.name === opts.voiceName) ?? null;
      }
      chunks.forEach((c, idx) => {
        const u = new SpeechSynthesisUtterance(c);
        u.rate = opts.rate ?? 1;
        if (selectedVoice) u.voice = selectedVoice;
        if (idx === chunks.length - 1) {
          u.onend = () => opts.onDone?.();
          u.onerror = e => opts.onError?.(e);
        }
        synth.speak(u);
      });
    },
    stop: () => synth.cancel(),
    pause: () => synth.pause(),
    resume: () => synth.resume(),
    isSpeaking: () => synth.speaking ?? false,
  };
}
