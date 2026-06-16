import type { ScriptJson } from '@/types';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-5';
const MAX_RETRIES = 2;

function stripCodeFence(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  return m ? m[1] : s;
}

function validateScript(j: any): asserts j is ScriptJson {
  if (!j || typeof j.title !== 'string' || !Array.isArray(j.chapters)) {
    throw new Error('invalid script shape');
  }
  for (const c of j.chapters) {
    if (typeof c.idx !== 'number' || typeof c.title !== 'string' || typeof c.script_text !== 'string' || !Array.isArray(c.source_refs)) {
      throw new Error('invalid chapter shape');
    }
  }
}

export async function generateBriefingScript(prompt: string): Promise<ScriptJson> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  let lastErr: unknown;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (res.status >= 500) {
      lastErr = new Error(`anthropic ${res.status}`);
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
      continue;
    }
    if (!res.ok) {
      throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    }
    const data: any = await res.json();
    const text = data?.content?.[0]?.text ?? '';
    try {
      const parsed = JSON.parse(stripCodeFence(text));
      validateScript(parsed);
      return parsed;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error('llm failed after retries');
}
