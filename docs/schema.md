# Data Schema (수정중)

수정일: 26.05.08 16:41

SupportU 프로젝트의 정책 데이터 수집 → 정규화 → DB 적재 과정에서 사용하는 공통 스키마를 정의한 문서이다.

---

## 1. 개요

크롤링 대상 출처별로 원시 데이터(raw data) 구조가 다르기 때문에,
후가공 단계에서 공통 스키마(Common Schema)로 정규화한 뒤 Supabase에 적재한다.

**파이프라인 흐름**

[크롤러] → raw JSON → [후가공] → Common Schema → [Supabase policies 테이블]

---

## 2. 데이터 출처

| 출처명 | 대상 지역 | 수집 방식 |
|---|---|---|
| 청년몽땅정보통 | 서울시 | API / 크롤링 |
| 잡아바 | 경기도 | API / 크롤링 |
| 온통청년 | 중앙정부 | API / 크롤링 |
| 복지로 | 중앙정부 | API / 크롤링 |

---

## 3. Raw Data Schema

크롤러가 각 출처에서 수집한 원시 데이터를 아래 형태로 통일한다.
각 출처의 필드명이 달라도 후가공 단계에서 아래 포맷으로 변환한다.

```json
{
  "source": "seoul | gyeonggi | central",
  "source_id": "출처 내부 고유 ID (문자열)",
  "raw_title": "원본 정책명",
  "raw_body": "원본 공고문 전체 텍스트",
  "raw_url": "원본 공고문 URL",
  "crawled_at": "2025-01-01T00:00:00Z"
}
```

---

## 4. Common Schema (정규화 포맷)

후가공 단계에서 raw data를 파싱·LLM 처리하여 아래 공통 스키마로 변환한다.
이 스키마가 Supabase `policies` 테이블의 입력값이 된다.

```json
{
  "policy_id": "seoul_2025_001",
  "data_scope": "서울",
  "source_site": "youth.seoul.go.kr",
  "source_name": "서울 청년포털",
  "policy_title": "2026 서울청년문화패스",
  "title": "서울청년문화패스",
  "detail_url": "https://youth.seoul.go.kr/infoData/plcyInfo/view.do?plcyBizId=V202600004",
  "summary": "무주택 청년에게 월 최대 20만원 월세 지원",
  "support_content": "공연 및 전시 관람에 사용할 수 있는 문화이용권(바우처) 지급",
  "region": "서울특별시",
  "scity": null,
  "amin": 21.0,
  "amax": 23.0,
  "pstart": "2025-03-01",
  "pend": "2025-12-31",
  "ostart": null,
  "oend": "2026-12-31",
  "income": "중위소득 150% 이하",
  "asset": null,
  "education": null,
  "employment": null,
  "disability": null,
  "gender": null,
  "eligibility": "만 21~23세 서울 거주 청년, 중위소득 150% 이하",
  "add_condition": null,
  "required_documents": "신분증",
  "application_method": "청년몽땅정보통(youth.seoul.go.kr)에서 온라인 신청",
  "crawl_status": null,
  "crawl_reason": null,
  "ai_status": null,
  "ai_reason": null,
  "ai_evidence": null,
  "error": null,
  "sync_updated_at": "2025-01-01T00:00:00Z"
}
```

---

## 5. 필드 정의

### policies

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `policy_id` | varchar | ✅ | 정책 고유 ID (PK) |
| `data_scope` | varchar | ❌ | 데이터 범위 (서울 / 경기) |
| `source_site` | varchar | ❌ | 크롤링 출처 사이트 URL |
| `source_name` | varchar | ❌ | 출처명 (예: 서울 청년포털) |
| `policy_title` | varchar | ❌ | 원본 정책명 (크롤링 원문) |
| `title` | varchar | ✅ | 정제된 정책명 |
| `detail_url` | varchar | ❌ | 정책 상세 페이지 URL |
| `summary` | text | ❌ | LLM이 생성한 핵심 요약 |
| `support_content` | text | ❌ | 지원 내용 상세 |
| `region` | varchar | ❌ | 대상 광역 지역 (서울특별시 / 경기도) |
| `scity` | varchar | ❌ | 대상 시/구 (예: 강남구, 수원시) |
| `amin` | numeric(4,1) | ❌ | 지원 가능 최소 연령 |
| `amax` | numeric(4,1) | ❌ | 지원 가능 최대 연령 |
| `pstart` | date | ❌ | 신청 시작일 |
| `pend` | date | ❌ | 신청 마감일 |
| `ostart` | date | ❌ | 운영 기간 시작일 |
| `oend` | date | ❌ | 운영 기간 종료일 |
| `income` | varchar | ❌ | 소득 기준 원문 (예: 중위소득 150% 이하) |
| `asset` | varchar | ❌ | 자산 기준 원문 |
| `education` | varchar | ❌ | 학력 요건 |
| `employment` | varchar | ❌ | 취업 상태 (재직자 / 미취업자 등) |
| `disability` | varchar | ❌ | 장애 여부 조건 |
| `gender` | varchar | ❌ | 성별 제한 조건 |
| `eligibility` | text | ❌ | 제한 대상 - 자격 요건 원문 |
| `add_condition` | text | ❌ | 추가 신청 자격 조건 원문 |
| `required_documents` | text | ❌ | 필요 서류 목록 |
| `application_method` | text | ❌ | 신청 방법 |
| `crawl_status` | varchar | ❌ | 크롤링 처리 상태 |
| `crawl_reason` | text | ❌ | 크롤링 처리 비고 |
| `ai_status` | varchar | ❌ | AI 후처리 상태 |
| `ai_reason` | text | ❌ | AI 후처리 비고 |
| `ai_evidence` | text | ❌ | AI 판단 근거 |
| `error` | text | ❌ | 오류 메시지 |
| `sync_updated_at` | timestamp | ❌ | 데이터 최종 동기화 일시 |

### users

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `uid` | varchar | ✅ | 유저 고유 ID (PK) |
| `email` | varchar | ✅ | 이메일 |
| `login` | varchar | ❌ | 로그인 방식 (기본값: google) |
| `created_at` | timestamp | ❌ | 생성 일시 |
| `updated_at` | timestamp | ❌ | 수정 일시 |

### user_profiles

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `uid` | varchar | ✅ | 유저 ID (PK, users 참조) |
| `age` | int4 | ❌ | 나이 |
| `gender` | varchar | ❌ | 성별 |
| `city` | varchar | ❌ | 거주지 (시/도) |
| `scity` | varchar | ❌ | 거주지 (구/군) |
| `education` | varchar | ❌ | 최종학력 |
| `employment` | varchar | ❌ | 취업 상태 |
| `disability` | bool | ❌ | 장애 유무 |
| `income` | varchar | ❌ | 소득 현황 |
| `asset` | varchar | ❌ | 자산 현황 |
| `created_at` | timestamp | ❌ | 생성 일시 |

### user_calendar_events

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `cid` | int8 | ✅ | 캘린더 이벤트 ID (PK) |
| `uid` | varchar | ✅ | 유저 ID (users 참조) |
| `policy_id` | varchar | ✅ | 정책 ID (policies 참조) |
| `gid` | varchar | ❌ | 구글 캘린더 이벤트 ID |
| `elink` | varchar | ❌ | 캘린더 딥링크 |
| `apply` | bool | ❌ | 지원 여부 |
| `created_at` | timestamp | ❌ | 생성 일시 |

### document_drafts

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `did` | int8 | ✅ | 초안 ID (PK) |
| `uid` | varchar | ✅ | 유저 ID (users 참조) |
| `policy_id` | varchar | ✅ | 정책 ID (policies 참조) |
| `dcontent` | text | ❌ | 마크다운 초안 내용 |
| `created_at` | timestamp | ❌ | 생성 일시 |

### user_push_tokens

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `uid` | varchar | ✅ | 유저 ID (PK, users 참조) |
| `ntoken` | varchar | ✅ | 웹/앱 푸시 디바이스 토큰 |
| `agreed` | bool | ❌ | 푸시 알림 수신 동의 여부 |
| `updated_at` | timestamp | ❌ | 수정 일시 |

### notifications

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `nid` | int8 | ✅ | 알림 ID (PK) |
| `uid` | varchar | ✅ | 유저 ID (users 참조) |
| `cid` | int8 | ❌ | 연관 캘린더 이벤트 ID |
| `title` | varchar | ✅ | 알림 제목 |
| `message` | text | ✅ | 알림 상세 내용 |
| `is_read` | bool | ❌ | 읽음 여부 |
| `created_at` | timestamp | ❌ | 생성 일시 |

### effect

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `eid` | int8 | ✅ | 기대효과 ID (PK) |
| `effect_summary` | text | ❌ | 기대효과 요약 |
| `created_at` | timestamp | ❌ | 생성 일시 |
| `updated_at` | timestamp | ❌ | 수정 일시 |
| `cid` | int8 | ❌ | 연관 캘린더 이벤트 ID |

---

## 6. 중복 제거 기준

후가공 단계에서 아래 기준으로 중복 데이터를 제거한다.

1. **1차**: `source_site` + `policy_id` 조합이 동일한 경우 → 최신 `sync_updated_at` 데이터만 유지
2. **2차**: `title` + `pend` + `region` 조합이 동일한 경우 → 동일 정책 판단, 병합 처리

---

## 7. Supabase policies 테이블 매핑

| Common Schema 필드 | policies 컬럼 | 비고 |
|---|---|---|
| `policy_id` | `policy_id` | PK |
| `data_scope` | `data_scope` | |
| `source_site` | `source_site` | |
| `source_name` | `source_name` | |
| `policy_title` | `policy_title` | 원문 정책명 |
| `title` | `title` | 정제된 정책명 |
| `detail_url` | `detail_url` | |
| `summary` | `summary` | LLM 생성 |
| `support_content` | `support_content` | |
| `region` | `region` | |
| `scity` | `scity` | |
| `amin` | `amin` | |
| `amax` | `amax` | |
| `pstart` | `pstart` | |
| `pend` | `pend` | |
| `ostart` | `ostart` | |
| `oend` | `oend` | |
| `income` | `income` | |
| `asset` | `asset` | |
| `education` | `education` | |
| `employment` | `employment` | |
| `disability` | `disability` | |
| `gender` | `gender` | |
| `eligibility` | `eligibility` | 자격 요건 원문 |
| `add_condition` | `add_condition` | 추가 조건 원문 |
| `required_documents` | `required_documents` | |
| `application_method` | `application_method` | |

---

## 8. 관련 파일

| 파일 | 설명 |
|---|---|
| `docs/convention.md` | Git 브랜치 전략 및 커밋 규칙 |
| `docs/schema.md` | 본 문서 - 공통 데이터 스키마 |

---
