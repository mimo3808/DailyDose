'use client';
export function CoverArt({ title }: { title: string }) {
  let hash = 0;
  for (const c of title) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const h1 = hash % 360;
  const h2 = (h1 + 40) % 360;
  return (
    <div
      className="cover-art"
      style={{ background: `linear-gradient(135deg, hsl(${h1} 65% 55%), hsl(${h2} 70% 35%))` }}
    >
      {title}
    </div>
  );
}
