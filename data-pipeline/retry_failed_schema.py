import os
import pandas as pd

from pipeline.extract_schema import extract_schema_from_file


FINAL_SCHEMA_PATH = "output/processed/final_policy_schema_seoul_gyeonggi.csv"

SOURCE_CANDIDATE_PATHS = [
    "output/processed/seoul_final_candidates.csv",
    "output/processed/seoul_other_gyeonggi_final_candidates.csv",
    "output/processed/gyeonggi_final_candidates.csv",
]

FAILED_INPUT_PATH = "output/processed/failed_schema_retry_input.csv"
FAILED_OUTPUT_PATH = "output/processed/failed_schema_retry_output.csv"


def main():
    final_df = pd.read_csv(FINAL_SCHEMA_PATH)

    failed_df = final_df[final_df["error"].notna()].copy()

    print("최종 파일 기준 실패 행 수:", len(failed_df))

    if len(failed_df) == 0:
        print("재추출할 실패 행 없음")
        return

    failed_policy_ids = set(failed_df["policy_id"].astype(str))

    source_dfs = []

    for path in SOURCE_CANDIDATE_PATHS:
        if os.path.exists(path):
            df = pd.read_csv(path)
            df["source_candidate_file"] = path
            source_dfs.append(df)
            print("원문 후보 파일 로드:", path, "/ 행 수:", len(df))
        else:
            print("원문 후보 파일 없음:", path)

    if not source_dfs:
        print("원문 후보 파일을 찾지 못함")
        return

    raw_df = pd.concat(source_dfs, ignore_index=True)

    if "policy_id" not in raw_df.columns:
        print("원문 후보 파일에 policy_id 컬럼 없음")
        return

    raw_df["policy_id"] = raw_df["policy_id"].astype(str)

    retry_df = raw_df[raw_df["policy_id"].isin(failed_policy_ids)].copy()

    os.makedirs("output/processed", exist_ok=True)

    retry_df.to_csv(FAILED_INPUT_PATH, index=False, encoding="utf-8-sig")

    print("재추출 입력 저장:", FAILED_INPUT_PATH)
    print("재추출 대상 행 수:", len(retry_df))

    if "raw_text" in retry_df.columns:
        print("raw_text 빈값 수:", retry_df["raw_text"].isna().sum())
    else:
        print("raw_text 컬럼 없음")
        return

    missing_ids = failed_policy_ids - set(retry_df["policy_id"].astype(str))
    print("원문 매칭 실패 policy_id 수:", len(missing_ids))

    if missing_ids:
        print("원문 매칭 실패 policy_id:")
        for policy_id in sorted(missing_ids):
            print(policy_id)

    if len(retry_df) == 0:
        print("실패 policy_id와 매칭되는 원문 후보가 없음")
        return

    extract_schema_from_file(
        input_path=FAILED_INPUT_PATH,
        output_path=FAILED_OUTPUT_PATH,
    )

    retry_result = pd.read_csv(FAILED_OUTPUT_PATH)

    print("재추출 결과 저장:", FAILED_OUTPUT_PATH)
    print("재추출 총 개수:", len(retry_result))

    if "error" in retry_result.columns:
        print("재추출 실패 개수:", retry_result["error"].notna().sum())


if __name__ == "__main__":
    main()