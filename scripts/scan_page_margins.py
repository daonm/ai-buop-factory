# PDF를 페이지별 PNG로 렌더링한 뒤, 각 페이지 하단 여백 비율을 정량 측정 (PDF 여백 육안 확인의 사전 스크리닝용)
# 배경색이 순백색이 아닌 옅은 톤(--paper 등)인 디자인에서는 배경 대비 상대 임계값 방식이
# 배경 자체를 "콘텐츠 있음"으로 오판할 수 있어, 잉크 색 기준의 절대 밝기 임계값을 사용한다.
# (Day27 진행일지 참고 — 상대 임계값으로 처음 작성했을 때 전 페이지가 동일 수치로 나와 버그를 발견함)
#
# 사용법:
#   pdftoppm -png -r 150 <입력.pdf> <출력디렉토리>/page   (먼저 PDF를 페이지별 PNG로 변환)
#   python3 scripts/scan_page_margins.py <출력디렉토리>
#
# 주의: 이 스캔은 "페이지 하단이 과다하게 비었는가"만 잡아낸다. 카테고리 라벨이 콘텐츠와
# 분리되는 것처럼 여백 비율은 작지만 시각적으로 어색한 페이지 전환은 못 잡으므로,
# 이 스캔 이후 반드시 Read 툴 등으로 각 페이지를 육안 확인하는 절차를 병행할 것.

import glob
import os
import sys

from PIL import Image
import numpy as np

INK_THRESHOLD = 210  # 이보다 어두운 픽셀만 실제 잉크(텍스트/그래픽)로 간주
WARN_RATIO = 0.30    # 이 비율을 넘는 하단 여백은 경고 대상 (표지·에필로그 등 의도된 페이지는 예외)


def scan(png_dir):
    files = sorted(glob.glob(os.path.join(png_dir, "*.png")))
    if not files:
        print(f"PNG 파일을 찾을 수 없습니다: {png_dir}")
        sys.exit(1)

    for f in files:
        im = Image.open(f).convert("L")
        arr = np.array(im)
        h, _ = arr.shape
        row_has_ink = (arr < INK_THRESHOLD).any(axis=1)
        nonzero = np.where(row_has_ink)[0]
        if len(nonzero) == 0:
            ratio = 1.0
            last_row = 0
        else:
            last_row = int(nonzero[-1])
            ratio = (h - 1 - last_row) / h
        flag = " <-- 확인 필요 (30% 초과)" if ratio > WARN_RATIO else ""
        print(f"{os.path.basename(f)}: bottom_empty_ratio={ratio:.3f}{flag}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("사용법: python3 scripts/scan_page_margins.py <PNG디렉토리>")
        sys.exit(1)
    scan(sys.argv[1])
