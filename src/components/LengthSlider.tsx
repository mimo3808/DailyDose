'use client';
export function LengthSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <h3>简报时长（分钟）</h3>
      <input
        type="range"
        min={3}
        max={15}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="slider mt-2"
      />
      <p className="text-muted mt-2">{value} 分钟 · 约 {value * 2} 个章节</p>
    </div>
  );
}
