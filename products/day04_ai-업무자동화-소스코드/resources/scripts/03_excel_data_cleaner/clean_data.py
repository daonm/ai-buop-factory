#!/usr/bin/env python3
"""
엑셀/CSV 데이터 정리 스크립트
------------------------------------
- 중복 행 제거
- 빈 값(공백/NaN) 정리
- 컬럼명 좌우 공백 제거 + 통일
- 지정한 컬럼 기준으로 합계/평균 요약 시트 생성
- 결과를 새 파일로 저장 (원본은 절대 덮어쓰지 않음)

사용법:
    pip install -r requirements.txt
    python clean_data.py 원본.csv --group 지점 --sum 매출 --avg 방문자수

CSV뿐 아니라 --input 확장자가 .xlsx면 자동으로 엑셀로 읽고 엑셀로 저장합니다.
"""
import argparse
import sys
from pathlib import Path

import pandas as pd


def load_table(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    return pd.read_csv(path)


def save_table(df: pd.DataFrame, path: Path) -> None:
    if path.suffix.lower() in (".xlsx", ".xls"):
        df.to_excel(path, index=False)
    else:
        df.to_csv(path, index=False, encoding="utf-8-sig")


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # 컬럼명 좌우 공백 제거
    df.columns = [str(c).strip() for c in df.columns]
    # 문자열 셀 좌우 공백 제거 (pandas 2.x/3.x 모두에서 동작하도록 dtype을 직접 확인)
    text_cols = [c for c in df.columns if df[c].dtype == object or pd.api.types.is_string_dtype(df[c])]
    for col in text_cols:
        df[col] = df[col].astype(str).str.strip().replace({"nan": pd.NA, "": pd.NA})
    # 완전히 빈 행 제거
    df = df.dropna(how="all")
    # 중복 행 제거
    before = len(df)
    df = df.drop_duplicates()
    removed = before - len(df)
    if removed:
        print(f"중복 행 {removed}개 제거")
    return df.reset_index(drop=True)


def build_summary(df: pd.DataFrame, group_col: str, sum_cols, avg_cols) -> pd.DataFrame:
    agg = {}
    for c in sum_cols:
        agg[c] = "sum"
    for c in avg_cols:
        agg[c] = "mean"
    if not agg:
        raise ValueError("--sum 또는 --avg 중 하나는 지정해야 합니다.")
    summary = df.groupby(group_col, dropna=False).agg(agg).reset_index()
    for c in avg_cols:
        summary[c] = summary[c].round(2)
    return summary


def main():
    parser = argparse.ArgumentParser(description="엑셀/CSV 데이터 정리 + 요약 스크립트")
    parser.add_argument("input", help="원본 파일 경로 (.csv 또는 .xlsx)")
    parser.add_argument("--output", help="정리된 결과 저장 경로 (기본: 원본이름_cleaned.csv)")
    parser.add_argument("--group", help="요약 시트를 만들 그룹 기준 컬럼명 (예: 지점)")
    parser.add_argument("--sum", nargs="*", default=[], help="합계를 낼 컬럼명 목록")
    parser.add_argument("--avg", nargs="*", default=[], help="평균을 낼 컬럼명 목록")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        sys.exit(f"에러: 입력 파일을 찾을 수 없습니다 — {input_path}")

    output_path = Path(args.output) if args.output else input_path.with_name(
        input_path.stem + "_cleaned" + input_path.suffix
    )

    df = load_table(input_path)
    print(f"원본 {len(df)}행, {len(df.columns)}열 로드")

    cleaned = clean(df)
    save_table(cleaned, output_path)
    print(f"정리 완료 → {output_path} ({len(cleaned)}행)")

    if args.group:
        summary = build_summary(cleaned, args.group, args.sum, args.avg)
        summary_path = output_path.with_name(output_path.stem + "_summary" + output_path.suffix)
        save_table(summary, summary_path)
        print(f"요약 시트 생성 → {summary_path}")
        print(summary.to_string(index=False))


if __name__ == "__main__":
    main()
