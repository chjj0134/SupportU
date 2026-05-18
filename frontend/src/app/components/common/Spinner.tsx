import { P } from './Typography';

interface SpinnerProps {
  size?: number;
  color?: string;
  label?: string;
  fullScreen?: boolean;
}

export function Spinner({
  size = 48,
  color = '#006a63',
  label,
  fullScreen = false,
}: SpinnerProps) {
  const wrapper = fullScreen
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div className={wrapper} style={fullScreen ? { backgroundColor: '#f5fbf8' } : undefined}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="rounded-full border-4 animate-spin"
          style={{
            width: size,
            height: size,
            borderColor: color,
            borderTopColor: 'transparent',
          }}
        />
        {label && <P style={{ color: '#64748b', fontSize: 15 }}>{label}</P>}
      </div>
    </div>
  );
}
