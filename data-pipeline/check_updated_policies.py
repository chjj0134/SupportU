import pandas as pd
from config import UPDATED_POLICIES_PATH


def main():
    df = pd.read_csv(UPDATED_POLICIES_PATH)

    print("파일:", UPDATED_POLICIES_PATH)
    print("수정 정책 수:", len(df))

    if len(df) == 0:
        print("수정된 정책 없음")
        return

    print("\n[changed_columns 분포]")
    if "changed_columns" in df.columns:
        print(df["changed_columns"].value_counts(dropna=False).head(30))

    print("\n[수정 정책 목록]")
    show_cols = [
        "policy_id",
        "policy_title",
        "data_scope",
        "region",
        "scity",
        "schema_category",
        "changed_columns",
    ]

    existing_cols = [col for col in show_cols if col in df.columns]
    print(df[existing_cols].to_string(index=False))

    print("\n[수정 컬럼별 개수]")
    if "changed_columns" in df.columns:
        counts = {}

        for value in df["changed_columns"].dropna():
            for col in str(value).split(","):
                col = col.strip()
                if not col:
                    continue
                counts[col] = counts.get(col, 0) + 1

        for col, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            print(col, ":", count)


if __name__ == "__main__":
    main()
    