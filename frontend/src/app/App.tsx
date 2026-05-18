import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { PolicyListPage } from './components/PolicyListPage';
import { PolicyDetailPage } from './components/PolicyDetailPage';
import { MyPage } from './components/MyPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Spinner } from './components/common/Spinner';
import { P } from './components/common/Typography';
import { useAuth } from './contexts/AuthContext';

type Page = 'home' | 'policies' | 'policy-detail' | 'mypage' | 'settings';

export default function App() {
  const { status, refresh, setAuthenticated } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('1');

  const navigate = (page: string, id?: string) => {
    if (page === 'policy-detail' && id) {
      setSelectedPolicyId(id);
    }
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = async () => {
    await refresh();
    setCurrentPage('home');
  };

  const handleSignupComplete = async () => {
    setShowSignup(false);
    // 회원가입 후 서버 세션에서 최신 사용자 정보를 다시 조회
    // 백엔드 OAuth 미연결 상태에서도 화면 진입은 가능하도록 fallback
    await refresh();
    if (status !== 'authenticated') setAuthenticated(null);
    setCurrentPage('home');
  };

  if (status === 'loading') {
    return <Spinner fullScreen label="로딩 중..." />;
  }

  if (showSignup) {
    return <SignupPage onComplete={handleSignupComplete} onCancel={() => setShowSignup(false)} />;
  }

  if (status === 'unauthenticated') {
    return <LoginPage onNavigate={handleLoginSuccess} onSignup={() => setShowSignup(true)} />;
  }

  const navPage = (currentPage === 'policy-detail' ? 'policies' : currentPage) as
    | 'home'
    | 'policies'
    | 'mypage'
    | 'settings';

  return (
    <div style={{ fontFamily: 'Pretendard, sans-serif' }}>
      <Navbar currentPage={navPage} onNavigate={(p) => navigate(p)} />

      {currentPage === 'home' && <HomePage onNavigate={navigate} />}
      {currentPage === 'policies' && <PolicyListPage onNavigate={navigate} />}
      {currentPage === 'policy-detail' && (
        <PolicyDetailPage policyId={selectedPolicyId} onNavigate={navigate} />
      )}
      {currentPage === 'mypage' && <MyPage onNavigate={navigate} />}
      {currentPage === 'settings' && (
        <div
          className="min-h-screen pt-16 flex items-center justify-center"
          style={{ backgroundColor: '#f5fbf8' }}
        >
          <div className="text-center">
            <P style={{ fontSize: 24, color: '#3c4947', marginBottom: 8 }}>설정</P>
            <P style={{ fontSize: 16, color: '#94a3b8' }}>준비 중입니다.</P>
          </div>
        </div>
      )}
    </div>
  );
}
