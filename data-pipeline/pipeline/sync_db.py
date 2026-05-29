# pipeline/sync_db.py
# Supabase 동기화: 신규/수정 정책 upsert + 사라진 정책 cascade 삭제

import os
import math
import pandas as pd
from supabase import create_client, Client

from config import MASTER_POLICY_PATH


SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# 삭제 순서: FK 의존성 순서대로 (자식 테이블 먼저)
# policies ← policy_documents ← user_document_checklist
# policies ← user_calendar_events ← user_document_checklist (cid)
# policies ← document_drafts, effect, user_uploaded_files, bookmarks, eligibility_results
CASCADE_TABLES_BY_POLICY_ID = [
    "document_drafts",
    "effect",
    "user_uploaded_files",
    "bookmarks",
    "eligibility_results",
]


def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "SUPABASE_URL, SUPABASE_KEY 환경변수가 설정되지 않았습니다.\n"
            "실행 전 환경변수를 설정해 주세요:\n"
            "  set SUPABASE_URL=https://xxx.supabase.co\n"
            "  set SUPABASE_KEY=your-service-role-key"
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


DATE_COLUMNS = {"pstart", "pend", "ostart", "oend"}


def sanitize(v, key=None):
    """NaN/inf → None, bool → 'true'/'false' string, 날짜 컬럼 비정상값 → None"""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    if isinstance(v, bool):
        return "true" if v else "false"
    # 날짜 컬럼은 YYYY-MM-DD 형식만 허용
    if key in DATE_COLUMNS:
        s = str(v).strip()
        import re
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", s):
            return None
        return s
    return v


def upsert_policies(supabase: Client, df: pd.DataFrame) -> int:
    """
    신규(new) / 수정(updated) 정책을 Supabase policies 테이블에 upsert.
    DB 스키마 컬럼명에 맞게 매핑.
    """
    target_df = df[df["record_status"].isin(["new", "updated"])].copy()

    if target_df.empty:
        print("upsert 대상 없음")
        return 0

    # schema_category → category 로 매핑
    if "schema_category" in target_df.columns:
        target_df["category"] = target_df["schema_category"]

    # DB policies 테이블의 실제 컬럼 목록
    POLICY_COLUMNS = [
        "policy_id", "policy_title", "detail_url", "source_site", "source_name",
        "data_scope",
        "title", "amin", "amax", "region", "scity",
        "income", "asset", "education", "employment",
        "disability", "gender",
        "pstart", "pend", "ostart", "oend",
        "eligibility", "add_condition",
        "support_content", "required_documents", "application_method",
        "crawl_status", "crawl_reason",
        "ai_status", "ai_reason", "ai_evidence",
        "error",
        "category",  # schema_category 매핑값
    ]

    upload_cols = [c for c in POLICY_COLUMNS if c in target_df.columns]
    upload_df = target_df[upload_cols].copy()

    # title NOT NULL 제약 → policy_title로 fallback
    if "title" in upload_df.columns and "policy_title" in target_df.columns:
        upload_df["title"] = upload_df["title"].fillna(target_df["policy_title"])

    # title도 없으면 해당 행 제외 (업로드 불가)
    before = len(upload_df)
    upload_df = upload_df[upload_df["title"].notna()]
    if len(upload_df) < before:
        print(f"  title null로 제외된 행: {before - len(upload_df)}개")

    records = [
        {k: sanitize(v, key=k) for k, v in row.items()}
        for row in upload_df.where(pd.notnull(upload_df), None).to_dict(orient="records")
    ]

    batch_size = 100
    total = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        supabase.table("policies").upsert(batch, on_conflict="policy_id").execute()
        total += len(batch)
        print(f"  upsert {total}/{len(records)}개 완료")

    print(f"upsert 완료: {total}개")
    return total


def cascade_delete_policies(supabase: Client, policy_ids: list[str]) -> int:
    """
    사라진 정책(not_seen_latest_run)을 FK 의존 순서대로 삭제.

    삭제 순서 (FK 의존성 기준):
      1. user_document_checklist (doc_id → policy_documents)
      2. policy_documents (policy_id → policies)
      3. user_document_checklist (cid → user_calendar_events) - 혹시 남은 것
      4. user_calendar_events (policy_id → policies)
      5. document_drafts, effect, user_uploaded_files, bookmarks, eligibility_results
      6. policies
    """
    if not policy_ids:
        print("삭제 대상 정책 없음")
        return 0

    print(f"cascade 삭제 시작: {len(policy_ids)}개 정책")

    for pid in policy_ids:
        # 1. policy_documents의 doc_id 조회
        doc_resp = (
            supabase.table("policy_documents")
            .select("doc_id")
            .eq("policy_id", pid)
            .execute()
        )
        doc_ids = [r["doc_id"] for r in (doc_resp.data or [])]

        # 2. user_document_checklist 삭제 (doc_id 기준)
        for doc_id in doc_ids:
            supabase.table("user_document_checklist").delete().eq("doc_id", doc_id).execute()

        # 3. policy_documents 삭제
        supabase.table("policy_documents").delete().eq("policy_id", pid).execute()

        # 4. user_calendar_events의 cid 조회 → user_document_checklist 혹시 남은 것 삭제
        cal_resp = (
            supabase.table("user_calendar_events")
            .select("cid")
            .eq("policy_id", pid)
            .execute()
        )
        cids = [r["cid"] for r in (cal_resp.data or [])]
        for cid in cids:
            supabase.table("user_document_checklist").delete().eq("cid", cid).execute()

        # 5. user_calendar_events 삭제
        supabase.table("user_calendar_events").delete().eq("policy_id", pid).execute()

        # 6. 나머지 policy_id 참조 테이블 삭제
        for table in CASCADE_TABLES_BY_POLICY_ID:
            supabase.table(table).delete().eq("policy_id", pid).execute()

        # 7. policies 삭제
        supabase.table("policies").delete().eq("policy_id", pid).execute()

    print(f"cascade 삭제 완료: {len(policy_ids)}개 정책")
    return len(policy_ids)


def get_expired_policy_ids(supabase: Client) -> list[str]:
    """
    만료 정책 ID 목록 반환.

    삭제 기준:
    - pend < today                          → 삭제
    - pend is null AND oend is null         → 삭제
    - pend is null AND oend < today         → 삭제
    - pend is null AND oend >= today        → 유지
    """
    from datetime import date
    today = date.today().isoformat()

    # 1. pend가 오늘 이전인 정책
    resp_pend = (
        supabase.table("policies")
        .select("policy_id")
        .lt("pend", today)
        .not_.is_("pend", "null")
        .execute()
    )
    pend_ids = [r["policy_id"] for r in (resp_pend.data or [])]

    # 2. pend is null AND oend is null → 삭제
    resp_both_null = (
        supabase.table("policies")
        .select("policy_id")
        .is_("pend", "null")
        .is_("oend", "null")
        .execute()
    )
    both_null_ids = [r["policy_id"] for r in (resp_both_null.data or [])]

    # 3. pend is null AND oend < today → 삭제
    resp_oend = (
        supabase.table("policies")
        .select("policy_id")
        .is_("pend", "null")
        .lt("oend", today)
        .not_.is_("oend", "null")
        .execute()
    )
    oend_expired_ids = [r["policy_id"] for r in (resp_oend.data or [])]

    ids = list(set(pend_ids + both_null_ids + oend_expired_ids))
    print(f"만료 정책: {len(ids)}개 (기준일: {today})")
    print(f"  pend 만료: {len(pend_ids)}개")
    print(f"  pend/oend 모두 null: {len(both_null_ids)}개")
    print(f"  pend null + oend 만료: {len(oend_expired_ids)}개")
    return ids


def sync_to_supabase(master_csv_path=MASTER_POLICY_PATH):
    """
    master CSV를 기준으로 Supabase를 동기화:
    1. new / updated → upsert
    2. not_seen_latest_run → cascade 삭제
    3. pend가 오늘보다 이전인 정책 → cascade 삭제
    """
    print("\n" + "=" * 60)
    print("Supabase 동기화 시작")
    print("=" * 60)

    supabase = get_supabase_client()

    df = pd.read_csv(master_csv_path, dtype={"policy_id": str})

    # 1. upsert
    upsert_count = upsert_policies(supabase, df)

    # 2. not_seen_latest_run cascade 삭제
    gone_ids = df[df["record_status"] == "not_seen_latest_run"]["policy_id"].dropna().tolist()
    delete_count = cascade_delete_policies(supabase, gone_ids)

    # 3. pend 기준 만료 정책 cascade 삭제
    expired_ids = get_expired_policy_ids(supabase)
    expired_delete_count = cascade_delete_policies(supabase, expired_ids)

    print("\n[동기화 결과]")
    print(f"  upsert:       {upsert_count}개")
    print(f"  미노출 삭제:  {delete_count}개 정책 + 연관 데이터")
    print(f"  만료 삭제:    {expired_delete_count}개 정책 + 연관 데이터")
    print("=" * 60)

    return {
        "upsert": upsert_count,
        "deleted": delete_count + expired_delete_count,
    }


if __name__ == "__main__":
    sync_to_supabase()
