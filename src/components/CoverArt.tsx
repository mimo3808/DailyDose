'use client';
export function CoverArt({ title }: { title: string }) {
  // Gradient based on title hash
  let hash = 0;
  for (const c of title) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 60) % 360;
  return (
    <div
      style={{
        width: 240, height: 240, borderRadius: 24,
        background: `linear-gradient(135deg, hsl(${h1} 70% 60%), hsl(${h2} 70% 40%))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 22, fontWeight: 600,
        margin: '0 auto 16px', padding: 16, textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      {title}
    </div>
  );
}
