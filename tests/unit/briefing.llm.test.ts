import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
vi.stubEnv('ANTHROPIC_API_KEY', 'test');

import { generateBriefingScript } from '@/lib/briefing/llm';

beforeEach(() => { fetchMock.mockReset(); });

describe('generateBriefingScript', () => {
  it('calls the API and parses JSON from a clean response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '{"title":"t","chapters":[]}' }],
      }),
    });
    const out = await generateBriefingScript('hello prompt');
    expect(out.title).toBe('t');
    expect(out.chapters).toEqual([]);
  });

  it('strips markdown code fences before parsing', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '```json\n{"title":"t","chapters":[]}\n```' }],
      }),
    });
    const out = await generateBriefingScript('p');
    expect(out.title).toBe('t');
  });

  it('retries on 5xx', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'fail' });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: '{"title":"t","chapters":[]}' }] }),
    });
    const out = await generateBriefingScript('p');
    expect(out.title).toBe('t');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws on invalid JSON after retries', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'not json' }] }),
    });
    await expect(generateBriefingScript('p')).rejects.toThrow();
  });
});
