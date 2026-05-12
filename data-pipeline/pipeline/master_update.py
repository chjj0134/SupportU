import os
import pandas as pd

from config import (
    MASTER_POLICY_PATH,
    NEW_POLICIES_PATH,
    UPDATED_POLICIES_PATH,
    UNCHANGED_POLICIES_PATH,
)


KEY_COLUMNS = [
    "policy_id",
    "detail_url",
]


COMPARE_COLUMNS = [
    "policy_title",
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
    "schema_category",
    "crawl_status",
]


def normalize_value(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def make_policy_key(row):
    policy_id = normalize_value(row.get("policy_id"))
    detail_url = normalize_value(row.get("detail_url"))

    if policy_id:
        return f"policy_id::{policy_id}"

    if detail_url:
        return f"detail_url::{detail_url}"

    title = normalize_value(row.get("policy_title") or row.get("title"))
    region = normalize_value(row.get("region"))
    scity = normalize_value(row.get("scity"))

    return f"title_region::{title}::{region}::{scity}"


def rows_are_different(old_row, new_row, compare_columns):
    changed_cols = []

    for col in compare_columns:
        old_value = normalize_value(old_row.get(col))
        new_value = normalize_value(new_row.get(col))

        if old_value != new_value:
            changed_cols.append(col)

    return changed_cols


def update_master_policy(
    latest_schema_path,
    master_path=MASTER_POLICY_PATH,
    new_output_path=NEW_POLICIES_PATH,
    updated_output_path=UPDATED_POLICIES_PATH,
    unchanged_output_path=UNCHANGED_POLICIES_PATH,
):
    latest_df = pd.read_csv(latest_schema_path)

    latest_df["policy_key"] = latest_df.apply(make_policy_key, axis=1)
    latest_df["last_seen_at"] = pd.Timestamp.today().strftime("%Y-%m-%d")

    os.makedirs(os.path.dirname(master_path), exist_ok=True)
    os.makedirs(os.path.dirname(new_output_path), exist_ok=True)

    if not os.path.exists(master_path):
        latest_df["first_seen_at"] = latest_df["last_seen_at"]
        latest_df["record_status"] = "new"
        latest_df["changed_columns"] = ""

        latest_df.to_csv(master_path, index=False, encoding="utf-8-sig")
        latest_df.to_csv(new_output_path, index=False, encoding="utf-8-sig")

        pd.DataFrame(columns=latest_df.columns).to_csv(
            updated_output_path,
            index=False,
            encoding="utf-8-sig",
        )

        pd.DataFrame(columns=latest_df.columns).to_csv(
            unchanged_output_path,
            index=False,
            encoding="utf-8-sig",
        )

        print("기존 master 파일이 없어 새로 생성했습니다.")
        print("master 저장:", master_path)
        print("신규 정책 수:", len(latest_df))
        print("수정 정책 수: 0")
        print("변경 없음 수: 0")

        return latest_df

    master_df = pd.read_csv(master_path)

    if "policy_key" not in master_df.columns:
        master_df["policy_key"] = master_df.apply(make_policy_key, axis=1)

    if "first_seen_at" not in master_df.columns:
        master_df["first_seen_at"] = None

    if "last_seen_at" not in master_df.columns:
        master_df["last_seen_at"] = None

    if "record_status" not in master_df.columns:
        master_df["record_status"] = None

    if "changed_columns" not in master_df.columns:
        master_df["changed_columns"] = ""

    master_df["policy_key"] = master_df["policy_key"].astype(str)
    latest_df["policy_key"] = latest_df["policy_key"].astype(str)

    master_map = {
        row["policy_key"]: row
        for _, row in master_df.iterrows()
    }

    new_rows = []
    updated_rows = []
    unchanged_rows = []
    merged_rows = []
    disappeared_rows = []

    today_str = pd.Timestamp.today().strftime("%Y-%m-%d")

    for _, new_row in latest_df.iterrows():
        key = new_row["policy_key"]

        if key not in master_map:
            row_dict = new_row.to_dict()
            row_dict["first_seen_at"] = today_str
            row_dict["last_seen_at"] = today_str
            row_dict["record_status"] = "new"
            row_dict["changed_columns"] = ""

            new_rows.append(row_dict)
            merged_rows.append(row_dict)
            continue

        old_row = master_map[key]

        compare_columns = [
            col for col in COMPARE_COLUMNS
            if col in latest_df.columns or col in master_df.columns
        ]

        changed_cols = rows_are_different(old_row, new_row, compare_columns)

        row_dict = new_row.to_dict()

        old_first_seen = old_row.get("first_seen_at")
        row_dict["first_seen_at"] = old_first_seen if not pd.isna(old_first_seen) else today_str
        row_dict["last_seen_at"] = today_str

        if changed_cols:
            row_dict["record_status"] = "updated"
            row_dict["changed_columns"] = ",".join(changed_cols)
            updated_rows.append(row_dict)
        else:
            row_dict["record_status"] = "unchanged"
            row_dict["changed_columns"] = ""
            unchanged_rows.append(row_dict)

        merged_rows.append(row_dict)

    latest_keys = set(latest_df["policy_key"])

    for _, old_row in master_df.iterrows():
        key = str(old_row["policy_key"])

        if key in latest_keys:
            continue

        row_dict = old_row.to_dict()
        row_dict["record_status"] = "not_seen_latest_run"
        row_dict["changed_columns"] = ""
        disappeared_rows.append(row_dict)
        merged_rows.append(row_dict)

    merged_df = pd.DataFrame(merged_rows)
    new_df = pd.DataFrame(new_rows)
    updated_df = pd.DataFrame(updated_rows)
    unchanged_df = pd.DataFrame(unchanged_rows)
    disappeared_df = pd.DataFrame(disappeared_rows)

    merged_df.to_csv(master_path, index=False, encoding="utf-8-sig")
    new_df.to_csv(new_output_path, index=False, encoding="utf-8-sig")
    updated_df.to_csv(updated_output_path, index=False, encoding="utf-8-sig")
    unchanged_df.to_csv(unchanged_output_path, index=False, encoding="utf-8-sig")

    disappeared_output_path = str(unchanged_output_path).replace(
        "unchanged_policies_",
        "not_seen_latest_run_",
    )

    disappeared_df.to_csv(
        disappeared_output_path,
        index=False,
        encoding="utf-8-sig",
    )

    print("master 업데이트 완료")
    print("master 저장:", master_path)
    print("신규 정책 수:", len(new_df))
    print("수정 정책 수:", len(updated_df))
    print("변경 없음 수:", len(unchanged_df))
    print("이번 실행에서 안 보인 기존 정책 수:", len(disappeared_df))

    print("신규 저장:", new_output_path)
    print("수정 저장:", updated_output_path)
    print("변경 없음 저장:", unchanged_output_path)
    print("미노출 저장:", disappeared_output_path)

    if len(updated_df) > 0 and "changed_columns" in updated_df.columns:
        print("\n[수정 컬럼 분포]")
        counts = {}

        for value in updated_df["changed_columns"].dropna():
            for col in str(value).split(","):
                col = col.strip()
                if not col:
                    continue
                counts[col] = counts.get(col, 0) + 1

        for col, count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            print(col, ":", count)

    return merged_df