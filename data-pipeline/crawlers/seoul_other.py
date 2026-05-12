# crawlers/seoul_other.py

import os
import re
import calendar
import pandas as pd
from bs4 import BeautifulSoup

from crawlers.base import fetch_html, html_to_text


SOURCE_SITE = "youth.seoul.go.kr"
SOURCE_NAME = "서울 청년포털_경기도정책"

OUTPUT_ACTIVE_PATH = "output/raw/seoul_other_gyeonggi_active_raw.csv"
OUTPUT_NEED_CHECK_PATH = "output/raw/seoul_other_gyeonggi_need_check_raw.csv"
OUTPUT_CLOSED_PATH = "output/raw/seoul_other_gyeonggi_closed_raw.csv"
OUTPUT_OLLAMA_INPUT_PATH = "output/raw/seoul_other_gyeonggi_raw_all.csv"

MAX_PAGES = 100
STOP_AFTER_EMPTY_POLICY_PAGES = 3

CURRENT_YEAR = pd.Timestamp.today().year

# 서울 청년포털 중앙정부/타지역 정책 중 "경기도" 기관 코드
GYEONGGI_INST_CODE = "003002008"


ACTIVE_KEYWORDS = [
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


def make_list_url(page: int) -> str:
    """
    서울 청년포털 > 중앙정부/타지역 정책 > 경기도 정책 목록.
    sc_plcyBizInstCd=003002008 이 경기도 필터.
    """
    return (
        "https://youth.seoul.go.kr/infoData/youthPlcyInfo/list2.do"
        f"?plcyBizId="
        f"&key=2309160001"
        f"&sc_detailAt="
        f"&pageIndex={page}"
        f"&orderBy=regYmd+desc"
        f"&blueWorksYn=N"
        f"&tabKind=003"
        f"&sw="
        f"&sc_plcyBizInstCd={GYEONGGI_INST_CODE}"
    )


def make_detail_url(policy_id: str) -> str:
    return (
        "https://youth.seoul.go.kr/infoData/youthPlcyInfo/view.do"
        f"?plcyBizId={policy_id}&tabKind=003&key=2309160001"
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

    # 예: 2026.4.1.(수) 10:00 ~ 2026.4.14.(화) 18:00
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

    # 예: 2026.02.06 ~ 11.20
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

    # 예: 2026. 1. ~ 12.
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


def get_period_related_text(raw_text: str):
    lines = raw_text.splitlines()

    keywords = [
        "사업신청기간",
        "신청기간",
        "신청 기간",
        "접수기간",
        "접수 기간",
        "모집기간",
        "모집 기간",
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


def has_active_keyword(text: str):
    return any(keyword in text for keyword in ACTIVE_KEYWORDS)


def has_closed_keyword(text: str):
    return any(keyword in text for keyword in CLOSED_KEYWORDS)


def classify_policy(title: str, raw_text: str):
    """
    반환값:
    - active: 현재 진행 중으로 판단
    - need_check: 날짜가 없거나 애매하지만 버리기 어려운 정책
    - closed: 명확히 종료/마감된 정책
    """
    base_date = today()

    period_text = get_period_related_text(raw_text)
    period_text = remove_birth_lines(period_text)

    combined_text = f"{title}\n{raw_text}\n{period_text}"

    title_year = extract_year_from_title(title)

    # 1. 기간 주변 날짜가 있으면 날짜를 최우선으로 판단
    date_ranges = parse_date_ranges(period_text)

    if date_ranges:
        for start, end in date_ranges:
            if start <= base_date <= end:
                return "active", f"date_range_active:{start.date()}~{end.date()}"

        return "closed", "date_range_expired"

    # 2. 제목 연도가 현재 연도보다 과거면 closed
    # 단, 기간 주변에 상시/연중/예산소진 표현이 있으면 active 가능
    if title_year is not None and title_year < CURRENT_YEAR:
        if has_active_keyword(period_text):
            return "active", f"past_title_year_but_period_active_keyword:{title_year}"

        return "closed", f"past_title_year:{title_year}"

    # 3. 날짜는 없지만 기간 주변에 상시/수시/연중/예산소진 표현이 있으면 active
    if has_active_keyword(period_text):
        return "active", "period_active_keyword"

    # 4. 본문 전체에 마감/종료 표현이 있으면 closed
    if has_closed_keyword(combined_text):
        return "closed", "closed_keyword"

    # 5. 현재 연도 제목인데 날짜가 없으면 확인 필요
    if title_year == CURRENT_YEAR:
        return "need_check", f"current_title_year_no_clear_period:{title_year}"

    # 6. 제목에 연도가 없으면 확인 필요
    if title_year is None:
        return "need_check", "no_year_no_clear_period"

    # 7. 미래 연도면 확인 필요
    if title_year > CURRENT_YEAR:
        return "need_check", f"future_title_year:{title_year}"

    return "need_check", "no_clear_period"


def collect_policy_items(max_pages: int = MAX_PAGES):
    results = []
    seen_ids = set()
    empty_policy_pages = 0

    for page in range(1, max_pages + 1):
        print(f"[서울기반-경기도] 목록 페이지 확인 중: {page}")

        html = fetch_html(make_list_url(page))
        soup = BeautifulSoup(html, "lxml")

        page_items = []

        for a in soup.select("a"):
            title = a.get_text(" ", strip=True)
            onclick = a.get("onclick")

            if not title or not onclick:
                continue

            match = re.search(r"goView\('([^']+)'\)", onclick)

            if not match:
                continue

            policy_id = match.group(1)

            if policy_id in seen_ids:
                continue

            seen_ids.add(policy_id)

            page_items.append({
                "title": title,
                "policy_id": policy_id,
                "detail_url": make_detail_url(policy_id),
                "list_page": page,
            })

        print(f"[서울기반-경기도] {page}페이지 목록 정책 수:", len(page_items))

        if len(page_items) == 0:
            empty_policy_pages += 1
            print("[서울기반-경기도] 연속 빈 목록 페이지:", empty_policy_pages)
        else:
            empty_policy_pages = 0

        if empty_policy_pages >= STOP_AFTER_EMPTY_POLICY_PAGES:
            print("[서울기반-경기도] 빈 목록 페이지가 반복되어 목록 수집 종료")
            break

        results.extend(page_items)

    print("[서울기반-경기도] 목록 전체 정책 수:", len(results))
    return results


def fetch_policy_detail(item: dict):
    html = fetch_html(item["detail_url"])
    raw_text = html_to_text(html)

    status, reason = classify_policy(item["title"], raw_text)

    return {
        "source_site": SOURCE_SITE,
        "source_name": SOURCE_NAME,
        "policy_id": item["policy_id"],
        "title": item["title"],
        "detail_url": item["detail_url"],
        "list_page": item["list_page"],
        "crawl_status": status,
        "crawl_reason": reason,
        "raw_text": raw_text,
    }


def crawl_seoul_other_gyeonggi():
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
                    f"[서울기반-경기도] ACTIVE 저장 {len(active_rows)}개째:",
                    row["title"],
                    "/",
                    row["crawl_reason"]
                )

            elif row["crawl_status"] == "need_check":
                need_check_rows.append(row)
                print(
                    f"[서울기반-경기도] NEED_CHECK 저장 {len(need_check_rows)}개째:",
                    row["title"],
                    "/",
                    row["crawl_reason"]
                )

            else:
                closed_rows.append(row)
                print(
                    f"[서울기반-경기도] CLOSED 제외:",
                    row["title"],
                    "/",
                    row["crawl_reason"]
                )

        except Exception as e:
            need_check_rows.append({
                "source_site": SOURCE_SITE,
                "source_name": SOURCE_NAME,
                "policy_id": item["policy_id"],
                "title": item["title"],
                "detail_url": item["detail_url"],
                "list_page": item["list_page"],
                "crawl_status": "need_check",
                "crawl_reason": f"detail_fetch_error:{e}",
                "raw_text": "",
            })
            print("[서울기반-경기도] 상세 확인 실패, NEED_CHECK 처리:", item["title"], e)

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

    # Ollama 추출용: active + need_check를 합쳐서 저장
    final_rows = active_rows + need_check_rows

    pd.DataFrame(final_rows).to_csv(
        OUTPUT_OLLAMA_INPUT_PATH,
        index=False,
        encoding="utf-8-sig"
    )

    print("[서울기반-경기도] active raw 저장:", OUTPUT_ACTIVE_PATH)
    print("[서울기반-경기도] need_check raw 저장:", OUTPUT_NEED_CHECK_PATH)
    print("[서울기반-경기도] closed raw 저장:", OUTPUT_CLOSED_PATH)
    print("[서울기반-경기도] Ollama 입력용 raw 저장:", OUTPUT_OLLAMA_INPUT_PATH)

    print("[서울기반-경기도] active 수:", len(active_rows))
    print("[서울기반-경기도] need_check 수:", len(need_check_rows))
    print("[서울기반-경기도] closed 수:", len(closed_rows))
    print("[서울기반-경기도] Ollama 추출 대상 수:", len(final_rows))


if __name__ == "__main__":
    crawl_seoul_other_gyeonggi()