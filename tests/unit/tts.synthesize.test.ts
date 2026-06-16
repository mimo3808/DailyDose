import { describe, it, expect, vi } from 'vitest';

class FakeUtterance {
  text: string;
  rate = 1;
  voice: any = null;
  onend: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  constructor(t: string) { this.text = t; }
}

const speakMock = vi.fn();
const cancelMock = vi.fn();
const getVoicesMock = vi.fn().mockReturnValue([{ name: 'zh-CN-A', lang: 'zh-CN' }]);
const pauseMock = vi.fn();
const resumeMock = vi.fn();

vi.stubGlobal('window', {
  speechSynthesis: {
    speak: speakMock,
    cancel: cancelMock,
    getVoices: getVoicesMock,
    pause: pauseMock,
    resume: resumeMock,
  },
  SpeechSynthesisUtterance: FakeUtterance,
});

vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);

import { createTts } from '@/lib/tts/synthesize';

describe('createTts', () => {
  it('lists voices', () => {
    const tts = createTts();
    expect(tts.listVoices()).toEqual([{ name: 'zh-CN-A', lang: 'zh-CN' }]);
  });

  it('chunks long text into <= 5000 char utterances', () => {
    const tts = createTts();
    const long = 'a'.repeat(12_000);
    tts.speak(long, { onDone: () => {} });
    // 12000 / 5000 = 3 chunks (5000, 5000, 2000)
    expect(speakMock).toHaveBeenCalledTimes(3);
  });

  it('sets rate from options', () => {
    speakMock.mockClear();
    const tts = createTts();
    tts.speak('hi', { rate: 1.5, onDone: () => {} });
    const call = speakMock.mock.calls[0][0] as FakeUtterance;
    expect(call.rate).toBe(1.5);
  });

  it('stop cancels pending speech', () => {
    const tts = createTts();
    tts.speak('x', { onDone: () => {} });
    tts.stop();
    expect(cancelMock).toHaveBeenCalled();
  });
});
