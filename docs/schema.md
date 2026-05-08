# Data Schema -- 수정중

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
  "pid": "seoul_2025_001",
  "title": "청년 월세 한시 특별지원",
  "summary": "무주택 청년에게 월 최대 20만원 월세 지원",
  "category": "주거",
  "region": "서울특별시",
  "age_min": 19,
  "age_max": 34,
  "income_criteria": "중위소득 60% 이하",
  "income_max_pct": 60,
  "employment_status": ["재직자", "자영업자", "무직"],
  "education": null,
  "disability_required": false,
  "apply_start": "2025-03-01",
  "apply_end": "2025-12-31",
  "required_documents": ["주민등록등본", "임대차계약서", "건강보험료 납부확인서"],
  "benefit_detail": "월 최대 200,000원, 최대 12개월",
  "apply_url": "https://example.go.kr/policy/001",
  "source": "seoul",
  "source_id": "seoul_raw_001",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

## 5. 필드 정의

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `pid` | string | ✅ | `{source}_{year}_{sequence}` 형태의 고유 ID |
| `title` | string | ✅ | 정책명 (최대 255자) |
| `summary` | string | ✅ | LLM이 생성한 핵심 요약 (최대 500자) |
| `category` | string | ✅ | `주거` / `일자리` / `복지` / `금융` / `문화예술` |
| `region` | string | ✅ | 대상 지역 (예: `서울특별시`, `경기도`, `전국`) |
| `age_min` | int | ✅ | 지원 가능 최소 연령 |
| `age_max` | int | ✅ | 지원 가능 최대 연령 |
| `income_criteria` | string | ❌ | 소득 기준 원문 (예: "중위소득 150% 이하") |
| `income_max_pct` | int | ❌ | LLM이 수치화한 소득 기준 % (없으면 null) |
| `employment_status` | string[] | ❌ | 해당 취업 상태 목록 (null이면 제한 없음) |
| `education` | string | ❌ | 학력 요건 (null이면 제한 없음) |
| `disability_required` | boolean | ✅ | 장애인 대상 여부 |
| `apply_start` | date | ❌ | 신청 시작일 (`YYYY-MM-DD`) |
| `apply_end` | date | ❌ | 신청 마감일 (`YYYY-MM-DD`) |
| `required_documents` | string[] | ✅ | 필요 서류 목록 |
| `benefit_detail` | string | ❌ | 지원 내용 상세 |
| `apply_url` | string | ✅ | 원본 공고문 링크 |
| `source` | string | ✅ | `seoul` / `gyeonggi` / `central` |
| `source_id` | string | ✅ | 출처 시스템의 원본 ID (중복 제거 기준) |
| `is_active` | boolean | ✅ | 현재 모집 중 여부 |
| `created_at` | datetime | ✅ | 최초 수집 일시 (ISO 8601) |
| `updated_at` | datetime | ✅ | 최종 갱신 일시 (ISO 8601) |

---

## 6. 중복 제거 기준

후가공 단계에서 아래 기준으로 중복 데이터를 제거한다.

1. **1차**: `source` + `source_id` 조합이 동일한 경우 → 최신 `crawled_at` 데이터만 유지
2. **2차**: `title` + `apply_end` + `region` 조합이 동일한 경우 → 동일 정책 판단, 병합 처리

---

## 7. Supabase policies 테이블 매핑

| Common Schema 필드 | policies 컬럼 | 비고 |
|---|---|---|
| `pid` | `pid` | PK |
| `title` | `title` | |
| `summary` | `summary` | |
| `age_min` | `amin` | |
| `age_max` | `amax` | |
| `region` | `region` | |
| `apply_start` | `pstart` | |
| `apply_end` | `pend` | |
| `apply_url` | `purl` | |
| `category` | (추후 컬럼 추가 예정) | 백엔드와 협의 필요 |
| `required_documents` | → `document_drafts` 테이블 | 별도 적재 |

---

## 8. 관련 파일

| 파일 | 설명 |
|---|---|
| `docs/convention.md` | Git 브랜치 전략 및 커밋 규칙 |
| `docs/schema.md` | 본 문서 - 공통 데이터 스키마 |
