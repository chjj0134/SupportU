import pandas as pd


FINAL_COLUMNS = [
    "data_scope",

    # source metadata
    "source_site",
    "source_name",
    "policy_id",
    "policy_title",
    "detail_url",
    "source_category",
    "schema_category",

    # policies / user_profiles schema fields
    "title",
    "amin",
    "amax",
    "region",
    "scity",
    "income",
    "asset",
    "education",
    "employment",
    "disability",
    "gender",
    "pstart",
    "pend",
    "ostart",
    "oend",
    "eligibility",
    "add_condition",

    # reference fields for manual validation
    "support_content",
    "required_documents",
    "application_method",

    # pipeline metadata
    "crawl_status",
    "crawl_reason",
    "ai_status",
    "ai_reason",
    "ai_evidence",
    "error",
]


def merge_schema_files(schema_files: list[dict], output_path):
    """
    schema_files 예:
    [
        {"scope": "서울", "path": "...csv"},
        {"scope": "경기", "path": "...csv"},
    ]
    """
    dfs = []

    for item in schema_files:
        scope = item["scope"]
        path = item["path"]

        df = pd.read_csv(path)
        df["data_scope"] = scope
        dfs.append(df)

    merged_df = pd.concat(dfs, ignore_index=True)

    # 중복 제거
    if "policy_id" in merged_df.columns:
        merged_df = merged_df.drop_duplicates(subset=["policy_id"], keep="first")

    # 누락 컬럼 생성
    for col in FINAL_COLUMNS:
        if col not in merged_df.columns:
            merged_df[col] = None

    merged_df = merged_df[FINAL_COLUMNS]

    merged_df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print("최종 병합 저장 완료:", output_path)
    print("최종 병합 개수:", len(merged_df))

    print("\n[데이터 범위 분포]")
    print(merged_df["data_scope"].value_counts(dropna=False))

    print("\n[지역 분포]")
    print(merged_df["region"].value_counts(dropna=False))

    print("\n[스키마 카테고리 분포]")
    print(merged_df["schema_category"].value_counts(dropna=False))

    print("\n[확인용]")
    check_cols = [
        "data_scope",
        "policy_title",
        "source_category",
        "schema_category",
        "amin",
        "amax",
        "region",
        "scity",
        "pstart",
        "pend",
        "ostart",
        "oend",
        "eligibility",
        "add_condition",
    ]
    existing_check_cols = [col for col in check_cols if col in merged_df.columns]
    print(merged_df[existing_check_cols].head(20))

    return merged_df