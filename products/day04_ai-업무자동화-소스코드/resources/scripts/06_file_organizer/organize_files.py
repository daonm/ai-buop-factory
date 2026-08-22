#!/usr/bin/env python3
"""
파일 · 폴더 정리 자동화 스크립트
------------------------------------
지정한 폴더의 파일들을 확장자별 하위 폴더로 "이동"합니다 (삭제는 절대 하지 않습니다).
--year-first를 붙이면 파일의 수정연도 폴더 → 확장자 폴더 순서로 2단 분류합니다.

기본은 항상 --dry-run처럼 미리보기만 하는 게 아니라 실제 이동을 수행하니,
처음 쓸 때는 반드시 --preview로 먼저 결과를 확인하세요.

사용법:
    python organize_files.py ~/Downloads --preview       # 미리보기만, 실제 이동 없음
    python organize_files.py ~/Downloads                  # 실제로 확장자별 폴더로 이동
    python organize_files.py ~/Downloads --year-first      # 연도별 → 확장자별 2단 분류
"""
import argparse
import shutil
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

EXT_GROUPS = {
    "이미지": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".svg"},
    "문서": {".pdf", ".doc", ".docx", ".hwp", ".txt", ".md"},
    "스프레드시트": {".xls", ".xlsx", ".csv"},
    "압축파일": {".zip", ".rar", ".7z", ".tar", ".gz"},
    "동영상": {".mp4", ".mov", ".avi", ".mkv"},
    "음악": {".mp3", ".wav", ".m4a"},
}


def group_name(ext: str) -> str:
    for name, exts in EXT_GROUPS.items():
        if ext.lower() in exts:
            return name
    return "기타" if ext else "확장자없음"


def plan_moves(folder: Path, year_first: bool):
    moves = []
    for item in folder.iterdir():
        if item.is_dir():
            continue  # 이미 정리된 하위 폴더는 건드리지 않음
        ext = item.suffix
        group = group_name(ext)
        if year_first:
            year = datetime.fromtimestamp(item.stat().st_mtime).strftime("%Y")
            dest_dir = folder / year / group
        else:
            dest_dir = folder / group
        moves.append((item, dest_dir / item.name))
    return moves


def main():
    parser = argparse.ArgumentParser(description="파일을 확장자(및 연도)별 폴더로 정리 이동")
    parser.add_argument("folder", help="정리할 폴더 경로")
    parser.add_argument("--year-first", action="store_true", help="연도 폴더 → 확장자 폴더 순으로 2단 분류")
    parser.add_argument("--preview", action="store_true", help="실제 이동 없이 계획만 출력")
    args = parser.parse_args()

    folder = Path(args.folder).expanduser()
    if not folder.is_dir():
        sys.exit(f"에러: 폴더를 찾을 수 없습니다 — {folder}")

    moves = plan_moves(folder, args.year_first)
    if not moves:
        print("정리할 파일이 없습니다 (이미 하위 폴더로 다 옮겨졌거나 빈 폴더).")
        return

    summary = defaultdict(int)
    for src, dst in moves:
        summary[dst.parent] += 1

    print(f"총 {len(moves)}개 파일, {len(summary)}개 폴더로 분류 예정:")
    for folder_path, count in sorted(summary.items()):
        print(f"  {folder_path.relative_to(folder.parent) if folder_path.is_relative_to(folder.parent) else folder_path} — {count}개")

    if args.preview:
        print("\n--preview 모드: 실제로 이동하지 않았습니다. 결과가 맞으면 --preview 없이 다시 실행하세요.")
        return

    for src, dst in moves:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            # 같은 이름 파일이 이미 있으면 덮어쓰지 않고 번호를 붙여 보존
            stem, suffix, n = dst.stem, dst.suffix, 1
            while dst.exists():
                dst = dst.parent / f"{stem}_{n}{suffix}"
                n += 1
        shutil.move(str(src), str(dst))
    print(f"\n완료: {len(moves)}개 파일 이동 (삭제된 파일 없음)")


if __name__ == "__main__":
    main()
