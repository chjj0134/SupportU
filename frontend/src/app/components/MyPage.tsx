import { useState, useEffect, useMemo, useRef } from "react";
import imgUserAvatar from "../../assets/d53360f080d65508be933ce1738e47c95909ed9e.png";
import type { ScrappedPolicy } from "../../api/policies";
import type { CalendarEvent } from "../../api/calendar";
import { useScrappedPolicies, usePolicyDetail } from "../../api/queries/usePolicyQueries";
import { useAuthUser } from "../../api/queries/useAuthQueries";
import { useProfile } from "../../api/queries/useProfileQueries";
import { useBenefitSummary, useTriggerTotalBenefit } from "../../api/queries/useBenefitQueries";
import { useCalendarEvents, useCreateCalendarEventFromPolicy } from "../../api/queries/useCalendarQueries";
import { useCompareStore } from "../../stores/useCompareStore";
import { P } from "./common/Typography";
import { Spinner } from "./common/Spinner";
import { ErrorMessage } from "./common/ErrorMessage";
import { getCategoryStyle } from "../../constants/categories";

/* ─────────────────────────── Data ─────────────────────────── */

// 카테고리 색상은 constants/categories.ts에 정의된 토큰을 사용한다.
// 한글 라벨 기반 매핑이 필요할 때 보조용으로 categoryColor를 유지.
const categoryColor: Record<string, { bg: string; text: string; border: string }> = {
  주거: getCategoryStyle("주거"),
  일자리: getCategoryStyle("일자리"),
  복지: getCategoryStyle("복지"),
};

const compareFields: { key: keyof ScrappedPolicy; label: string }[] = [
  { key: "org", label: "주관 기관" },
  { key: "amount", label: "지원 금액" },
  { key: "scope", label: "지원 범위" },
  { key: "duration", label: "지원 기간" },
  { key: "target", label: "지원 대상" },
  { key: "method", label: "신청 방법" },
];



const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

type CalendarDay = {
  day: number;
  events: { text: string; color: string; textColor: string }[];
  today: boolean;
};

function toCalendarColor(category: string) {
  if (category === "주거") {
    return { color: "#ffdad6", textColor: "#93000a" };
  }

  if (category === "일자리") {
    return { color: "rgba(79,209,197,0.2)", textColor: "#006a63" };
  }

  if (category === "복지") {
    return { color: "#e8def8", textColor: "#4a4458" };
  }

  return { color: "rgba(255,171,103,0.3)", textColor: "#8e4e11" };
}

function buildCalendarDays(
    events: CalendarEvent[],
    year: number,
    month: number,
): CalendarDay[] {
  const today = new Date();
  const lastDay = new Date(year, month, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const dayEvents = events
        .filter((event) => {
          const date = new Date(event.eventStartAt);
          return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
        })
        .map((event) => {
          const colors = toCalendarColor(event.category);

          return {
            text: event.title,
            color: colors.color,
            textColor: colors.textColor,
          };
        });

    return {
      day,
      events: dayEvents,
      today: today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day,
    };
  });
}

/* ─────────────────────────── Policy Detail Side Panel ─────────────────────────── */

function PolicyDetailSidePanel({
                                 policyId,
                                 policies,
                                 onClose,
                                 onSchedule,
                               }: {
  policyId: string;
  policies: ScrappedPolicy[];
  onClose: () => void;
  onSchedule: (id: string) => void;
}) {
  const [applied, setApplied] = useState(false);
  const { data: detail } = usePolicyDetail(policyId);
  const policy = policies.find((p) => p.id === policyId);

  if (!policy) return null;

  const handleApply = () => {
    setApplied(true);
    onSchedule(policyId);
    setTimeout(() => setApplied(false), 3000);
  };

  const categoryBg: Record<string, string> = {
    주거: "#eff6ff",
    일자리: "#f0fdf4",
    복지: "#faf5ff",
  };

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
                  {policy.category}
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

/* ─────────────────────────── Compare Modal ─────────────────────────── */

function CompareModal({
                        policies,
                        onClose,
                        onSchedule,
                      }: {
  policies: ScrappedPolicy[];
  onClose: () => void;
  onSchedule: (id: string) => void;
}) {
  const [scheduled, setScheduled] = useState<Set<string>>(new Set());
  const cols = policies.length;

  const handleSchedule = (id: string) => {
    setScheduled((prev) => new Set([...prev, id]));
    onSchedule(id);
  };

  return (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
            className="relative bg-white rounded-3xl overflow-hidden flex flex-col"
            style={{
              width: cols === 2 ? 760 : 1040,
              maxHeight: "90vh",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "#e9efed" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#006a63" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4H14M2 8H10M2 12H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <P style={{ fontSize: 18, fontWeight: 700, color: "#171d1c" }}>공고 비교</P>
              <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: categoryColor[policies[0].category].bg, color: categoryColor[policies[0].category].text, fontFamily: "Pretendard, sans-serif" }}
              >
              {policies[0].category} · {cols}개 비교
            </span>
            </div>
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

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            {/* Policy Title Row */}
            <div
                className="grid gap-px sticky top-0 z-10"
                style={{ gridTemplateColumns: `160px repeat(${cols}, 1fr)`, backgroundColor: "#e9efed" }}
            >
              <div className="bg-slate-50 px-5 py-4">
                <P style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>항목</P>
              </div>
              {policies.map((p) => (
                  <div key={p.id} className="bg-white px-5 py-4">
                <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs mb-2"
                    style={{ backgroundColor: categoryColor[p.category].bg, color: categoryColor[p.category].text, fontFamily: "Pretendard, sans-serif", fontWeight: 600 }}
                >
                  {p.category}
                </span>
                    <P style={{ fontSize: 15, fontWeight: 700, color: "#171d1c", lineHeight: 1.4 }}>{p.title}</P>
                    <P style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{p.org}</P>
                  </div>
              ))}
            </div>

            {/* Deadline Row */}
            <div
                className="grid gap-px"
                style={{ gridTemplateColumns: `160px repeat(${cols}, 1fr)`, backgroundColor: "#e9efed" }}
            >
              <div className="bg-slate-50 px-5 py-4 flex items-center">
                <P style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>마감일</P>
              </div>
              {policies.map((p) => (
                  <div key={p.id} className="bg-white px-5 py-4">
                    <P
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: p.deadline === "상시" ? "#006a63" : parseInt(p.deadline.replace("D-", "")) <= 7 ? "#ba1a1a" : "#f97316",
                        }}
                    >
                      {p.deadline}
                    </P>
                  </div>
              ))}
            </div>

            {/* Data Rows */}
            {compareFields.map((field, i) => (
                <div
                    key={field.key}
                    className="grid gap-px"
                    style={{
                      gridTemplateColumns: `160px repeat(${cols}, 1fr)`,
                      backgroundColor: "#e9efed",
                    }}
                >
                  <div className="px-5 py-4 flex items-start" style={{ backgroundColor: i % 2 === 0 ? "#f8fafc" : "#f1f5f9" }}>
                    <P style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{field.label}</P>
                  </div>
                  {policies.map((p) => (
                      <div key={p.id} className="bg-white px-5 py-4">
                        {field.key === "amount" ? (
                            <P style={{ fontSize: 14, fontWeight: 700, color: "#006a63" }}>{p[field.key]}</P>
                        ) : (
                            <P style={{ fontSize: 14, color: "#171d1c", lineHeight: 1.5 }}>{p[field.key]}</P>
                        )}
                      </div>
                  ))}
                </div>
            ))}
          </div>

          {/* CTA Row */}
          <div
              className="grid gap-px border-t"
              style={{ gridTemplateColumns: `160px repeat(${cols}, 1fr)`, backgroundColor: "#e9efed", borderColor: "#e9efed" }}
          >
            <div className="bg-slate-50 px-5 py-5 flex items-center">
              <P style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>일정 추가</P>
            </div>
            {policies.map((p) => (
                <div key={p.id} className="bg-white px-5 py-5">
                  {scheduled.has(p.id) ? (
                      <div
                          className="h-11 rounded-xl flex items-center justify-center gap-2"
                          style={{ backgroundColor: "#f0fdf4", border: "1px solid #16a34a" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#16a34a" />
                          <path d="M5 8L7 10.5L11 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <P style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>일정 등록 완료</P>
                      </div>
                  ) : (
                      <button
                          className="w-full h-11 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
                          style={{ backgroundColor: "#006a63", border: "none", cursor: "pointer" }}
                          onClick={() => handleSchedule(p.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="1" y="2" width="14" height="13" rx="2" stroke="white" strokeWidth="1.3" />
                          <path d="M5 1V3.5M11 1V3.5M1 6H15" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                          <path d="M5 9.5H8M5 12H7" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        <P style={{ fontSize: 13, fontWeight: 700, color: "white" }}>지원 일정 관리하기</P>
                      </button>
                  )}
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}

function applyStatusToStep(status: string): number {
  if (status === 'completed') return 3;
  if (status === 'waiting') return 2;
  if (status === 'applied' || status === 'apply_now') return 1;
  return 0;
}
function genderApiToDisplay(gender: string | undefined | null): string {
  if (gender === 'M') return '남성';
  if (gender === 'F') return '여성';
  return '기타';
}
function assetToDisplayOption(asset: string | undefined | null): string {
  const num = asset ? Number(asset) : 0;
  if (isNaN(num) || num < 50_000_000) return '5,000만원 미만';
  if (num < 100_000_000) return '5,000만원 이상 ~ 1억원 미만';
  if (num < 300_000_000) return '1억원 이상 ~ 3억원 미만';
  return '3억원 이상';
}

/* ─────────────────────────── MyPage ─────────────────────────── */

interface MyPageProps {
  onNavigate: (page: string, id?: string) => void;
}

export function MyPage({ onNavigate }: MyPageProps) {
  const { data: user } = useAuthUser();
  const { data: profile } = useProfile();
  const { data: benefitSummary, isLoading: isBenefitSummaryLoading } = useBenefitSummary(profile?.uid);
  const triggerTotalBenefitMutation = useTriggerTotalBenefit(profile?.uid);
  const { data: scrappedPolicies = [] } = useScrappedPolicies();
  const { data: calendarEvents = [] } = useCalendarEvents();
  const createCalendarEventMutation = useCreateCalendarEventFromPolicy();

  // 비교 선택은 Zustand store에서 가져와 페이지 이동 후에도 유지된다
  const selected = useCompareStore((s) => s.selectedIds);
  const toggleCompareSelection = useCompareStore((s) => s.toggle);
  const clearCompareSelection = useCompareStore((s) => s.clear);

  const [mainTab, setMainTab] = useState<"scraps" | "management" | "profile">("scraps");
  const [subTab, setSubTab] = useState<"calendar" | "dashboard" | "policy">("dashboard");
  const [showCompare, setShowCompare] = useState(false);
  const [scheduledIds, setScheduledIds] = useState<Set<string>>(new Set());
  const [detailPolicyId, setDetailPolicyId] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [policyJourneySteps, setPolicyJourneySteps] = useState<Record<string, number>>({});

  const firstEventDate = calendarEvents.length > 0
      ? new Date(calendarEvents[0].eventStartAt)
      : new Date();
  const calendarYear = firstEventDate.getFullYear();
  const calendarMonth = firstEventDate.getMonth() + 1;
  const firstDayOfMonth = new Date(calendarYear, calendarMonth - 1, 1).getDay();
  const calendarDays = buildCalendarDays(calendarEvents, calendarYear, calendarMonth);
  const registeredPolicyIds = new Set(calendarEvents.map((event) => event.policyId));

  const totalBenefitAmount = benefitSummary?.totalBenefitAmount ?? 0;
  const totalBenefitManwon = Math.floor(totalBenefitAmount / 10000);
  const formattedTotalBenefitAmount = totalBenefitAmount.toLocaleString();
  const serviceBenefits = benefitSummary?.serviceBenefits ?? [];

  const handleSchedulePolicy = (id: string) => {
    createCalendarEventMutation.mutate(id, {
      onSuccess: () => {
        setScheduledIds((prev) => new Set([...prev, id]));
      },
    });
  };

  // Profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    uid: "",
    age: 25,
    gender: "기타",
    city: "",
    scity: "",
    education: "",
    employment: "",
    disability: false,
    incomeInteger: 0,
    asset: "5,000만원 미만",
    createdAt: "",
    preferredCategories: [] as ("주거" | "일자리" | "복지")[],
  });

  const { data: selectedPolicyDetail } = usePolicyDetail(selectedPolicyId || null);
  const journeyInitialized = useRef(false);
  const profileInitialized = useRef(false);

  useEffect(() => {
    if (calendarEvents.length > 0 && !journeyInitialized.current) {
      journeyInitialized.current = true;
      setPolicyJourneySteps(
        Object.fromEntries(calendarEvents.map(e => [e.policyId, applyStatusToStep(e.applyStatus)]))
      );
    }
  }, [calendarEvents]);

  useEffect(() => {
    if (calendarEvents.length > 0 && !selectedPolicyId) {
      setSelectedPolicyId(calendarEvents[0].policyId);
    }
  }, [calendarEvents, selectedPolicyId]);

  useEffect(() => {
    if (profile && !profileInitialized.current) {
      profileInitialized.current = true;
      setProfileData({
        uid: profile.uid,
        age: profile.age ?? 25,
        gender: genderApiToDisplay(profile.gender),
        city: profile.city ?? '',
        scity: profile.scity ?? '',
        education: profile.education ?? '',
        employment: profile.employment ?? '',
        disability: profile.disability ?? false,
        incomeInteger: profile.incomeInteger ? Math.floor(profile.incomeInteger / 10000) : 0,
        asset: assetToDisplayOption(profile.asset),
        createdAt: profile.createdAt ? profile.createdAt.split('T')[0] : '',
        preferredCategories: (profile.preferredCategories ?? []).filter(
          (cat): cat is "주거" | "일자리" | "복지" => ['주거', '일자리', '복지'].includes(cat)
        ),
      });
    }
  }, [profile]);

  const managedPolicies = useMemo(() => {
    return calendarEvents.map(event => {
      const step = policyJourneySteps[event.policyId] ?? applyStatusToStep(event.applyStatus);
      const endDate = event.eventEndAt ? new Date(event.eventEndAt) : null;
      const today = new Date();
      const ddayRaw = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const dday = Math.max(0, ddayRaw);
      const deadline = endDate ? (ddayRaw < 0 ? '마감' : ddayRaw === 0 ? 'D-day' : `D-${ddayRaw}`) : '상시';
      const statusInfo = (() => {
        switch (step) {
          case 1: return { status: '지원 완료', statusColor: '#006a63', statusBg: 'rgba(0,106,99,0.1)' };
          case 2: return { status: '결과 대기', statusColor: '#3b6661', statusBg: 'rgba(59,102,97,0.1)' };
          case 3: return { status: '수혜 완료', statusColor: '#16a34a', statusBg: 'rgba(22,163,74,0.1)' };
          default: return { status: '지원 필요', statusColor: '#ba1a1a', statusBg: 'rgba(186,26,26,0.1)' };
        }
      })();
      return {
        id: event.policyId, title: event.title, org: event.org, deadline, dday,
        submittedDate: step >= 1 ? (event.eventStartAt ? event.eventStartAt.split('T')[0] : null) : null,
        journeyStep: step, progress: Math.round((step / 3) * 100),
        documents: [] as { name: string; checked: boolean }[],
        ...statusInfo,
      };
    });
  }, [calendarEvents, policyJourneySteps]);

  const funnelData = useMemo(() => {
    const applied = Object.values(policyJourneySteps).filter(s => s >= 1).length;
    const completed = Object.values(policyJourneySteps).filter(s => s >= 3).length;
    const totalScraped = scrappedPolicies.length;
    const totalEvents = calendarEvents.length;
    const totalBase = Math.max(totalScraped + totalEvents, 1);
    return [
      { label: "맞춤 추천", value: totalBase, color: "#80cbc4" },
      { label: "스크랩", value: totalScraped, color: "#26a69a" },
      { label: "일정 등록", value: totalEvents, color: "#00897b" },
      { label: "지원 완료", value: applied, color: "#00695c" },
      { label: "수혜 완료", value: completed, color: "#004d40" },
    ];
  }, [scrappedPolicies, calendarEvents, policyJourneySteps]);


  const toggleInterest = (category: "주거" | "일자리" | "복지") => {
    if (!isEditingProfile) return;
    setProfileData((prev) => ({
      ...prev,
      interests: prev.interests.includes(category)
          ? prev.interests.filter((i) => i !== category)
          : [...prev.interests, category],
    }));
  };

  const handleSaveProfile = () => {
    // 여기서 저장 로직 처리
    setIsEditingProfile(false);
  };

  /* derive locked category from first selection */
  const lockedCategory = selected.length > 0
      ? scrappedPolicies.find((p) => p.id === selected[0])?.category
      : null;

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const policy = scrappedPolicies.find((p) => p.id === id);
    if (!policy) return;

    // 같은 카테고리만, 최대 3개까지 선택 가능 - 비즈니스 규칙을 가드로 표현
    toggleCompareSelection(id, (current) => {
      if (lockedCategory && policy.category !== lockedCategory) return false;
      if (current.length >= 3) return false;
      return true;
    });
  };

  const clearSelection = () => clearCompareSelection();

  const selectedPolicies = scrappedPolicies.filter((p) => selected.includes(p.id));

  const groupedByCategory = ["주거", "일자리", "복지"].map((cat) => ({
    category: cat as "주거" | "일자리" | "복지",
    policies: scrappedPolicies.filter((p) => p.category === cat),
  }));

  return (
      <div className="min-h-screen pt-16" style={{ backgroundColor: "#f8fafb" }}>
        <main className="max-w-[1280px] mx-auto px-6 py-10 pb-32">
          {/* Page Header */}
          <div className="flex flex-col gap-1 mb-6">
            <h1 style={{ fontFamily: "Pretendard, sans-serif", fontWeight: 700, fontSize: 32, color: "#171d1c", margin: 0 }}>마이페이지</h1>
            <P style={{ color: "#3c4947", fontSize: 16 }}>관심 있는 정책을 비교하고 지원 일정을 체계적으로 관리하세요.</P>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-4 mb-8 p-5 bg-white rounded-2xl border" style={{ borderColor: "rgba(226,232,240,0.8)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="w-14 h-14 rounded-full border-2 overflow-hidden flex-shrink-0" style={{ borderColor: "#4fd1c5" }}>
              <img src={imgUserAvatar} alt="User" className="w-full h-full object-cover" />
            </div>
            <div>
              <P style={{ fontSize: 18, fontWeight: 700, color: "#171d1c" }}>{user?.name ?? "청년"}</P>
              <P style={{ fontSize: 14, color: "#64748b" }}>{profile ? `만 ${profile.age ?? '-'}세 · ${profile.city ?? ''} ${profile.scity ?? ''} · ${profile.employment ?? ''}` : ''}</P>
            </div>
            <div className="ml-auto flex gap-6">
              {[
                { label: "스크랩", value: String(scrappedPolicies.length) },
                { label: "지원 완료", value: String(Object.values(policyJourneySteps).filter(s => s >= 1).length) },
                { label: "수혜 금액", value: isBenefitSummaryLoading ? "..." : `${totalBenefitManwon.toLocaleString()}만원` },
              ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <P style={{ fontSize: 18, fontWeight: 700, color: "#006a63" }}>{stat.value}</P>
                    <P style={{ fontSize: 12, color: "#64748b" }}>{stat.label}</P>
                  </div>
              ))}
            </div>
          </div>

          {/* Main Tabs */}
          <div className="sticky top-16 z-10 mb-6 border-b" style={{ backgroundColor: "rgba(248,250,251,0.95)", backdropFilter: "blur(2px)", borderColor: "#e3e9e7" }}>
            <div className="flex gap-6">
              {[
                { id: "scraps", label: "스크랩함" },
                { id: "management", label: "지원 관리" },
                { id: "profile", label: "개인 정보 수정" },
              ].map((tab) => (
                  <button
                      key={tab.id}
                      onClick={() => { setMainTab(tab.id as typeof mainTab); clearSelection(); }}
                      className="relative py-3 text-lg transition-colors"
                      style={{
                        fontFamily: "Pretendard, sans-serif",
                        fontWeight: mainTab === tab.id ? 700 : 400,
                        color: mainTab === tab.id ? "#006a63" : "#3c4947",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        borderBottom: mainTab === tab.id ? "2px solid #006a63" : "2px solid transparent",
                        marginBottom: -1,
                      }}
                  >
                    {tab.label}
                  </button>
              ))}
            </div>
          </div>

          {/* ── Scrap Tab ── */}
          {mainTab === "scraps" && (
              <div className="flex flex-col gap-10">
                {/* Guide hint */}
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(79,209,197,0.08)", border: "1px solid rgba(79,209,197,0.2)" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#006a63" strokeWidth="1.3" />
                    <path d="M8 5V8.5M8 10.5V11" stroke="#006a63" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <P style={{ fontSize: 14, color: "#006a63" }}>
                    같은 카테고리의 공고를 <strong>최대 3개</strong>까지 선택해 비교할 수 있어요.
                  </P>
                </div>

                {groupedByCategory.map(({ category, policies }) => (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-4">
                  <span
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{ backgroundColor: categoryColor[category].bg, color: categoryColor[category].text, fontFamily: "Pretendard, sans-serif" }}
                  >
                    {category}
                  </span>
                        <P style={{ fontSize: 14, color: "#94a3b8" }}>{policies.length}건 스크랩됨</P>
                        {lockedCategory && lockedCategory !== category && (
                            <P style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>— {lockedCategory} 카테고리 선택 중</P>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-5">
                        {policies.map((p) => {
                          const isSelected = selected.includes(p.id);
                          const isDisabled = !!(lockedCategory && p.category !== lockedCategory);
                          const isFull = selected.length >= 3 && !isSelected;
                          const isScheduled = scheduledIds.has(p.id) || registeredPolicyIds.has(p.id);

                          return (
                              <div
                                  key={p.id}
                                  className="bg-white rounded-2xl border flex flex-col transition-all"
                                  style={{
                                    borderColor: isSelected
                                        ? categoryColor[category].border
                                        : "rgba(187,201,199,0.4)",
                                    boxShadow: isSelected ? `0 0 0 2px ${categoryColor[category].border}` : "none",
                                    opacity: isDisabled ? 0.4 : 1,
                                    cursor: isDisabled ? "not-allowed" : "default",
                                  }}
                              >
                                {/* Select Button Row */}
                                <div
                                    className="flex items-center justify-between px-5 pt-4 pb-3 border-b"
                                    style={{ borderColor: "#f1f5f9" }}
                                >
                                  <button
                                      className="flex items-center gap-2 transition-all"
                                      disabled={isDisabled || (isFull && !isSelected)}
                                      onClick={(e) => toggleSelect(p.id, e)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: isDisabled || (isFull && !isSelected) ? "not-allowed" : "pointer",
                                        padding: 0,
                                      }}
                                  >
                                    <div
                                        className="w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0"
                                        style={{
                                          backgroundColor: isSelected ? categoryColor[category].text : "white",
                                          border: `2px solid ${isSelected ? categoryColor[category].text : "#cbd5e1"}`,
                                        }}
                                    >
                                      {isSelected && (
                                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                      )}
                                    </div>
                                    <P style={{ fontSize: 13, fontWeight: isSelected ? 700 : 400, color: isSelected ? categoryColor[category].text : "#64748b" }}>
                                      {isSelected ? "선택됨" : "선택"}
                                    </P>
                                  </button>

                                  <P style={{ fontSize: 13, fontWeight: 700, color: p.deadline === "상시" ? "#006a63" : "#ba1a1a" }}>
                                    {p.deadline}
                                  </P>
                                </div>

                                {/* Card Body */}
                                <div
                                    className="p-5 flex flex-col flex-1 cursor-pointer hover:bg-slate-50 transition-colors rounded-b-2xl"
                                    onClick={() => setDetailPolicyId(p.id)}
                                >
                                  <P style={{ fontSize: 17, fontWeight: 600, color: "#171d1c", lineHeight: 1.4, marginBottom: 6 }}>{p.title}</P>
                                  <P style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>{p.org}</P>
                                  <P style={{ fontSize: 14, fontWeight: 700, color: "#006a63", marginBottom: 12 }}>{p.amount}</P>
                                  <P style={{ fontSize: 13, color: "#3c4947" }}>지원규모: {p.support}</P>

                                  <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "#e9efed" }}>
                                    <P style={{ fontSize: 13, color: "#006a63", fontWeight: 500 }}>상세보기 →</P>
                                    {isScheduled && (
                                        <span className="flex items-center gap-1 text-xs" style={{ color: "#16a34a", fontFamily: "Pretendard, sans-serif" }}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <circle cx="6" cy="6" r="5" fill="#16a34a" />
                                  <path d="M3.5 6L5 7.5L8.5 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                일정 등록됨
                              </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </div>
                ))}
              </div>
          )}

          {/* ── Management Tab ── */}
          {mainTab === "management" && (
              <div className="flex flex-col gap-6">
                <div className="flex gap-2 p-1 rounded-xl self-start" style={{ backgroundColor: "#eff5f3" }}>
                  {[
                    { id: "calendar", label: "캘린더 뷰" },
                    { id: "dashboard", label: "대시보드 뷰" },
                    { id: "policy", label: "정책별 관리" },
                  ].map((t) => (
                      <button
                          key={t.id}
                          onClick={() => setSubTab(t.id as typeof subTab)}
                          className="px-6 py-2 rounded-lg text-base transition-all"
                          style={{
                            fontFamily: "Pretendard, sans-serif",
                            fontWeight: 400,
                            backgroundColor: subTab === t.id ? "white" : "transparent",
                            color: subTab === t.id ? "#006a63" : "#3c4947",
                            border: "none",
                            cursor: "pointer",
                            boxShadow: subTab === t.id ? "0 1px 1px rgba(0,0,0,0.05)" : "none",
                          }}
                      >
                        {t.label}
                      </button>
                  ))}
                </div>

                {subTab === "dashboard" && (
                    <div className="flex flex-col gap-8">
                      <div className="rounded-2xl p-8" style={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <P style={{ fontSize: 24, fontWeight: 700, color: "#171d1c" }}>지원 현황 요약</P>
                            <P style={{ fontSize: 14, color: "#3c4947", marginTop: 2 }}>추천부터 수혜까지의 단계를 한눈에 확인하세요.</P>
                          </div>
                          <div className="flex gap-2">
                            {["전체", "주거", "일자리", "복지"].map((f, i) => (
                                <button key={f} className="px-4 py-2 rounded-full text-sm" style={{ fontFamily: "Pretendard, sans-serif", backgroundColor: i === 0 ? "#006a63" : "#eff5f3", color: i === 0 ? "white" : "#3c4947", border: "none", cursor: "pointer", fontWeight: 500 }}>
                                  {f}
                                </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-8">
                          {/* Left: Funnel Chart - 60% */}
                          <div className="flex flex-col gap-3" style={{ width: "60%" }}>
                            {funnelData.map((item) => (
                                <div key={item.label} className="flex items-center gap-6">
                                  <div className="flex-1 flex justify-end">
                                    <div className="h-10 rounded-lg" style={{ width: `${funnelData[0].value > 0 ? (item.value / funnelData[0].value) * 100 : 0}%`, backgroundColor: item.color, minWidth: 40 }} />
                                  </div>
                                  <div className="flex items-center gap-3" style={{ minWidth: 180 }}>
                                    <div className="h-px w-8" style={{ backgroundColor: "#bbc9c7" }} />
                                    <P style={{ fontSize: 14, fontWeight: 700, color: "#171d1c", whiteSpace: "nowrap" }}>{item.label}</P>
                                    <P style={{ fontSize: 16, color: "#006a63", marginLeft: "auto" }}>{item.value}</P>
                                  </div>
                                </div>
                            ))}
                          </div>

                          {/* Right: Status Cards Container - 40% */}
                          <div style={{ width: "40%" }}>
                            <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(0,106,99,0.04)", border: "1.5px solid rgba(0,106,99,0.15)" }}>
                              <div className="flex items-center gap-2 mb-4">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                  <circle cx="9" cy="9" r="8" stroke="#006a63" strokeWidth="1.5" />
                                  <path d="M9 5V9.5L12 11.5" stroke="#006a63" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <P style={{ fontSize: 13, fontWeight: 700, color: "#006a63", letterSpacing: "0.3px" }}>현재 진행 중인 내용</P>
                              </div>
                              <div className="flex flex-col gap-3">
                                {[
                                  { label: "지원 필요", sub: "마감 임박 공고", value: `${Object.values(policyJourneySteps).filter(s => s === 0).length}건`, color: "#ba1a1a", bg: "rgba(186,26,26,0.1)" },
                                  { label: "지원 완료", sub: "이번 달 누적", value: `${Object.values(policyJourneySteps).filter(s => s >= 1).length}건`, color: "#006a63", bg: "rgba(0,106,99,0.1)" },
                                  { label: "결과 대기", sub: "심사 진행 중", value: `${Object.values(policyJourneySteps).filter(s => s === 2).length}건`, color: "#3b6661", bg: "rgba(59,102,97,0.1)" },
                                ].map((card) => (
                                    <div key={card.label} className="flex items-center justify-between p-4 rounded-xl bg-white" style={{ border: "1px solid #e9efed" }}>
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: card.bg }}>
                                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <circle cx="8" cy="8" r="7" stroke={card.color} strokeWidth="1.3" />
                                            <path d="M8 5V8.5L10.5 10" stroke={card.color} strokeWidth="1.3" strokeLinecap="round" />
                                          </svg>
                                        </div>
                                        <div>
                                          <P style={{ fontSize: 14, fontWeight: 700, color: "#171d1c", whiteSpace: "nowrap" }}>{card.label}</P>
                                          <P style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{card.sub}</P>
                                        </div>
                                      </div>
                                      <P style={{ fontSize: 20, fontWeight: 800, color: card.color, flexShrink: 0 }}>{card.value}</P>
                                    </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                        <div className="px-8 py-6 border-b" style={{ borderColor: "#e9efed" }}>
                          <P style={{ fontSize: 24, fontWeight: 700, color: "#171d1c" }}>혜택 리포트</P>
                          <P style={{ fontSize: 14, color: "#3c4947", marginTop: 2 }}>현재까지 받으신 경제적·물질적 혜택 총계입니다.</P>
                        </div>
                        <div className="grid grid-cols-2">
                          <div className="p-8 border-r flex flex-col justify-center items-center" style={{ borderColor: "#e9efed" }}>
                            <P style={{ fontSize: 14, fontWeight: 700, color: "#3c4947", letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 16 }}>현금성 혜택 현황</P>
                            <div className="flex flex-col items-center gap-3">
                              <div className="flex items-baseline gap-2">
                                <P style={{ fontSize: 56, fontWeight: 800, color: "#006a63", lineHeight: 1 }}>
                                  {isBenefitSummaryLoading ? "..." : formattedTotalBenefitAmount}
                                </P>
                                <P style={{ fontSize: 24, fontWeight: 700, color: "#3c4947" }}>원</P>
                              </div>
                              <P style={{ fontSize: 14, color: "#64748b", textAlign: "center" }}>
                                현재까지 받으신 현금성 혜택 총액
                              </P>
                            </div>
                          </div>
                          <div className="p-8 flex flex-col">
                            <P style={{ fontSize: 14, fontWeight: 700, color: "#3c4947", letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 16 }}>물품 및 서비스 혜택</P>
                            <div className="flex-1 flex items-center">
                              <div
                                  className="w-full p-6 rounded-xl"
                                  style={{
                                    backgroundColor: "rgba(0,106,99,0.05)",
                                    border: "1px solid rgba(0,106,99,0.15)"
                                  }}
                              >
                                {serviceBenefits.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                      {serviceBenefits.map((benefit, index) => (
                                          <div key={`${benefit.benefitItem ?? "benefit"}-${index}`} className="flex flex-col gap-1">
                                            <P style={{ fontSize: 15, color: "#171d1c", lineHeight: 1.6, fontWeight: 700 }}>
                                              {benefit.benefitItem ?? benefit.benefitType ?? "서비스 혜택"}
                                            </P>
                                            <P style={{ fontSize: 14, color: "#3c4947", lineHeight: 1.6, fontWeight: 400 }}>
                                              {benefit.effectSummary ?? "상세 혜택 정보가 집계되었습니다."}
                                            </P>
                                          </div>
                                      ))}
                                    </div>
                                ) : (
                                    <P style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, fontWeight: 400 }}>
                                      아직 집계된 물품 및 서비스 혜택이 없습니다.
                                    </P>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                )}

                {subTab === "calendar" && (
                    <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                      <div className="flex items-center justify-between mb-6">
                        <P style={{ fontSize: 20, fontWeight: 700, color: "#171d1c" }}>{calendarYear}년 {calendarMonth}월</P>
                        <div className="flex gap-2">
                          <button style={{ background: "none", border: "1px solid #e3e9e7", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "#3c4947", fontFamily: "Pretendard, sans-serif" }}>‹</button>
                          <button style={{ background: "none", border: "1px solid #e3e9e7", borderRadius: 8, padding: "4px 12px", cursor: "pointer", color: "#3c4947", fontFamily: "Pretendard, sans-serif" }}>›</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 mb-2">
                        {weekDays.map((d) => (
                            <div key={d} className="text-center py-2">
                              <P style={{ fontSize: 12, fontWeight: 500, color: "#3c4947" }}>{d}</P>
                            </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }, (_, i) => (
                            <div key={`e-${i}`} className="h-24 rounded" style={{ border: "1px solid #e3e9e7" }} />
                        ))}
                        {calendarDays.map((d) => (
                            <div key={d.day} className="h-24 rounded-md p-1.5 flex flex-col gap-1" style={{ border: d.today ? "2px solid #006a63" : "1px solid #e3e9e7", backgroundColor: d.today ? "rgba(0,106,99,0.05)" : "transparent" }}>
                              <div className="flex items-center">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: d.today ? "#006a63" : "transparent" }}>
                                  <P style={{ fontSize: 12, fontWeight: d.today ? 700 : 500, color: d.today ? "white" : "#171d1c" }}>{d.day}</P>
                                </div>
                              </div>
                              {d.events.map((ev, i) => (
                                  <div key={i} className="rounded px-1 py-0.5" style={{ backgroundColor: ev.color }}>
                                    <P style={{ fontSize: 9, color: ev.textColor, lineHeight: 1.3 }}>{ev.text}</P>
                                  </div>
                              ))}
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {subTab === "policy" && (
                    <div className="flex gap-6">
                      {/* Left: Policy List - 30% */}
                      <div style={{ width: "30%" }} className="flex flex-col gap-3">
                        {managedPolicies.map((p) => {
                          const ddayColor = p.dday <= 7 ? "#ba1a1a" : p.dday <= 14 ? "#f97316" : "#006a63";
                          const ddayBg = p.dday <= 7 ? "rgba(186,26,26,0.1)" : p.dday <= 14 ? "rgba(249,115,22,0.1)" : "rgba(0,106,99,0.1)";

                          return (
                              <div
                                  key={p.id}
                                  className="bg-white rounded-2xl p-5 cursor-pointer transition-all border"
                                  style={{
                                    borderColor: selectedPolicyId === p.id ? "#006a63" : "rgba(226,232,240,0.8)",
                                    boxShadow: selectedPolicyId === p.id ? "0 0 0 2px rgba(0,106,99,0.2)" : "0 2px 8px rgba(0,0,0,0.05)",
                                    backgroundColor: selectedPolicyId === p.id ? "rgba(0,106,99,0.02)" : "white",
                                  }}
                                  onClick={() => setSelectedPolicyId(p.id)}
                              >
                                <div className="flex items-start justify-between mb-3">
                          <span
                              className="px-2.5 py-1 rounded-full text-xs"
                              style={{ backgroundColor: p.statusBg, color: p.statusColor, fontFamily: "Pretendard, sans-serif", fontWeight: 700 }}
                          >
                            {p.status}
                          </span>
                                  {selectedPolicyId === p.id && (
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#006a63" }}>
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                      </div>
                                  )}
                                </div>

                                <P style={{ fontSize: 16, fontWeight: 600, color: "#171d1c", marginBottom: 6, lineHeight: 1.4 }}>{p.title}</P>
                                <P style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{p.org}</P>

                                {/* D-day Badge */}
                                <div className="flex items-center justify-between mb-3">
                                  <div
                                      className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                                      style={{ backgroundColor: ddayBg }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                      <circle cx="7" cy="7" r="6" stroke={ddayColor} strokeWidth="1.2" />
                                      <path d="M7 3.5V7L9 9" stroke={ddayColor} strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                    <P style={{ fontSize: 13, fontWeight: 700, color: ddayColor }}>D-{p.dday}</P>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#eff5f3" }}>
                                      <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, backgroundColor: p.statusColor }} />
                                    </div>
                                  </div>
                                  <P style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{p.progress}%</P>
                                </div>
                              </div>
                          );
                        })}
                      </div>

                      {/* Right: Policy Detail - 70% */}
                      <div style={{ width: "70%" }}>
                        {(() => {
                          const selectedPolicy = managedPolicies.find((p) => p.id === selectedPolicyId);
                          if (!selectedPolicy) return null;

                          const completedDocs = selectedPolicy.documents.filter(d => d.checked).length;
                          const totalDocs = selectedPolicy.documents.length;
                          const currentStep = policyJourneySteps[selectedPolicy.id] || 0;

                          const journeySteps = [
                            { label: "지원 필요", icon: "📝" },
                            { label: "지원 완료", icon: "✅" },
                            { label: "결과 대기", icon: "⏳" },
                            { label: "수혜 완료", icon: "🎉" },
                          ];

                          const updateJourneyStep = (step: number) => {
                            setPolicyJourneySteps((prev) => ({
                              ...prev,
                              [selectedPolicy.id]: step,
                            }));

                            if ((step === 1 || step === 3) && step !== currentStep) {
                              triggerTotalBenefitMutation.mutate();
                            }
                          };

                          return (
                              <div className="bg-white rounded-2xl p-6 sticky top-24" style={{ border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                                {/* Header */}
                                <div className="pb-4 mb-5 border-b" style={{ borderColor: "#e9efed" }}>
                                  <P style={{ fontSize: 20, fontWeight: 700, color: "#171d1c", marginBottom: 4 }}>{selectedPolicy.title}</P>
                                  <P style={{ fontSize: 13, color: "#64748b" }}>{selectedPolicy.org}</P>
                                </div>

                                {/* Journey Steps */}
                                <div className="mb-6">
                                  <div className="flex items-center gap-2 mb-4">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                      <path d="M2 9H16M16 9L12 5M16 9L12 13" stroke="#006a63" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <P style={{ fontSize: 16, fontWeight: 700, color: "#171d1c" }}>지원 여정</P>
                                  </div>

                                  <div className="flex items-center justify-between relative">
                                    {/* Progress Line */}
                                    <div
                                        className="absolute top-6 left-0 right-0 h-1 rounded-full"
                                        style={{ backgroundColor: "#e9efed", zIndex: 0, marginLeft: "12px", marginRight: "12px" }}
                                    >
                                      <div
                                          className="h-full rounded-full transition-all duration-500"
                                          style={{
                                            backgroundColor: "#006a63",
                                            width: `${(currentStep / (journeySteps.length - 1)) * 100}%`,
                                          }}
                                      />
                                    </div>

                                    {/* Journey Steps */}
                                    {journeySteps.map((step, idx) => {
                                      const isCompleted = idx <= currentStep;
                                      const isActive = idx === currentStep;

                                      return (
                                          <div
                                              key={idx}
                                              className="flex flex-col items-center gap-2 cursor-pointer transition-all relative"
                                              style={{ flex: 1, zIndex: 1 }}
                                              onClick={() => updateJourneyStep(idx)}
                                          >
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                                                style={{
                                                  backgroundColor: isCompleted ? "#006a63" : "white",
                                                  border: `3px solid ${isCompleted ? "#006a63" : "#e9efed"}`,
                                                  boxShadow: isActive ? "0 0 0 4px rgba(0,106,99,0.1)" : "none",
                                                  transform: isActive ? "scale(1.1)" : "scale(1)",
                                                }}
                                            >
                                              {isCompleted ? (
                                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M4 10L8 14L16 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                  </svg>
                                              ) : (
                                                  <P style={{ fontSize: 18 }}>{step.icon}</P>
                                              )}
                                            </div>
                                            <P
                                                style={{
                                                  fontSize: 12,
                                                  fontWeight: isCompleted ? 700 : 500,
                                                  color: isCompleted ? "#006a63" : "#94a3b8",
                                                  textAlign: "center",
                                                  whiteSpace: "nowrap",
                                                }}
                                            >
                                              {step.label}
                                            </P>
                                          </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Schedule Section */}
                                <div className="mb-6">
                                  <div className="flex items-center gap-2 mb-3">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                      <rect x="2" y="3" width="14" height="13" rx="2" stroke="#006a63" strokeWidth="1.3" />
                                      <path d="M6 1V5M12 1V5M2 7H16" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" />
                                    </svg>
                                    <P style={{ fontSize: 15, fontWeight: 700, color: "#171d1c" }}>일정 관리</P>
                                  </div>
                                  <div className="flex flex-col gap-3">
                                    <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(245,251,248,0.8)", border: "1px solid rgba(187,201,199,0.3)" }}>
                                      <P style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>마감일</P>
                                      <P style={{ fontSize: 15, fontWeight: 700, color: selectedPolicy.progress === 0 ? "#ba1a1a" : "#006a63" }}>{selectedPolicy.deadline}</P>
                                    </div>
                                    {selectedPolicy.submittedDate && (
                                        <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(245,251,248,0.8)", border: "1px solid rgba(187,201,199,0.3)" }}>
                                          <P style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>지원 완료일</P>
                                          <P style={{ fontSize: 15, fontWeight: 700, color: "#006a63" }}>{selectedPolicy.submittedDate}</P>
                                        </div>
                                    )}
                                  </div>
                                </div>

                                {/* Documents Checklist */}
                                <div className="mb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M11 2H4C3.44772 2 3 2.44772 3 3V15C3 15.5523 3.44772 16 4 16H14C14.5523 16 15 15.5523 15 15V6L11 2Z" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M11 2V6H15" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <P style={{ fontSize: 15, fontWeight: 700, color: "#171d1c" }}>지원 서류</P>
                                    </div>
                                    <span
                                        className="px-2 py-1 rounded-full text-xs"
                                        style={{ backgroundColor: completedDocs === totalDocs ? "rgba(0,106,99,0.1)" : "rgba(186,26,26,0.1)", color: completedDocs === totalDocs ? "#006a63" : "#ba1a1a", fontFamily: "Pretendard, sans-serif", fontWeight: 700 }}
                                    >
                              {completedDocs}/{totalDocs}
                            </span>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {selectedPolicy.documents.map((doc, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-slate-50"
                                            style={{ border: "1px solid rgba(226,232,240,0.8)" }}
                                        >
                                          <div
                                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                                              style={{
                                                backgroundColor: doc.checked ? "#006a63" : "white",
                                                border: `2px solid ${doc.checked ? "#006a63" : "#cbd5e1"}`,
                                              }}
                                          >
                                            {doc.checked && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                          </div>
                                          <P style={{ fontSize: 14, color: doc.checked ? "#171d1c" : "#64748b", textDecoration: doc.checked ? "line-through" : "none" }}>{doc.name}</P>
                                        </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Action Button */}
                                {selectedPolicyDetail?.detailUrl && (
                                  <button
                                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all hover:opacity-90"
                                      style={{ backgroundColor: "white", border: "1.5px solid #006a63", color: "#006a63", fontFamily: "Pretendard, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                                      onClick={() => window.open(selectedPolicyDetail.detailUrl!, '_blank')}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                      <path d="M14 9V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H7" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round"/>
                                      <path d="M10 2H14V6M14 2L7 9" stroke="#006a63" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    원본 공고 보러가기
                                  </button>
                                )}
                              </div>
                          );
                        })()}
                      </div>
                    </div>
                )}
              </div>
          )}

          {/* ── Profile Tab ── */}
          {mainTab === "profile" && (
              <div className="max-w-4xl mx-auto">
                <div className="rounded-2xl p-8 flex flex-col gap-8" style={{ backgroundColor: "white", border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                  <P style={{ fontSize: 18, fontWeight: 700, color: "#171d1c" }}>개인 정보 수정</P>
                </div>
              </div>
          )}
        </main>

        {showCompare && (
            <CompareModal
                policies={selectedPolicies}
                onClose={() => setShowCompare(false)}
                onSchedule={handleSchedulePolicy}
            />
        )}

        {detailPolicyId && (
            <PolicyDetailSidePanel
                policyId={detailPolicyId}
                policies={scrappedPolicies}
                onClose={() => setDetailPolicyId(null)}
                onSchedule={handleSchedulePolicy}
            />
        )}
      </div>
  );
}