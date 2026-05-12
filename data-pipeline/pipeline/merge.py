# pipeline/merge.py

import pandas as pd


def merge_candidates(active_raw_path, need_check_classified_path, output_path):
    active_df = pd.read_csv(active_raw_path)
    need_check_df = pd.read_csv(need_check_classified_path)

    need_check_keep_df = need_check_df[
        need_check_df["ai_status"].isin(["active", "uncertain"])
    ].copy()

    active_df["ai_status"] = "active"
    active_df["ai_reason"] = "1차 규칙 필터에서 active로 판단"
    active_df["ai_evidence"] = ""
    active_df["ai_error"] = None

    final_df = pd.concat(
        [active_df, need_check_keep_df],
        ignore_index=True
    )

    if "policy_id" in final_df.columns:
        final_df = final_df.drop_duplicates(subset=["policy_id"], keep="first")

    final_df.to_csv(output_path, index=False, encoding="utf-8-sig")

    print("저장 완료:", output_path)
    print("1차 active 수:", len(active_df))
    print("AI active/uncertain 수:", len(need_check_keep_df))
    print("최종 후보 수:", len(final_df))

    return final_df