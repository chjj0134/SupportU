# pipeline/postprocess.py

import pandas as pd


SEOUL_GU = [
    "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구",
    "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "양천구",
    "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구",
    "강남구", "송파구", "강동구"
]

GYEONGGI_CITIES = [
    "수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시",
    "화성시", "평택시", "의정부시", "시흥시", "파주시", "김포시", "광명시",
    "광주시", "군포시", "오산시", "이천시", "안성시", "구리시", "의왕시",
    "하남시", "여주시", "양평군", "동두천시", "과천시", "가평군", "연천군",
    "포천시", "양주시"
]

CITY_ALIAS = {
    "용인市": "용인시",
}


TEXT_COLUMNS = [
    "region",
    "scity",
    "income",
    "asset",
    "education",
    "employment",
    "gender",
    "eligibility",
    "add_condition",
    "pstart",
    "pend",
    "ostart",
    "oend",
]


def prepare_column_types(df: pd.DataFrame) -> pd.DataFrame:
    """
    pandas가 빈 컬럼을 float64로 읽으면 문자열 대입 시 에러가 나므로
    후처리 대상 컬럼은 미리 object 타입으로 바꾼다.
    """
    for col in TEXT_COLUMNS + ["disability"]:
        if col not in df.columns:
            df[col] = None
        df[col] = df[col].astype("object")

    return df


def is_empty(value) -> bool:
    if pd.isna(value):
        return True

    return str(value).strip() in ["", "None", "nan", "NaN", "null"]


def normalize_text(value) -> str:
    if pd.isna(value):
        return ""

    text = str(value)

    for old, new in CITY_ALIAS.items():
        text = text.replace(old, new)

    return text.strip()


def normalize_null_like(value):
    if is_empty(value):
        return None

    text = normalize_text(value)

    null_keywords = [
        "무관",
        "제한없음",
        "제한 없음",
        "해당없음",
        "해당 없음",
        "없음",
        "소득무관",
        "소득 무관",
        "학력무관",
        "학력 무관",
        "취업무관",
        "취업 무관",
        "성별무관",
        "성별 무관",
    ]

    if text in null_keywords:
        return None

    return text


def find_first_match(text: str, candidates: list[str]):
    text = normalize_text(text)

    for item in candidates:
        if item in text:
            return item

    return None


def normalize_region(value, default_region=None):
    text = normalize_text(value)

    if not text:
        return default_region

    if any(keyword in text for keyword in ["전국", "제한없음", "제한 없음", "거주지 제한없음", "거주지 제한 없음"]):
        return None

    if "수도권" in text:
        return "수도권"

    if "서울" in text:
        return "서울특별시"

    if "경기" in text or "경기도" in text:
        return "경기도"

    if find_first_match(text, SEOUL_GU + GYEONGGI_CITIES):
        return default_region

    return text


def normalize_scity(value, combined_text, scope=None):
    text = normalize_text(value)

    if text:
        found = find_first_match(text, SEOUL_GU + GYEONGGI_CITIES)
        if found:
            return found

    if scope == "seoul":
        return find_first_match(combined_text, SEOUL_GU)

    if scope == "gyeonggi":
        return find_first_match(combined_text, GYEONGGI_CITIES)

    return find_first_match(combined_text, SEOUL_GU + GYEONGGI_CITIES)


def normalize_education(value):
    text = normalize_null_like(value)

    if text is None:
        return None

    if any(k in text for k in ["재학", "대학 재학", "고교 재학"]):
        return "재학"

    if any(k in text for k in ["졸업", "대졸", "고졸"]):
        return "졸업"

    if "고졸이상" in text or "고졸 이상" in text:
        return "고졸이상"

    return text


def normalize_employment(value):
    text = normalize_null_like(value)

    if text is None:
        return None

    labels = []

    if "미취업" in text:
        labels.append("미취업")

    if "재직" in text or "근로자" in text or "직장" in text:
        labels.append("재직")

    if "구직" in text:
        labels.append("구직")

    if "재학" in text:
        labels.append("재학")

    if not labels:
        return text

    return ",".join(dict.fromkeys(labels))


def normalize_gender(value, combined_text=""):
    text = normalize_null_like(value)

    search_text = f"{text or ''} {combined_text}"

    if "여성" in search_text:
        return "여성"

    if "남성" in search_text:
        return "남성"

    return None


def normalize_disability(value, combined_text=""):
    text = normalize_text(value)
    search_text = f"{text} {combined_text}"

    if any(k in search_text for k in ["장애인 제외", "장애인 불가", "장애인 신청 불가"]):
        return False

    if "장애인" in search_text or "장애" in search_text:
        return True

    return None


def normalize_eligibility(value):
    if is_empty(value):
        return None

    text = normalize_text(value)

    if text in ["제한없음", "제한 없음"]:
        return "제한없음"

    return text


def clean_common_schema(df: pd.DataFrame, scope: str, default_region: str | None):
    df = prepare_column_types(df)

    for idx, row in df.iterrows():
        combined_text = " ".join([
            normalize_text(row.get("policy_title")),
            normalize_text(row.get("title")),
            normalize_text(row.get("region")),
            normalize_text(row.get("scity")),
            normalize_text(row.get("income")),
            normalize_text(row.get("asset")),
            normalize_text(row.get("education")),
            normalize_text(row.get("employment")),
            normalize_text(row.get("eligibility")),
            normalize_text(row.get("add_condition")),
            normalize_text(row.get("support_content")),
            normalize_text(row.get("application_method")),
        ])

        df.at[idx, "region"] = normalize_region(row.get("region"), default_region=default_region)
        df.at[idx, "scity"] = normalize_scity(row.get("scity"), combined_text, scope=scope)

        df.at[idx, "income"] = normalize_null_like(row.get("income"))
        df.at[idx, "asset"] = normalize_null_like(row.get("asset"))
        df.at[idx, "education"] = normalize_education(row.get("education"))
        df.at[idx, "employment"] = normalize_employment(row.get("employment"))
        df.at[idx, "gender"] = normalize_gender(row.get("gender"), combined_text)
        df.at[idx, "disability"] = normalize_disability(row.get("disability"), combined_text)

        df.at[idx, "eligibility"] = normalize_eligibility(row.get("eligibility"))
        df.at[idx, "add_condition"] = normalize_null_like(row.get("add_condition"))

        for date_col in ["pstart", "pend", "ostart", "oend"]:
            if date_col in df.columns and is_empty(row.get(date_col)):
                df.at[idx, date_col] = None

    return df


def postprocess_seoul_schema(input_path, output_path):
    df = pd.read_csv(input_path)

    df = clean_common_schema(
        df=df,
        scope="seoul",
        default_region="서울특별시",
    )

    df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print("서울 후처리 저장 완료:", output_path)
    print("전체 개수:", len(df))

    if "region" in df.columns:
        print("\n[지역 분포]")
        print(df["region"].value_counts(dropna=False))

    if "scity" in df.columns:
        print("\n[구/군 분포 상위 20개]")
        print(df["scity"].value_counts(dropna=False).head(20))

    return df


def postprocess_gyeonggi_schema(input_path, output_path):
    df = pd.read_csv(input_path)

    df = clean_common_schema(
        df=df,
        scope="gyeonggi",
        default_region="경기도",
    )

    df["region"] = "경기도"

    df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print("경기도 후처리 저장 완료:", output_path)
    print("전체 개수:", len(df))

    if "region" in df.columns:
        print("\n[지역 분포]")
        print(df["region"].value_counts(dropna=False))

    if "scity" in df.columns:
        print("\n[시군구 분포 상위 20개]")
        print(df["scity"].value_counts(dropna=False).head(20))

    return df