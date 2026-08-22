# 03. 엑셀/CSV 데이터 정리 스크립트

전자책 『야근 없는 사무실』 **방법 5 — 엑셀/스프레드시트 데이터 정리**에 대응하는 실제 동작 코드입니다.

## 무엇을 하나요
- 컬럼명·문자열 셀의 좌우 공백 제거
- 완전히 빈 행 제거
- 중복 행 제거
- `--group`으로 지정한 컬럼 기준 합계(`--sum`)/평균(`--avg`) 요약 시트 자동 생성
- 원본 파일은 절대 건드리지 않고 `_cleaned` 접미사가 붙은 새 파일로 저장

## 설치
```bash
pip install -r requirements.txt
```

## 사용법
```bash
python clean_data.py 원본.csv --group 지점 --sum 매출 --avg 방문자수
```
- `.xlsx` 파일도 그대로 넣으면 자동으로 엑셀로 읽고 엑셀로 저장합니다.
- `sample_before.csv`로 먼저 테스트해보세요:
  ```bash
  python clean_data.py sample_before.csv --group 지점 --sum 매출 --avg 방문자수
  ```
  실행하면 `sample_before_cleaned.csv`(정리본)와 `sample_before_cleaned_summary.csv`(지점별 요약)가 생성됩니다.

## 클로드에게 커스터마이징 요청하는 법
이 스크립트를 내 데이터에 맞게 바꾸고 싶다면, 아래처럼 그대로 붙여넣으세요.

> 이 파이썬 스크립트가 있어: [clean_data.py 내용 붙여넣기]. 내 데이터는 [컬럼 설명]으로 되어 있어. [원하는 정리 규칙]을 추가로 넣고 싶어. 수정해줘.

## 막힐 때
- `ModuleNotFoundError: No module named 'pandas'` → `pip install -r requirements.txt`를 먼저 실행했는지 확인하세요.
- 한글 엑셀에서 CSV로 저장한 파일이 깨져 보이면, 저장 시 인코딩을 "CSV UTF-8"로 선택하세요. 이 스크립트는 저장 시 자동으로 `utf-8-sig` 인코딩을 사용해 엑셀에서 바로 열어도 한글이 깨지지 않습니다.
