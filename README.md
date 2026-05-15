# 번개장터 판매글 작성 스킬

상품 사진을 분석하여 정보와 시세를 확인, 번개장터 판매글 초안을 작성합니다.

```text
products/
  ai-context.md    # AI 작업 지침
  template.md      # 판매글 기본값
  {product-name}/
    image-01.jpg   # 사용자가 추가한 상품 사진
    image-02.jpg
    official-01.jpg # 선택: 유저가 추가하거나 스킬이 확보하는 대표 이미지 후보
    note.md        # 선택: 상품별 메모와 입력값
```

## 실행 순서

1. 촬영한 상품 사진을 `products/{product-name}/` 폴더에 넣습니다.
2. Claude나 Codex에서 `bunjang-sales`를 실행합니다.
    - `bunjang-sales`: 브라우저 설정과 로그인 확인부터 진행하고, `products/` 아래 상품 폴더를 순서대로 처리합니다.
    - `bunjang-sales <dir>`: 브라우저 설정과 로그인 확인부터 진행하고, 지정한 상품 폴더 하나만 처리합니다.
    - `bunjang-sales setup`: 판매글 작성 없이 브라우저 설정과 로그인 확인만 진행합니다.
3. 브라우저가 열리면 번개장터에 로그인합니다.
4. 스킬이 상품 사진, 시세, 대표 이미지를 확인하고 판매글 초안을 입력합니다.
5. 사용자가 초안을 직접 검토한 뒤 등록합니다.
