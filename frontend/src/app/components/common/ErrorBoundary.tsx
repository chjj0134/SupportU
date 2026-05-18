import { Component, type ErrorInfo, type ReactNode } from 'react';
import { P } from './Typography';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 렌더 트리에서 throw된 에러를 잡아 fallback UI를 보여준다.
 * 어떤 화면이 깨져도 화이트 스크린 대신 사용자에게 의미 있는 메시지를 표시한다.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      return (
        <div
          className="min-h-screen flex items-center justify-center px-6"
          style={{ backgroundColor: '#f5fbf8' }}
        >
          <div className="text-center max-w-md flex flex-col items-center gap-3">
            <div className="text-6xl">⚠️</div>
            <P style={{ fontSize: 22, fontWeight: 700, color: '#171d1c' }}>
              화면을 표시하는 중 오류가 발생했습니다
            </P>
            <P style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              {this.state.error.message}
            </P>
            <button
              onClick={this.handleReset}
              className="mt-4 px-6 py-3 rounded-xl transition-all hover:opacity-90"
              style={{
                fontFamily: 'Pretendard, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                backgroundColor: '#006a63',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
