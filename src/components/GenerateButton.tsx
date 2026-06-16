'use client';
export function GenerateButton({ disabled, loading, onClick }: { disabled: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '14px 28px',
        fontSize: 18,
        background: disabled ? '#999' : 'var(--accent)',
        color: '#fff',
        border: 'none',
        borderRadius: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
        marginTop: 24,
      }}
    >
      {loading ? '生成中…（约 30-60 秒）' : '生成今日简报'}
    </button>
  );
}
