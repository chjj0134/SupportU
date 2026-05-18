import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { HomePage } from "./components/HomePage";
import { PolicyListPage } from "./components/PolicyListPage";
import { PolicyDetailPage } from "./components/PolicyDetailPage";
import { MyPage } from "./components/MyPage";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { getAuthUser } from "../api/auth";
import type { AuthUser } from "../api/types";

type Page = "home" | "policies" | "policy-detail" | "mypage" | "settings";
type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("1");

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    getAuthUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        setAuthState("authenticated");
      } else {
        setAuthState("unauthenticated");
      }
    });
  }, []);

  const navigate = (page: string, id?: string) => {
    if (page === "policy-detail" && id) {
      setSelectedPolicyId(id);
    }
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = () => {
    // OAuth 성공 후 사용자 정보 다시 조회
    getAuthUser().then((user) => {
      if (user) {
        setCurrentUser(user);
        setAuthState("authenticated");
        setCurrentPage("home");
      }
    });
  };

  const handleSignupStart = () => {
    setShowSignup(true);
  };

  const handleSignupComplete = () => {
    setShowSignup(false);
    setAuthState("authenticated");
    setCurrentPage("home");
  };

  const handleSignupCancel = () => {
    setShowSignup(false);
  };

  // 로딩 중
  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5fbf8" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#006a63", borderTopColor: "transparent" }}
          />
          <p style={{ fontFamily: "Pretendard, sans-serif", color: "#64748b", fontSize: 15 }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 회원가입 진행 중
  if (showSignup) {
    return <SignupPage onComplete={handleSignupComplete} onCancel={handleSignupCancel} />;
  }

  // 로그인 필요
  if (authState === "unauthenticated") {
    return <LoginPage onNavigate={handleLoginSuccess} onSignup={handleSignupStart} />;
  }

  const navPage = (currentPage === "policy-detail" ? "policies" : currentPage) as "home" | "policies" | "mypage" | "settings";

  return (
    <div style={{ fontFamily: "Pretendard, sans-serif" }}>
      <Navbar currentPage={navPage} onNavigate={(p) => navigate(p)} />

      {currentPage === "home" && <HomePage onNavigate={navigate} user={currentUser} />}
      {currentPage === "policies" && <PolicyListPage onNavigate={navigate} />}
      {currentPage === "policy-detail" && <PolicyDetailPage policyId={selectedPolicyId} onNavigate={navigate} />}
      {currentPage === "mypage" && <MyPage onNavigate={navigate} user={currentUser} />}
      {currentPage === "settings" && (
        <div className="min-h-screen pt-16 flex items-center justify-center" style={{ backgroundColor: "#f5fbf8" }}>
          <div className="text-center">
            <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 24, color: "#3c4947", marginBottom: 8 }}>설정</p>
            <p style={{ fontFamily: "Pretendard, sans-serif", fontSize: 16, color: "#94a3b8" }}>준비 중입니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
