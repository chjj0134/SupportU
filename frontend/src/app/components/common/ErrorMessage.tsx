import { P } from './Typography';

interface ErrorMessageProps {
  error: Error | null;
  onRetry?: () => void;
  message?: string;
}

export function ErrorMessage({ error, onRetry, message }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(186,26,26,0.1)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V13M12 16V16.5" stroke="#ba1a1a" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="10" stroke="#ba1a1a" strokeWidth="2" />
        </svg>
      </div>
      <P style={{ fontSize: 16, fontWeight: 600, color: '#171d1c' }}>
        {message ?? '데이터를 불러오지 못했습니다.'}
      </P>
      <P style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 360 }}>
        {error.message}
      </P>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded-lg transition-all hover:opacity-90"
          style={{
            fontFamily: 'Pretendard, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            backgroundColor: '#006a63',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
