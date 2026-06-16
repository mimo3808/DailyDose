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
        style={{ width: '100%' }}
      />
      <p>{value} 分钟</p>
    </div>
  );
}
