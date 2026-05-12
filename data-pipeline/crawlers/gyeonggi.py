import os
import re
import calendar
import pandas as pd
from bs4 import BeautifulSoup

from crawlers.base import fetch_html, html_to_text


SOURCE_SITE = "youth.gg.go.kr"
SOURCE_NAME = "경기청년포털"

BASE_URL = "https://youth.gg.go.kr"

CATEGORY_URLS = {
    "일자리·창업": "https://youth.gg.go.kr/gg/info/job-start-up.do",
    "주거·복지": "https://youth.gg.go.kr/gg/info/housing-welfare.do",
    "금융·법률": "https://youth.gg.go.kr/gg/info/finance-law.do",
    "교육·자기개발": "https://youth.gg.go.kr/gg/info/education-and-self-development.do",
}

OUTPUT_ACTIVE_PATH = "output/raw/gyeonggi_active_raw.csv"
OUTPUT_NEED_CHECK_PATH = "output/raw/gyeonggi_need_check_raw.csv"
OUTPUT_CLOSED_PATH = "output/raw/gyeonggi_closed_raw.csv"
OUTPUT_OLLAMA_INPUT_PATH = "output/raw/gyeonggi_raw_all.csv"

MAX_PAGES = 100
PAGER_LIMIT = 8
STOP_AFTER_EMPTY_POLICY_PAGES = 3

CURRENT_YEAR = pd.Timestamp.today().year


JOB_KEYWORDS = [
    "취업",
    "면접",
    "자기소개서",
    "자소서",
    "이력서",
    "채용",
    "구직",
    "직무",
    "인턴",
    "일자리",
    "직업",
    "직업훈련",
    "창업",
    "창직",
    "자격증",
    "역량강화",
    "취창업",
    "멘토링",
    "커리어",
    "현직자",
    "취업성공",
    "일경험",
    "노동",
    "근로",
    "기업",
    "청년기업",
    "스타트업",
    "면접정장",
    "취업지원",
]

HOUSING_KEYWORDS = [
    "주거",
    "주택",
    "임대",
    "전세",
    "월세",
    "보증금",
    "이사비",
    "부동산",
    "기숙사",
    "청약",
    "안심주택",
    "전월세",
    "주거비",
    "주거급여",
    "매입임대",
    "공공임대",
]

ACTIVE_KEYWORDS = [
    "진행",
    "모집중",
    "신청중",
    "접수중",
    "상시",
    "상시모집",
    "상시 모집",
    "수시",
    "수시모집",
    "수시 모집",
    "연중",
    "연중모집",
    "연중 모집",
    "예산 소진",
    "예산소진",
    "예산 소진 시",
    "예산 소진시",
    "예산 소진 시까지",
    "예산소진시까지",
    "마감 시까지",
    "마감시까지",
    "소진 시까지",
    "소진시까지",
    "운영 중",
    "운영중",
    "계속 운영",
]

CLOSED_KEYWORDS = [
    "마감",
    "종료",
    "접수마감",
    "신청마감",
    "모집마감",
    "마감되었습니다",
    "종료되었습니다",
    "접수 종료",
    "신청 종료",
    "모집 종료",
]


def today():
    return pd.Timestamp.today().normalize()


def infer_schema_category(source_category: str, title: str, list_text: str = ""):
    text = f"{source_category} {title} {list_text}"

    if any(keyword in text for keyword in HOUSING_KEYWORDS):
        return "주거"

    if any(keyword in text for keyword in JOB_KEYWORDS):
        return "일자리"

    if source_category == "일자리·창업":
        return "일자리"

    if source_category == "주거·복지":
        return "주거"

    return "복지"


def make_list_url(category_url: str, page: int) -> str:
    offset = (page - 1) * PAGER_LIMIT
    return f"{category_url}?pager.offset={offset}&pagerLimit={PAGER_LIMIT}"


def make_detail_url(category_url: str, policy_id: str, page: int = 1) -> str:
    offset = (page - 1) * PAGER_LIMIT
    return (
        f"{category_url}"
        f"?mode=view"
        f"&arcNo={policy_id}"
        f"&pager.offset={offset}"
        f"&pagerLimit={PAGER_LIMIT}"
    )


def normalize_date(year, month, day):
    return pd.Timestamp(year=int(year), month=int(month), day=int(day))


def extract_year_from_title(title: str):
    if not isinstance(title, str):
        return None

    match = re.search(r"(20\d{2})", title)

    if not match:
        return None

    return int(match.group(1))


def parse_date_ranges(text: str):
    ranges = []

    full_date_pattern = (
        r"(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})"
        r".{0,50}?[~\-]"
        r".{0,50}?(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})"
    )

    for match in re.finditer(full_date_pattern, text):
        try:
            start = normalize_date(match.group(1), match.group(2), match.group(3))
            end = normalize_date(match.group(4), match.group(5), match.group(6))
            ranges.append((start, end))
        except Exception:
            pass

    same_year_date_pattern = (
        r"(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})"
        r".{0,50}?[~\-]"
        r".{0,50}?(\d{1,2})[.\-/월]\s*(\d{1,2})"
    )

    for match in re.finditer(same_year_date_pattern, text):
        try:
            year = int(match.group(1))
            start = normalize_date(year, match.group(2), match.group(3))
            end = normalize_date(year, match.group(4), match.group(5))
            ranges.append((start, end))
        except Exception:
            pass

    month_pattern = (
        r"(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]?"
        r"\s*[~\-]\s*"
        r"(\d{1,2})[.\-/월]?"
    )

    for match in re.finditer(month_pattern, text):
        try:
            year = int(match.group(1))
            start_month = int(match.group(2))
            end_month = int(match.group(3))
            last_day = calendar.monthrange(year, end_month)[1]

            start = pd.Timestamp(year=year, month=start_month, day=1)
            end = pd.Timestamp(year=year, month=end_month, day=last_day)
            ranges.append((start, end))
        except Exception:
            pass

    return ranges


def has_active_keyword(text: str):
    return any(keyword in text for keyword in ACTIVE_KEYWORDS)


def has_closed_keyword(text: str):
    return any(keyword in text for keyword in CLOSED_KEYWORDS)


def get_period_related_text(raw_text: str):
    lines = raw_text.splitlines()

    keywords = [
        "신청기간",
        "신청 기간",
        "접수기간",
        "접수 기간",
        "모집기간",
        "모집 기간",
        "사업기간",
        "사업 기간",
        "사업운영기간",
        "운영기간",
        "운영 기간",
        "지원기간",
        "지원 기간",
    ]

    chunks = []

    for i, line in enumerate(lines):
        if any(keyword in line for keyword in keywords):
            chunk = "\n".join(lines[i:i + 6])
            chunks.append(chunk)

    if chunks:
        return "\n".join(chunks)

    return ""


def remove_birth_lines(text: str):
    filtered = []

    for line in text.splitlines():
        if any(keyword in line for keyword in ["출생", "생년월일", "출생자", "생일"]):
            continue
        filtered.append(line)

    return "\n".join(filtered)


def classify_policy(title: str, list_text: str, raw_text: str):
    base_date = today()

    combined_text = f"{title}\n{list_text}\n{raw_text}"
    title_year = extract_year_from_title(title)

    list_ranges = parse_date_ranges(list_text)

    if list_ranges:
        for start, end in list_ranges:
            if start <= base_date <= end:
                return "active", f"list_date_range_active:{start.date()}~{end.date()}"

        return "closed", "list_date_range_expired"

    period_text = get_period_related_text(raw_text)
    period_text = remove_birth_lines(period_text)

    date_ranges = parse_date_ranges(period_text)

    if date_ranges:
        for start, end in date_ranges:
            if start <= base_date <= end:
                return "active", f"detail_date_range_active:{start.date()}~{end.date()}"

        return "closed", "detail_date_range_expired"

    if has_active_keyword(period_text):
        return "active", "period_active_keyword"

    if title_year is not None and title_year < CURRENT_YEAR:
        return "closed", f"past_title_year:{title_year}"

    if has_closed_keyword(combined_text):
        return "closed", "closed_keyword"

    if title_year == CURRENT_YEAR:
        return "need_check", f"current_title_year_no_clear_period:{title_year}"

    if title_year is None:
        return "need_check", "no_year_no_clear_period"

    return "need_check", "no_clear_period"


def clean_title_from_list_text(list_text: str):
    text = " ".join(str(list_text).split())

    match = re.search(
        r"\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}\s*~\s*\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}\s*(.+)$",
        text
    )

    if match:
        return match.group(1).strip()

    match = re.search(
        r"\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}\s*~\s*\d{1,2}[.\-/]\d{1,2}\s*(.+)$",
        text
    )

    if match:
        return match.group(1).strip()

    return text


def collect_policy_items(max_pages: int = MAX_PAGES):
    results = []
    seen_ids = set()

    for source_category, category_url in CATEGORY_URLS.items():
        empty_policy_pages = 0

        print("\n" + "=" * 60)
        print(f"[경기청년포털] 카테고리 수집 시작: {source_category}")
        print("=" * 60)

        for page in range(1, max_pages + 1):
            print(f"[경기청년포털] {source_category} 목록 페이지 확인 중: {page}")

            html = fetch_html(make_list_url(category_url, page))
            soup = BeautifulSoup(html, "lxml")

            page_items = []

            for a in soup.select("a"):
                list_text = a.get_text(" ", strip=True)
                href = a.get("href")

                if not href or not list_text:
                    continue

                if "arcNo=" not in href or "mode=view" not in href:
                    continue

                match = re.search(r"arcNo=(\d+)", href)

                if not match:
                    continue

                raw_policy_id = match.group(1)
                policy_id = f"gg_{raw_policy_id}"

                if policy_id in seen_ids:
                    continue

                seen_ids.add(policy_id)

                title = clean_title_from_list_text(list_text)
                schema_category = infer_schema_category(source_category, title, list_text)

                page_items.append({
                    "title": title,
                    "raw_policy_id": raw_policy_id,
                    "policy_id": policy_id,
                    "detail_url": make_detail_url(category_url, raw_policy_id, page=page),
                    "list_page": page,
                    "list_text": list_text,
                    "source_category": source_category,
                    "schema_category": schema_category,
                })

            print(f"[경기청년포털] {source_category} {page}페이지 목록 정책 수:", len(page_items))

            if len(page_items) == 0:
                empty_policy_pages += 1
                print("[경기청년포털] 연속 빈 목록 페이지:", empty_policy_pages)
            else:
                empty_policy_pages = 0

            if empty_policy_pages >= STOP_AFTER_EMPTY_POLICY_PAGES:
                print(f"[경기청년포털] {source_category} 빈 목록 페이지 반복, 카테고리 종료")
                break

            results.extend(page_items)

    print("[경기청년포털] 전체 카테고리 목록 정책 수:", len(results))
    return results


def fetch_policy_detail(item: dict):
    html = fetch_html(item["detail_url"])
    raw_text = html_to_text(html)

    status, reason = classify_policy(
        title=item["title"],
        list_text=item.get("list_text", ""),
        raw_text=raw_text,
    )

    return {
        "source_site": SOURCE_SITE,
        "source_name": SOURCE_NAME,
        "policy_id": item["policy_id"],
        "title": item["title"],
        "detail_url": item["detail_url"],
        "list_page": item["list_page"],
        "list_text": item.get("list_text"),
        "source_category": item.get("source_category"),
        "schema_category": item.get("schema_category"),
        "crawl_status": status,
        "crawl_reason": reason,
        "raw_text": raw_text,
    }


def crawl_gyeonggi():
    items = collect_policy_items()

    active_rows = []
    need_check_rows = []
    closed_rows = []

    for idx, item in enumerate(items, start=1):
        try:
            row = fetch_policy_detail(item)

            if row["crawl_status"] == "active":
                active_rows.append(row)
                print(
                    f"[경기청년포털] ACTIVE 저장 {len(active_rows)}개째:",
                    row["title"],
                    "/",
                    row["schema_category"],
                    "/",
                    row["crawl_reason"],
                )

            elif row["crawl_status"] == "need_check":
                need_check_rows.append(row)
                print(
                    f"[경기청년포털] NEED_CHECK 저장 {len(need_check_rows)}개째:",
                    row["title"],
                    "/",
                    row["schema_category"],
                    "/",
                    row["crawl_reason"],
                )

            else:
                closed_rows.append(row)
                print(
                    f"[경기청년포털] CLOSED 제외:",
                    row["title"],
                    "/",
                    row["schema_category"],
                    "/",
                    row["crawl_reason"],
                )

        except Exception as e:
            need_check_rows.append({
                "source_site": SOURCE_SITE,
                "source_name": SOURCE_NAME,
                "policy_id": item["policy_id"],
                "title": item["title"],
                "detail_url": item["detail_url"],
                "list_page": item["list_page"],
                "list_text": item.get("list_text"),
                "source_category": item.get("source_category"),
                "schema_category": item.get("schema_category"),
                "crawl_status": "need_check",
                "crawl_reason": f"detail_fetch_error:{e}",
                "raw_text": "",
            })
            print("[경기청년포털] 상세 확인 실패, NEED_CHECK 처리:", item["title"], e)

    os.makedirs("output/raw", exist_ok=True)

    pd.DataFrame(active_rows).to_csv(
        OUTPUT_ACTIVE_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    pd.DataFrame(need_check_rows).to_csv(
        OUTPUT_NEED_CHECK_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    pd.DataFrame(closed_rows).to_csv(
        OUTPUT_CLOSED_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    final_rows = active_rows + need_check_rows

    pd.DataFrame(final_rows).to_csv(
        OUTPUT_OLLAMA_INPUT_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    print("[경기청년포털] active raw 저장:", OUTPUT_ACTIVE_PATH)
    print("[경기청년포털] need_check raw 저장:", OUTPUT_NEED_CHECK_PATH)
    print("[경기청년포털] closed raw 저장:", OUTPUT_CLOSED_PATH)
    print("[경기청년포털] Ollama 입력용 raw 저장:", OUTPUT_OLLAMA_INPUT_PATH)

    print("[경기청년포털] active 수:", len(active_rows))
    print("[경기청년포털] need_check 수:", len(need_check_rows))
    print("[경기청년포털] closed 수:", len(closed_rows))
    print("[경기청년포털] Ollama 추출 대상 수:", len(final_rows))

    if final_rows:
        final_df = pd.DataFrame(final_rows)

        print("\n[경기청년포털] 원천 카테고리 분포")
        print(final_df["source_category"].value_counts(dropna=False))

        print("\n[경기청년포털] 스키마 카테고리 분포")
        print(final_df["schema_category"].value_counts(dropna=False))


if __name__ == "__main__":
    crawl_gyeonggi()