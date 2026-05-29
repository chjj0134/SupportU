import { useState } from "react";
import { toast } from "sonner";
import imgHero from "figma:asset/2cb9345db44b046f538652abee8a7ed3e7d9b635.png";
import { usePolicies, usePolicyDetail } from "../../api/queries/usePolicyQueries";
import { P } from "./common/Typography";
import { Spinner } from "./common/Spinner";
import { ErrorMessage } from "./common/ErrorMessage";

interface PolicyDetailPageProps {
  policyId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function PolicyDetailPage({ policyId, onNavigate }: PolicyDetailPageProps) {
  const { data: allPolicies = [], isLoading, error, refetch } = usePolicies();

  const [applied, setApplied] = useState(false);
  const [selectedId, setSelectedId] = useState(policyId);
  const [filterCategory, setFilterCategory] = useState("전체");

  const { data: detail } = usePolicyDetail(selectedId);

  const policy = allPolicies.find((p) => p.id === selectedId) ?? allPolicies[0];

  const handleApply = () => {
    setApplied(true);
    toast.success("신청이 완료되었습니다.");
    setTimeout(() => setApplied(false), 3000);
  };

  const categoryBg: Record<string, string> = {
    Housing: "#eff6ff",
    Jobs: "#f0fdf4",
    Welfare: "#faf5ff",
  };

  const filteredList = filterCategory === "전체"
    ? allPolicies
    : allPolicies.filter((p) => {
        if (filterCategory === "주거") return p.category === "Housing";
        if (filterCategory === "일자리") return p.category === "Jobs";
        if (filterCategory === "복지") return p.category === "Welfare";
        return true;
      });

  if (isLoading || !policy) {
    return (
      <div className="min-h-screen pt-16" style={{ backgroundColor: "#f5fbf8" }}>
        <Spinner label="정책 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-16" style={{ backgroundColor: "#f5fbf8" }}>
        <ErrorMessage error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 flex" style={{ backgroundColor: "#f5fbf8" }}>
      {/* Left: Policy List */}
      <div className="w-[380px] flex-shrink-0 border-r overflow-y-auto" style={{ borderColor: "rgba(187,201,199,0.3)", backgroundColor: "rgba(245,251,248,0.8)", maxHeight: "calc(100vh - 64px)", position: "sticky", top: 64 }}>
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 backdrop-blur-md flex items-center gap-3"
          style={{ backgroundColor: "rgba(245,251,248,0.9)", backdropFilter: "blur(6px)", borderBottom: "1px solid rgba(187,201,199,0.3)" }}
        >
          <button
            onClick={() => onNavigate("policies")}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="#3C4947" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <P style={{ fontSize: 16, fontWeight: 600, color: "#171d1c" }}>공고 목록</P>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto">
          {["전체", "주거", "일자리", "복지"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterCategory(f)}
              className="px-3 py-1.5 rounded-full text-xs flex-shrink-0 transition-all"
              style={{
                fontFamily: "Pretendard, sans-serif",
                fontWeight: 500,
                backgroundColor: filterCategory === f ? "rgba(79,209,197,0.2)" : "white",
                color: filterCategory === f ? "#005750" : "#3c4947",
                border: `1px solid ${filterCategory === f ? "rgba(79,209,197,0.3)" : "rgba(187,201,199,0.5)"}`,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Policy Cards */}
        <div className="px-4 pb-6 flex flex-col gap-3">
          {filteredList.map((p) => (
            <div
              key={p.id}
              className="rounded-xl p-4 cursor-pointer transition-all"
              style={{
                backgroundColor: selectedId === p.id ? "rgba(79,209,197,0.08)" : "white",
                border: `1px solid ${selectedId === p.id ? "rgba(79,209,197,0.4)" : "rgba(226,232,240,0.8)"}`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              }}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: "rgba(0,106,99,0.1)", color: "#006a63", fontFamily: "Pretendard, sans-serif", fontWeight: 500 }}
                >
                  {p.categoryKr}
                </span>
                <P style={{ fontSize: 12, color: "#3c4947" }}>{p.deadline}</P>
              </div>
              <P style={{ fontSize: 16, fontWeight: 500, color: "#171d1c", lineHeight: 1.4, marginBottom: 6 }}>{p.title}</P>
              <P style={{ fontSize: 13, color: "#3c4947", lineHeight: 1.5 }}>{p.desc.slice(0, 60)}...</P>
              <div className="flex items-center justify-between mt-3">
                <P style={{ fontSize: 12, color: "#3c4947" }}>지원금액: {p.support}</P>
                <P style={{ fontSize: 14, color: "#006a63", fontWeight: selectedId === p.id ? 600 : 400 }}>
                  {selectedId === p.id ? "선택됨" : "자세히 보기"}
                </P>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Policy Detail */}
      <div className="flex-1 overflow-y-auto relative" style={{ maxHeight: "calc(100vh - 64px)" }}>
        {/* Hero Image */}
        <div className="w-full h-56 relative overflow-hidden">
          <img src={imgHero} alt="Policy hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent, rgba(245,251,248,0.9))" }} />
          {/* Breadcrumb */}
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <button onClick={() => onNavigate("home")} style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer" }}>홈</button>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>›</span>
            <button onClick={() => onNavigate("policies")} style={{ fontFamily: "Pretendard, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer" }}>정책</button>
            <span style={{ color: "rgba(255,255,255,0.6)" }}>›</span>
            <P style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>{policy.title}</P>
          </div>
        </div>

        <div className="flex">
          {/* Main Content */}
          <div className="flex-1 px-8 py-8 pb-40">
            {/* Policy Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-2.5 py-1 rounded text-xs"
                    style={{ backgroundColor: "#e3e9e7", color: "#3c4947", fontFamily: "Pretendard, sans-serif", fontWeight: 500 }}
                  >
                    {policy.categoryKr}
                  </span>
                  <P style={{ fontSize: 13, color: "#ba1a1a", fontWeight: 700 }}>{policy.deadline}</P>
                </div>
                <h2 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 28, color: "#171d1c", margin: "0 0 4px 0" }}>
                  {policy.title}
                </h2>
                <P style={{ fontSize: 15, color: "#3c4947" }}>{policy.org}</P>
              </div>
              <div
                className="flex flex-col items-end gap-1"
                style={{ backgroundColor: categoryBg[policy.category] || "#f1f5f9", borderRadius: 12, padding: "12px 16px" }}
              >
                <P style={{ fontSize: 12, color: "#3c4947" }}>지원 금액</P>
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
              <P style={{ fontSize: 15, color: "#3c4947", lineHeight: 1.7 }}>{detail?.fullDesc ?? "정보를 불러오는 중..."}</P>
              {detail?.detailUrl && (
                <button
                  className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg transition-all hover:bg-slate-100"
                  style={{ fontFamily: "Pretendard, sans-serif", fontSize: 14, color: "#006a63", fontWeight: 600, background: "white", border: "1.5px solid rgba(79,209,197,0.4)", cursor: "pointer" }}
                  onClick={() => window.open(detail.detailUrl!, '_blank')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 9V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H7" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M10 2H14V6M14 2L7 9" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  원본 공고 보러가기
                </button>
              )}
            </div>

            {/* Benefits Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "rgba(187,201,199,0.3)" }}>
                <h3 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 20, color: "#171d1c", margin: 0 }}>지원 혜택 정리</h3>
              </div>

              <div className="flex flex-col gap-3">
                {(detail?.benefits ?? []).map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ backgroundColor: "rgba(245,251,248,0.5)", border: "1px solid rgba(187,201,199,0.3)" }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#006a63" }}>
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <P style={{ fontSize: 14, color: "#3c4947", fontWeight: 500 }}>{benefit}</P>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligibility Check */}
            {detail?.eligibility && detail.eligibility.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "rgba(187,201,199,0.3)" }}>
                  <h3 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 20, color: "#171d1c", margin: 0 }}>내 적합도 확인</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(0,106,99,0.1)" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 7L5 11L13 3" stroke="#006a63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <P style={{ fontSize: 13, fontWeight: 700, color: "#006a63" }}>AI 분석 완료</P>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {detail.eligibility.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ border: "1px solid rgba(187,201,199,0.3)", backgroundColor: "white" }}
                    >
                      <P style={{ fontSize: 14, color: "#3c4947" }}>{item.label}</P>
                      <div className="flex items-center gap-2">
                        <P style={{ fontSize: 14, fontWeight: 700, color: "#006a63" }}>{item.value}</P>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,106,99,0.15)" }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#006a63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-72 flex-shrink-0 px-6 py-8">
            {/* Apply Button */}
            <button
              onClick={handleApply}
              className="w-full py-4 rounded-xl text-base font-bold transition-all mb-3"
              style={{
                fontFamily: "Pretendard, sans-serif",
                backgroundColor: applied ? "#4caf50" : "#006a63",
                color: "white",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,106,99,0.25)",
              }}
            >
              {applied ? "✓ 신청 완료" : "지금 신청하기"}
            </button>

            <button
              className="w-full py-4 rounded-xl text-sm font-bold mb-6"
              style={{
                fontFamily: "Pretendard, sans-serif",
                backgroundColor: "white",
                color: "#006a63",
                border: "1.5px solid rgba(0,106,99,0.3)",
                cursor: "pointer",
              }}
            >
              스크랩하기
            </button>

            {/* Policy Info Summary */}
            <div
              className="rounded-2xl p-5"
              style={{ border: "1px solid rgba(187,201,199,0.3)", backgroundColor: "white" }}
            >
              <P style={{ fontSize: 15, fontWeight: 700, color: "#171d1c", marginBottom: 16 }}>정책 정보 요약</P>
              {detail && (
                <div className="flex flex-col gap-3">
                  {[
                    { label: "지원 금액", value: detail.amount },
                    { label: "지원 범위", value: detail.scope },
                    { label: "지원 기간", value: detail.duration },
                    { label: "지원 대상", value: detail.target },
                    { label: "신청 방법", value: detail.method },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <P style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{label}</P>
                      <P style={{ fontSize: 13, color: "#3c4947", fontWeight: 500 }}>{value}</P>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
