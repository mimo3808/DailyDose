'use client';
export function GenerateButton({ disabled, loading, onClick }: { disabled: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn--primary btn--lg btn--full mt-4`}
    >
      {loading ? '生成中…（约 30-60 秒）' : '🎙 生成今日简报'}
    </button>
  );
}
