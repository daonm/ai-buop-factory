#!/usr/bin/env python3
"""
견적서 · 인보이스 자동 생성 스크립트
------------------------------------
clients.csv(고객명, 품목, 수량, 단가)를 읽어 고객별로 스타일이 적용된
HTML 인보이스를 자동 생성합니다. HTML은 브라우저에서 열어 Ctrl+P → PDF로 저장하면
바로 발송 가능한 인보이스가 됩니다 (별도 라이브러리 설치 없이 표준 라이브러리만 사용).

사용법:
    python generate_invoice.py clients.csv --company "내 회사명" --out invoices/

clients.csv 형식 (헤더 필수):
    고객명,품목,수량,단가
    ABC상사,컨설팅,1,500000
    ABC상사,자료제작,2,150000
    XYZ스튜디오,디자인,1,300000
"""
import argparse
import csv
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

TEMPLATE = """<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>인보이스 — {client}</title>
<style>
  body {{ font-family: -apple-system, "Malgun Gothic", sans-serif; max-width: 720px; margin: 40px auto; color: #262C3D; }}
  h1 {{ font-size: 1.6rem; border-bottom: 3px solid #B87F1F; padding-bottom: 12px; }}
  .meta {{ color: #565F72; margin-bottom: 24px; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
  th, td {{ text-align: left; padding: 10px 12px; border-bottom: 1px solid #D9DACB; }}
  th {{ background: #8F6215; color: #fff; font-size: 0.85rem; }}
  td.num, th.num {{ text-align: right; font-variant-numeric: tabular-nums; }}
  tfoot td {{ font-weight: 700; border-top: 2px solid #262C3D; border-bottom: none; }}
  .company {{ text-align: right; color: #565F72; font-size: 0.9rem; }}
</style></head>
<body>
  <div class="company">{company}</div>
  <h1>인보이스</h1>
  <p class="meta">고객명: <strong>{client}</strong> &nbsp;|&nbsp; 발행일: {issue_date}</p>
  <table>
    <thead><tr><th>품목</th><th class="num">수량</th><th class="num">단가</th><th class="num">금액</th></tr></thead>
    <tbody>
      {rows}
    </tbody>
    <tfoot><tr><td colspan="3">합계</td><td class="num">{total}원</td></tr></tfoot>
  </table>
  <p class="meta">이 파일을 브라우저에서 열어 Ctrl+P(또는 Cmd+P) → PDF로 저장하면 바로 발송할 수 있습니다.</p>
</body></html>
"""

ROW_TEMPLATE = '<tr><td>{item}</td><td class="num">{qty}</td><td class="num">{price:,}원</td><td class="num">{amount:,}원</td></tr>'


def main():
    parser = argparse.ArgumentParser(description="고객별 HTML 인보이스 자동 생성")
    parser.add_argument("csv_path", help="고객명,품목,수량,단가 컬럼을 가진 CSV 파일")
    parser.add_argument("--company", default="회사명", help="인보이스 우측 상단에 표시할 발행자명")
    parser.add_argument("--out", default="invoices", help="인보이스 HTML을 저장할 폴더")
    args = parser.parse_args()

    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        sys.exit(f"에러: CSV 파일을 찾을 수 없습니다 — {csv_path}")

    by_client = defaultdict(list)
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        required = {"고객명", "품목", "수량", "단가"}
        if not required.issubset(reader.fieldnames or []):
            sys.exit(f"에러: CSV 헤더는 {sorted(required)}를 포함해야 합니다. 현재: {reader.fieldnames}")
        for row in reader:
            by_client[row["고객명"]].append(row)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    for client, rows in by_client.items():
        row_html = []
        total = 0
        for r in rows:
            qty = int(float(r["수량"]))
            price = int(float(r["단가"]))
            amount = qty * price
            total += amount
            row_html.append(ROW_TEMPLATE.format(item=r["품목"], qty=qty, price=price, amount=amount))

        html = TEMPLATE.format(
            client=client,
            company=args.company,
            issue_date=date.today().isoformat(),
            rows="\n      ".join(row_html),
            total=f"{total:,}",
        )
        out_path = out_dir / f"{client}_invoice.html"
        out_path.write_text(html, encoding="utf-8")
        print(f"생성: {out_path} (합계 {total:,}원)")

    print(f"\n총 {len(by_client)}명 고객분 인보이스 생성 완료 → {out_dir}/")


if __name__ == "__main__":
    main()
