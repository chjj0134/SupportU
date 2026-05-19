import { createBrowserRouter, Navigate, Outlet, useNavigate, useParams } from 'react-router';
import { useAuthUser } from '../api/queries/useAuthQueries';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { PolicyListPage } from './components/PolicyListPage';
import { PolicyDetailPage } from './components/PolicyDetailPage';
import { MyPage } from './components/MyPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { Spinner } from './components/common/Spinner';
import { P } from './components/common/Typography';

/**
 * 인증된 사용자만 접근 가능한 라우트 가드.
 * 로딩 중에는 spinner, 비로그인 시 /login으로 리다이렉트.
 */
function ProtectedLayout() {
  const { data: user, isLoading } = useAuthUser();
  const navigate = useNavigate();

  if (isLoading) return <Spinner fullScreen label="로딩 중..." />;
  if (!user) return <Navigate to="/login" replace />;

  const handleNavigate = (page: string, id?: string) => {
    if (page === 'policy-detail' && id) navigate(`/policies/${id}`);
    else if (page === 'policies') navigate('/policies');
    else if (page === 'home') navigate('/');
    else if (page === 'mypage') navigate('/mypage');
    else if (page === 'settings') navigate('/settings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: 'Pretendard, sans-serif' }}>
      <Navbar
        currentPage={getCurrentPage()}
        onNavigate={(p) => handleNavigate(p)}
      />
      <Outlet context={{ onNavigate: handleNavigate }} />
    </div>
  );
}

function getCurrentPage(): 'home' | 'policies' | 'mypage' | 'settings' {
  const path = window.location.pathname;
  if (path.startsWith('/policies')) return 'policies';
  if (path.startsWith('/mypage')) return 'mypage';
  if (path.startsWith('/settings')) return 'settings';
  return 'home';
}

/**
 * 이미 로그인된 사용자는 /login 접근 시 홈으로 보낸다.
 */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useAuthUser();
  if (isLoading) return <Spinner fullScreen label="로딩 중..." />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Outlet context를 페이지 컴포넌트에서 쓰기 쉽게 래퍼 생성
function HomeRoute() {
  const navigate = useNavigate();
  const handleNavigate = (page: string, id?: string) => {
    if (page === 'policy-detail' && id) navigate(`/policies/${id}`);
    else navigate(page === 'home' ? '/' : `/${page}`);
  };
  return <HomePage onNavigate={handleNavigate} />;
}

function PoliciesRoute() {
  const navigate = useNavigate();
  const handleNavigate = (page: string, id?: string) => {
    if (page === 'policy-detail' && id) navigate(`/policies/${id}`);
    else navigate(page === 'home' ? '/' : `/${page}`);
  };
  return <PolicyListPage onNavigate={handleNavigate} />;
}

function PolicyDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const handleNavigate = (page: string, nextId?: string) => {
    if (page === 'policy-detail' && nextId) navigate(`/policies/${nextId}`);
    else navigate(page === 'home' ? '/' : `/${page}`);
  };
  return <PolicyDetailPage policyId={id ?? '1'} onNavigate={handleNavigate} />;
}

function MyPageRoute() {
  const navigate = useNavigate();
  const handleNavigate = (page: string, id?: string) => {
    if (page === 'policy-detail' && id) navigate(`/policies/${id}`);
    else navigate(page === 'home' ? '/' : `/${page}`);
  };
  return <MyPage onNavigate={handleNavigate} />;
}

function SettingsRoute() {
  return (
    <div
      className="min-h-screen pt-16 flex items-center justify-center"
      style={{ backgroundColor: '#f5fbf8' }}
    >
      <div className="text-center">
        <P style={{ fontSize: 24, color: '#3c4947', marginBottom: 8 }}>설정</P>
        <P style={{ fontSize: 16, color: '#94a3b8' }}>준비 중입니다.</P>
      </div>
    </div>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  return (
    <PublicOnlyRoute>
      <LoginPage
        onNavigate={() => navigate('/')}
        onSignup={() => navigate('/signup')}
      />
    </PublicOnlyRoute>
  );
}

function SignupRoute() {
  const navigate = useNavigate();
  return (
    <SignupPage
      onComplete={() => navigate('/', { replace: true })}
      onCancel={() => navigate('/login')}
    />
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginRoute /> },
  { path: '/signup', element: <SignupRoute /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <HomeRoute /> },
      { path: 'policies', element: <PoliciesRoute /> },
      { path: 'policies/:id', element: <PolicyDetailRoute /> },
      { path: 'mypage', element: <MyPageRoute /> },
      { path: 'settings', element: <SettingsRoute /> },
    ],
  },
]);
