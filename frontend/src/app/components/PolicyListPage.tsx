import { useState, useEffect } from "react";
import { fetchPolicies, fetchPolicyDetail, togglePolicyBookmark } from "../../api/policies";
import type { Policy, PolicyDetail } from "../../api/types";
import { useQuery } from "../hooks/useQuery";
import { P } from "./common/Typography";
import { Spinner } from "./common/Spinner";
import { ErrorMessage } from "./common/ErrorMessage";



const categoryColor: Record<string, { bg: string; text: string }> = {
  Housing: { bg: "#eff6ff", text: "#2563eb" },
  Jobs: { bg: "#f0fdf4", text: "#16a34a" },
  Welfare: { bg: "#faf5ff", text: "#9333ea" },
};

const deadlineColor = (d: string) => {
  if (d === "상시") return "#475569";
  const n = parseInt(d.replace("D-", ""));
  if (n <= 3) return "#ba1a1a";
  if (n <= 7) return "#f97316";
  return "#475569";
};

/* ─────────────────────────── Policy Detail Side Panel ─────────────────────────── */

function PolicyDetailSidePanel({
  policy,
  onClose,
}: {
  policy: Policy;
  onClose: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const [details, setDetails] = useState<PolicyDetail | null>(null);

  useEffect(() => {
    fetchPolicyDetail(policy.id).then(setDetails);
  }, [policy.id]);

  const handleApply = () => {
    setApplied(true);
    setTimeout(() => setApplied(false), 3000);
  };

  const categoryBg: Record<string, string> = {
    Housing: "#eff6ff",
    Jobs: "#f0fdf4",
    Welfare: "#faf5ff",
  };

  if (!details) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 bg-white overflow-y-auto animate-slide-in"
        style={{
          width: "50%",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 px-8 py-5 flex items-center justify-between border-b"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderColor: "#e9efed" }}
        >
          <P style={{ fontSize: 18, fontWeight: 700, color: "#171d1c" }}>공고 상세</P>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-8 pb-32">
          {/* Policy Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-1 rounded text-xs"
                  style={{ backgroundColor: categoryColor[policy.category].bg, color: categoryColor[policy.category].text, fontFamily: "Pretendard, sans-serif", fontWeight: 600 }}
                >
                  {policy.categoryKr}
                </span>
                <P style={{ fontSize: 13, color: policy.deadline === "상시" ? "#006a63" : "#ba1a1a", fontWeight: 700 }}>{policy.deadline}</P>
              </div>
              <h2 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 26, color: "#171d1c", margin: "0 0 4px 0" }}>
                {policy.title}
              </h2>
              <P style={{ fontSize: 15, color: "#3c4947" }}>{policy.org}</P>
            </div>
            <div
              className="flex flex-col items-end gap-1"
              style={{ backgroundColor: categoryBg[policy.category] || "#f1f5f9", borderRadius: 12, padding: "12px 16px" }}
            >
              <P style={{ fontSize: 12, color: "#3c4947" }}>지원 규모</P>
              <P style={{ fontSize: 18, color: "#006a63", fontWeight: 700 }}>{policy.support}</P>
            </div>
          </div>

          {/* Overview Card */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ border: "1px solid rgba(79,209,197,0.3)", background: "rgba(245,251,248,0.5)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" stroke="#006A63" strokeWidth="1.5" />
                <path d="M9 5V9.5L12 11" stroke="#006A63" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <P style={{ fontSize: 16, color: "#006a63", fontWeight: 700 }}>지원 개요</P>
            </div>
            <P style={{ fontSize: 15, color: "#3c4947", lineHeight: 1.7 }}>{details.fullDesc}</P>
            <button
              className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg transition-all hover:bg-slate-100"
              style={{ fontFamily: "Pretendard, sans-serif", fontSize: 14, color: "#006a63", fontWeight: 600, background: "white", border: "1.5px solid rgba(79,209,197,0.4)", cursor: "pointer" }}
              onClick={() => window.open(`https://example.com/policy/${policy.id}`, '_blank')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 9V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H7" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round"/>
                <path d="M10 2H14V6M14 2L7 9" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              원본 공고 보러가기
            </button>
          </div>

          {/* Benefits Summary */}
          <div className="mb-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "rgba(187,201,199,0.3)" }}>
              <h3 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 20, color: "#171d1c", margin: 0 }}>지원 혜택 정리</h3>
            </div>

            <div className="flex flex-col gap-3">
              {details.benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: "rgba(245,251,248,0.5)", border: "1px solid rgba(187,201,199,0.3)" }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#006a63" }}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <P style={{ fontSize: 15, color: "#171d1c", fontWeight: 500 }}>{benefit}</P>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Bottom CTA */}
        <div
          className="fixed bottom-0 right-0 px-8 py-6 flex flex-col gap-3"
          style={{ width: "50%", backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid #e9efed" }}
        >
          {applied ? (
            <div
              className="h-14 rounded-xl flex items-center justify-center gap-2"
              style={{ backgroundColor: "#f0fdf4", border: "1px solid #16a34a" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="#16a34a" />
                <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <P style={{ fontSize: 16, color: "#16a34a", fontWeight: 700 }}>일정이 등록되었습니다!</P>
            </div>
          ) : (
            <button
              className="h-14 rounded-xl flex items-center justify-center w-full gap-2 transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#006a63", boxShadow: "0 8px 10px rgba(0,106,99,0.25)", fontFamily: "Pretendard, sans-serif", fontSize: 17, fontWeight: 700, color: "white", border: "none", cursor: "pointer" }}
              onClick={handleApply}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="3" width="16" height="15" rx="2" stroke="white" strokeWidth="1.5" />
                <path d="M6 1V5M14 1V5M2 8H18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 12H10M6 15H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              지원 일정 관리하기
            </button>
          )}
          <div className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="rgba(60,73,71,0.6)" strokeWidth="1.2" />
              <path d="M8 5V8.5L10.5 10" stroke="rgba(60,73,71,0.6)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <P style={{ fontSize: 13, color: "rgba(60,73,71,0.8)" }}>AI 에이전트가 일정과 필수 서류를 자동으로 정리해 드려요</P>
          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}

interface PolicyListPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function PolicyListPage({ onNavigate }: PolicyListPageProps) {
  const policiesQuery = useQuery(() => fetchPolicies(), []);
  const policies = policiesQuery.data ?? [];

  const [activeFilter, setActiveFilter] = useState("전체");
  const [sort, setSort] = useState("마감일 임박순");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [detailPolicy, setDetailPolicy] = useState<Policy | null>(null);

  // 정책 목록이 새로 들어오면 북마크 초기 상태를 동기화
  useEffect(() => {
    if (policiesQuery.data) {
      setBookmarks(new Set(policiesQuery.data.filter((p) => p.bookmarked).map((p) => p.id)));
    }
  }, [policiesQuery.data]);

  const filtered = policies.filter((p) => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "주거") return p.category === "Housing";
    if (activeFilter === "일자리") return p.category === "Jobs";
    if (activeFilter === "복지") return p.category === "Welfare";
    return true;
  });

  // 정렬 적용
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "마감일 임박순") {
      // 상시는 맨 뒤로
      if (a.deadline === "상시" && b.deadline !== "상시") return 1;
      if (b.deadline === "상시" && a.deadline !== "상시") return -1;
      if (a.deadline === "상시" && b.deadline === "상시") return 0;

      // D-숫자 비교 (작은 숫자가 먼저)
      const aNum = parseInt(a.deadline.replace("D-", ""));
      const bNum = parseInt(b.deadline.replace("D-", ""));
      return aNum - bNum;
    } else if (sort === "최신순") {
      // ID가 큰 것이 최신 (간단한 예시)
      return parseInt(b.id) - parseInt(a.id);
    }
    return 0;
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    togglePolicyBookmark(id).catch((err) => console.error("북마크 토글 실패:", err));
  };

  if (policiesQuery.isLoading) {
    return (
      <div className="min-h-screen pt-16" style={{ backgroundColor: "#f5fbf8" }}>
        <Spinner label="정책을 불러오는 중..." />
      </div>
    );
  }

  if (policiesQuery.error) {
    return (
      <div className="min-h-screen pt-16" style={{ backgroundColor: "#f5fbf8" }}>
        <ErrorMessage error={policiesQuery.error} onRetry={policiesQuery.refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: "#f5fbf8" }}>
      <main className="max-w-[1280px] mx-auto px-8 py-10 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <h1 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 32, color: "#171d1c", margin: 0 }}>공고</h1>
          <P style={{ color: "#3c4947", fontSize: 16 }}>맞춤 정책을 찾아 지원 기회를 놓치지 마세요.</P>
        </div>

        {/* Filters */}
        <div className="sticky top-16 z-10 flex items-center gap-2 py-3" style={{ backgroundColor: "rgba(245,251,248,0.95)", backdropFilter: "blur(6px)" }}>
          {["전체", "주거", "일자리", "복지"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-4 py-2 rounded-full text-sm transition-all"
              style={{
                fontFamily: "Pretendard, sans-serif",
                fontWeight: activeFilter === f ? 600 : 500,
                backgroundColor: activeFilter === f ? "rgba(79,209,197,0.2)" : "white",
                color: activeFilter === f ? "#005750" : "#3c4947",
                border: `1px solid ${activeFilter === f ? "rgba(79,209,197,0.3)" : "rgba(187,201,199,0.5)"}`,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto relative">
            <button
              className="px-4 py-2 rounded-xl text-sm flex items-center gap-1"
              style={{
                fontFamily: "Pretendard, sans-serif",
                fontWeight: 700,
                backgroundColor: "white",
                color: "#3c4947",
                border: "1px solid rgba(187,201,199,0.6)",
                cursor: "pointer",
              }}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              {sort}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ transform: showSortDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                <path d="M1 1L5 5L9 1" stroke="#3C4947" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showSortDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowSortDropdown(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-30"
                  style={{ border: "1px solid rgba(187,201,199,0.3)", minWidth: "160px" }}
                >
                  {["마감일 임박순", "최신순"].map((option) => (
                    <button
                      key={option}
                      className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-slate-50"
                      style={{
                        fontFamily: "Pretendard, sans-serif",
                        fontWeight: sort === option ? 600 : 500,
                        color: sort === option ? "#006a63" : "#3c4947",
                        backgroundColor: sort === option ? "rgba(79,209,197,0.08)" : "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setSort(option);
                        setShowSortDropdown(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary Bar */}
        <div
          className="flex items-center justify-between p-5 rounded-2xl"
          style={{ background: "linear-gradient(to right, rgba(79,209,197,0.1), rgba(79,209,197,0))", border: "1px solid rgba(79,209,197,0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl bg-white flex items-center justify-center"
              style={{ border: "1px solid rgba(79,209,197,0.2)", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L13.5 8H20L14.5 12L16.5 18L11 14L5.5 18L7.5 12L2 8H8.5L11 2Z" fill="#4fd1c5" />
              </svg>
            </div>
            <P style={{ fontSize: 18, color: "#171d1c", fontWeight: 500 }}>
              회원님 프로필 기준 추천 공고{" "}
              <span style={{ color: "#006a63", fontWeight: 700 }}>24건</span>
            </P>
          </div>
          <span
            className="px-3 py-1.5 rounded-full text-xs"
            style={{ backgroundColor: "rgba(79,209,197,0.2)", color: "#006a63", fontFamily: "Pretendard, sans-serif", fontWeight: 600, border: "1px solid rgba(79,209,197,0.2)" }}
          >
            AI가 매칭했어요
          </span>
        </div>

        {/* Policy Grid */}
        <div className="grid grid-cols-2 gap-6 pb-12">
          {sorted.map((policy) => (
            <div
              key={policy.id}
              className="bg-white rounded-2xl p-7 cursor-pointer hover:shadow-md transition-all border relative"
              style={{ border: "1px solid rgba(187,201,199,0.4)", boxShadow: "0 8px 24px -4px rgba(79,209,197,0.06)" }}
              onClick={() => setDetailPolicy(policy)}
            >
              {/* Gradient corner */}
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-50"
                style={{ background: `linear-gradient(135deg, ${categoryColor[policy.category]?.bg || "#f1f5f9"} 0%, transparent 100%)` }}
              />

              <div className="relative">
                {/* Top Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded text-xs"
                      style={{ backgroundColor: "#e3e9e7", color: "#3c4947", fontFamily: "Pretendard, sans-serif", fontWeight: 500 }}
                    >
                      {policy.categoryKr}
                    </span>
                  </div>
                  <button
                    onClick={(e) => toggleBookmark(policy.id, e)}
                    className="p-1 transition-colors"
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
                      <path
                        d="M2 2H16C16.552 2 17 2.448 17 3V19L9 15L1 19V3C1 2.448 1.448 2 2 2Z"
                        stroke={bookmarks.has(policy.id) ? "#006a63" : "#6C7A77"}
                        fill={bookmarks.has(policy.id) ? "#006a63" : "none"}
                        strokeWidth="1.375"
                      />
                    </svg>
                  </button>
                </div>

                {/* Title & Org */}
                <P style={{ fontSize: 12, color: "#3c4947", fontWeight: 600, letterSpacing: "0.3px", marginBottom: 4 }}>{policy.org}</P>
                <P style={{ fontSize: 18, color: "#171d1c", fontWeight: 600, marginBottom: 8, lineHeight: 1.5 }}>{policy.title}</P>
                <P style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>{policy.desc}</P>

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-4"
                  style={{ borderTop: "1px solid rgba(187,201,199,0.3)" }}
                >
                  <P style={{ fontSize: 12, color: "#3c4947" }}>지원규모: {policy.support}</P>
                  <button
                    className="text-base font-medium transition-colors hover:opacity-70"
                    style={{ fontFamily: "Pretendard, sans-serif", color: "#006a63", background: "none", border: "none", cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); setDetailPolicy(policy); }}
                  >
                    상세보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Policy Detail Side Panel ── */}
      {detailPolicy && (
        <PolicyDetailSidePanel
          policy={detailPolicy}
          onClose={() => setDetailPolicy(null)}
        />
      )}
    </div>
  );
}
