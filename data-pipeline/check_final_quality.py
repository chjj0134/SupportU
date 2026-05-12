import pandas as pd

INPUT_PATH = "output/processed/final_policy_schema_seoul_gyeonggi_fixed.csv"


def main():
    df = pd.read_csv(INPUT_PATH)

    print("파일:", INPUT_PATH)
    print("전체 행 수:", len(df))
    print("전체 컬럼 수:", len(df.columns))

    print("\n[컬럼 목록]")
    print(list(df.columns))

    print("\n[데이터 범위 분포]")
    if "data_scope" in df.columns:
        print(df["data_scope"].value_counts(dropna=False))

    print("\n[지역 분포]")
    if "region" in df.columns:
        print(df["region"].value_counts(dropna=False))

    print("\n[시군구 상위 30개]")
    if "scity" in df.columns:
        print(df["scity"].value_counts(dropna=False).head(30))

    print("\n[error 분포]")
    if "error" in df.columns:
        print(df["error"].notna().value_counts(dropna=False))
        error_df = df[df["error"].notna()]
        if len(error_df) > 0:
            print("\n[error 행]")
            print(error_df[["data_scope", "policy_id", "policy_title", "error"]])

    print("\n[필수 컬럼 빈값 개수]")
    required_cols = [
        "policy_id",
        "policy_title",
        "detail_url",
        "amin",
        "amax",
        "region",
        "pstart",
        "pend",
        "eligibility",
    ]

    for col in required_cols:
        if col in df.columns:
            print(col, ":", df[col].isna().sum())

    print("\n[샘플 20개]")
    sample_cols = [
        "data_scope",
        "policy_title",
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

    existing_cols = [col for col in sample_cols if col in df.columns]
    print(df[existing_cols].head(20))


if __name__ == "__main__":
    main()