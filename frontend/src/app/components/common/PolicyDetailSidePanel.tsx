import { useState } from "react";
import { toast } from "sonner";
import type { Policy } from "../../../api/types";
import { usePolicyDetail } from "../../../api/queries/usePolicyQueries";
import { useCreateCalendarEventFromPolicy } from "../../../api/queries/useCalendarQueries";
import { getCategoryLabel, getCategoryStyle } from "../../../constants/categories";
import { P } from "./Typography";

interface PolicyDetailSidePanelProps {
  policy: Policy;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export function PolicyDetailSidePanel({
                                        policy,
                                        onClose,
                                        isBookmarked,
                                        onToggleBookmark,
                                      }: PolicyDetailSidePanelProps) {
  const [applied, setApplied] = useState(false);
  const { data: details } = usePolicyDetail(policy.id);
  const createCalendarEventMutation = useCreateCalendarEventFromPolicy();

  const handleApply = () => {
    createCalendarEventMutation.mutate(policy.id, {
      onSuccess: () => {
        setApplied(true);
        toast.success("Google Calendar에 일정이 등록되었습니다.");
        setTimeout(() => setApplied(false), 3000);
      },
      onError: () => {
        toast.error("일정 등록에 실패했습니다.");
      },
    });
  };

  const categoryLabel = policy.categoryKr || getCategoryLabel(policy.category);
  const categoryStyle = getCategoryStyle(policy.categoryKr || policy.category);

  return (
      <>
        <div
            className="fixed inset-0 z-50 transition-opacity duration-300"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
        />

        <div
            className="fixed top-0 right-0 bottom-0 z-50 bg-white overflow-y-auto animate-slide-in"
            style={{
              width: "50%",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
              animation: "slideIn 0.3s ease-out",
            }}
        >
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

          <div className="px-8 py-8 pb-32">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                      className="px-2.5 py-1 rounded text-xs"
                      style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text, fontFamily: "Pretendard, sans-serif", fontWeight: 600 }}
                  >
                    {categoryLabel}
                  </span>
                  <P style={{ fontSize: 13, color: policy.deadline === "상시" ? "#006a63" : "#ba1a1a", fontWeight: 700 }}>{policy.deadline}</P>
                </div>
                <h2 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 26, color: "#171d1c", margin: "0 0 4px 0" }}>
                  {policy.title}
                </h2>
                <P style={{ fontSize: 15, color: "#3c4947" }}>{policy.org}</P>
              </div>
            </div>

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
              <P style={{ fontSize: 15, color: "#3c4947", lineHeight: 1.7 }}>
                {details?.amount ?? "정보를 불러오는 중..."}
              </P>
              {details?.detailUrl && (
                  <button
                      className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg transition-all hover:bg-slate-100"
                      style={{ fontFamily: "Pretendard, sans-serif", fontSize: 14, color: "#006a63", fontWeight: 600, background: "white", border: "1.5px solid rgba(79,209,197,0.4)", cursor: "pointer" }}
                      onClick={() => window.open(details.detailUrl!, "_blank")}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14 9V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H7" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" />
                      <path d="M10 2H14V6M14 2L7 9" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    원본 공고 보러가기
                  </button>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: "rgba(187,201,199,0.3)" }}>
                <h3 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 20, color: "#171d1c", margin: 0 }}>지원 대상</h3>
              </div>

              <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "white", border: "1px solid rgba(187,201,199,0.35)" }}
              >
                <P style={{ fontSize: 15, color: "#3c4947", lineHeight: 1.7 }}>
                  {details?.target ?? "정보를 불러오는 중..."}
                </P>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "rgba(245,251,248,0.7)", border: "1px solid rgba(187,201,199,0.35)" }}
              >
                <P style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>지원 기간</P>
                <P style={{ fontSize: 15, color: "#171d1c", fontWeight: 600, lineHeight: 1.5 }}>
                  {details?.duration ?? "정보를 불러오는 중..."}
                </P>
              </div>

              <div
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "rgba(245,251,248,0.7)", border: "1px solid rgba(187,201,199,0.35)" }}
              >
                <P style={{ fontSize: 13, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>신청 방법</P>
                <P style={{ fontSize: 15, color: "#171d1c", fontWeight: 600, lineHeight: 1.5 }}>
                  {details?.method ?? "정보를 불러오는 중..."}
                </P>
              </div>
            </div>
          </div>

          <div
              className="fixed bottom-0 right-0 px-8 py-6 flex flex-col gap-3"
              style={{ width: "50%", backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderTop: "1px solid #e9efed" }}
          >
            <div className="grid grid-cols-[1fr_160px] gap-3">
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
                      className="h-14 rounded-xl flex items-center justify-center w-full gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: "#006a63", boxShadow: "0 8px 10px rgba(0,106,99,0.25)", fontFamily: "Pretendard, sans-serif", fontSize: 17, fontWeight: 700, color: "white", border: "none", cursor: createCalendarEventMutation.isPending ? "not-allowed" : "pointer" }}
                      onClick={handleApply}
                      disabled={createCalendarEventMutation.isPending}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="2" y="3" width="16" height="15" rx="2" stroke="white" strokeWidth="1.5" />
                      <path d="M6 1V5M14 1V5M2 8H18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M6 12H10M6 15H8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {createCalendarEventMutation.isPending ? "일정 등록 중..." : "지원 일정 관리하기"}
                  </button>
              )}
              <button
                  className="h-14 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
                  style={{
                    backgroundColor: isBookmarked ? "rgba(0,106,99,0.08)" : "white",
                    border: `1.5px solid ${isBookmarked ? "#006a63" : "rgba(187,201,199,0.8)"}`,
                    color: isBookmarked ? "#006a63" : "#3c4947",
                    fontFamily: "Pretendard, sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={() => onToggleBookmark(policy.id)}
              >
                <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
                  <path
                      d="M2 2H16C16.552 2 17 2.448 17 3V19L9 15L1 19V3C1 2.448 1.448 2 2 2Z"
                      stroke={isBookmarked ? "#006a63" : "#3c4947"}
                      fill={isBookmarked ? "#006a63" : "none"}
                      strokeWidth="1.375"
                  />
                </svg>
                {isBookmarked ? "스크랩 완료" : "스크랩 하기"}
              </button>
            </div>
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
