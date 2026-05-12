import os
import pandas as pd


FINAL_SCHEMA_PATH = "output/processed/final_policy_schema_seoul_gyeonggi.csv"
RETRY_OUTPUT_PATH = "output/processed/failed_schema_retry_output.csv"

OUTPUT_PATH = "output/processed/final_policy_schema_seoul_gyeonggi_fixed.csv"


PRESERVE_IF_RETRY_EMPTY_COLUMNS = [
    "data_scope",
    "source_site",
    "source_name",
    "policy_id",
    "policy_title",
    "detail_url",
    "source_category",
    "schema_category",
    "list_page",
    "crawl_status",
    "crawl_reason",
    "ai_status",
    "ai_reason",
    "ai_evidence",
]


def is_empty(value) -> bool:
    if pd.isna(value):
        return True

    return str(value).strip() in ["", "None", "nan", "NaN", "null"]


def main():
    final_df = pd.read_csv(FINAL_SCHEMA_PATH)
    retry_df = pd.read_csv(RETRY_OUTPUT_PATH)

    print("기존 최종 파일 행 수:", len(final_df))
    print("재추출 결과 행 수:", len(retry_df))

    if "policy_id" not in final_df.columns or "policy_id" not in retry_df.columns:
        print("policy_id 컬럼이 없어서 병합 불가")
        return

    retry_success_df = retry_df[
        retry_df["error"].isna()
    ].copy()

    retry_failed_df = retry_df[
        retry_df["error"].notna()
    ].copy()

    print("재추출 성공 행 수:", len(retry_success_df))
    print("재추출 실패 행 수:", len(retry_failed_df))

    final_df["policy_id"] = final_df["policy_id"].astype(str)
    retry_success_df["policy_id"] = retry_success_df["policy_id"].astype(str)

    final_df = final_df.set_index("policy_id")
    retry_success_df = retry_success_df.set_index("policy_id")

    for col in retry_success_df.columns:
        if col not in final_df.columns:
            final_df[col] = None

    for col in final_df.columns:
        if col not in retry_success_df.columns:
            retry_success_df[col] = None

    updated_count = 0

    for policy_id, retry_row in retry_success_df.iterrows():
        if policy_id not in final_df.index:
            continue

        for col in final_df.columns:
            retry_value = retry_row[col]

            # retry 결과에서 메타데이터가 비어 있으면 기존 값 유지
            if col in PRESERVE_IF_RETRY_EMPTY_COLUMNS and is_empty(retry_value):
                continue

            final_df.at[policy_id, col] = retry_value

        updated_count += 1

    final_df = final_df.reset_index()

    os.makedirs("output/processed", exist_ok=True)

    final_df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    print("덮어쓴 행 수:", updated_count)
    print("저장 완료:", OUTPUT_PATH)

    if "error" in final_df.columns:
        print("최종 error 행 수:", final_df["error"].notna().sum())

    print("\n[데이터 범위 분포]")
    if "data_scope" in final_df.columns:
        print(final_df["data_scope"].value_counts(dropna=False))

    print("\n[지역 분포]")
    if "region" in final_df.columns:
        print(final_df["region"].value_counts(dropna=False))

    print("\n[남은 error 행]")
    remaining_error_df = final_df[final_df["error"].notna()]

    if len(remaining_error_df) > 0:
        show_cols = ["data_scope", "policy_id", "policy_title", "error"]
        existing_cols = [col for col in show_cols if col in remaining_error_df.columns]
        print(remaining_error_df[existing_cols])
    else:
        print("없음")


if __name__ == "__main__":
    main()