# stud.io 디자인 시스템

KMA stud.io 서비스 개선안(`*.dc.html`)에서 실제로 쓰이는 UI를 컴포넌트로 정리한 문서입니다.
52개 섹션에 파운데이션(컬러 · 타이포 · 간격 · 아이콘)부터 화면 단위 컴포넌트까지 담았습니다.

## 열어 보기

| 방법 | 하는 일 |
|---|---|
| `index.html` 을 브라우저로 열기 | 바로 확인됩니다. 빌드 · 서버 필요 없음 |
| GitHub Pages | 저장소 Settings → Pages → 브랜치 지정. `index.html` 이 진입점입니다 |
| `dist/index.standalone.html` | CSS · JS · 이미지가 전부 인라인된 **파일 하나**. 메일 첨부나 오프라인 공유용 |

라이트 / 다크 모드는 우측 상단 버튼으로 전환하며, 선택은 `localStorage` 에 남습니다.
처음 열 때는 OS 설정을 따릅니다.

## 폴더 구조

```
stud.io-design-system/
├── index.html                      진입점 — 디자인 시스템 문서 전체
├── build.ps1                       단일 파일 배포본 생성기
├── README.md
│
├── assets/
│   ├── css/
│   │   └── style.css               토큰 · 컴포넌트 전체 (11개 섹션으로 구획)
│   ├── js/
│   │   └── script.js               인터랙션 (탭 · 아코디언 · 테마 · 스크롤 스파이)
│   └── images/
│       ├── favicon.png
│       └── logo/
│           ├── logo.png            라이트 모드
│           └── logo-dark.png       다크 모드 (원본 알파 유지 · RGB만 흰색)
│
└── dist/
    └── index.standalone.html       빌드 산출물 (직접 수정하지 마세요)
```

썸네일 · 배너 자리는 전부 CSS 그라디언트라 이미지 파일이 없습니다.
실제 이미지를 넣게 되면 `assets/images/` 아래 용도별 폴더(`thumbnails/`, `banners/`)를 만들어 쓰면 됩니다.

## 화면을 추가할 때

개선안 화면을 페이지로 더 붙일 경우:

```
pages/
└── original.html          ← assets 참조는 ../assets/... 로
```

`index.html` 과 같은 CSS · JS 를 쓰되 경로만 한 단계 올라가면 됩니다.
새 이미지는 `assets/images/` 아래 용도별 폴더에 넣고, `build.ps1` 의 `$images` 배열에 경로를 추가하면
단일 파일 배포본에도 함께 인라인됩니다.

## 수정하는 법

고칠 곳은 `assets/css/style.css` 와 `index.html` 두 곳뿐입니다.
`dist/` 는 손대지 말고, 고친 뒤 아래를 실행해 다시 만드세요.

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

빌드는 인라인되지 않은 로컬 참조가 하나라도 남으면 실패합니다.

### CSS 구획

`style.css` 는 주석으로 11개 구획을 나눠 두었습니다.

```
[1] 디자인 토큰      [1-D] 다크 테마      [2] 리셋 · 베이스
[3] 레이아웃         [4] 타이포그래피      [5] 유틸리티
[6] 공통 블록        [7] UI 컴포넌트       [8] 컬러 칩
[9] 피드백 · 모션    [10] 반응형          [11] 서비스 컴포넌트
```

값은 직접 쓰지 말고 `[1]` 의 토큰을 참조합니다. 다크 모드 값은 `[1-D]` 한 곳에만 있어서,
컴포넌트는 테마를 신경 쓰지 않아도 됩니다.

## 지켜야 할 규칙

- **인라인 스타일 금지** — `style="..."` 속성은 0개입니다
- **원본 우선** — 개선안에 있는 디자인을 먼저 적용하고, 없는 것은 만들지 않습니다
- **가독성 하한** — 본문 16px · 최소 14px · 태그 13px. 원본이 10~12px 이어도 이 하한을 지킵니다
- **대비** — 본문 텍스트는 라이트 · 다크 양쪽에서 WCAG AA(4.5:1) 이상
- **아이콘** — Google Material Symbols. HTML 에는 아이콘 *이름*만 적고 크기 · 굵기는 CSS 변수로 조절합니다

## 외부 의존

CDN 두 곳만 씁니다. 그 외 라이브러리·빌드 도구는 없습니다.

- [Pretendard](https://github.com/orioncactus/pretendard) — 본문 서체
- [Material Symbols Outlined](https://fonts.google.com/icons) — 아이콘

## 출처

모든 컴포넌트는 개선안 원본에서 값을 가져왔고, 각 섹션 카드 우측 상단에 `출처 ·` 로 어느 화면에서
왔는지 적어 두었습니다. 근거를 찾지 못한 항목은 만들어 넣지 않고 빈 상태로 남겨 두었습니다.
