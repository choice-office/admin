# 초이스 행정사 사무소 — Design System

출입국·비자 전문 **초이스 행정사 사무소**(kvisa1345.com) 홈페이지를 위한 디자인 시스템.
무드는 **따뜻하지만 묵직하고 신뢰감 있는 토프 브라운** — 흰 배경 + 브라운 포인트, 클래식·전문가 톤. 한국어 우선(고령 의뢰인 포함)이라 **본문 가독성·대비**를 최우선으로 둡니다.

## 소스
- **코드베이스**: `src/` (Next.js App Router + Tailwind v4 + shadcn/base-ui). 토큰은 `src/app/globals.css`, 컴포넌트는 `src/components/ui/*`, 콘텐츠 데이터는 `src/data/*`, 전역 설정은 `src/config/site.ts` 기준.
- 이 디자인 시스템의 토큰·컴포넌트·UI 키트는 모두 위 코드베이스를 그대로 옮긴 것입니다(신규 디자인 아님).

---

## CONTENT FUNDAMENTALS — 카피 톤
- **언어**: 한국어. 문어체 존댓말("~합니다", "~드립니다"). 영문은 비자 코드(E-6, F-4)·eyebrow 라벨(SERVICES, PROCESS)에만 제한적으로 사용.
- **인칭**: 사무소는 "초이스 행정사 사무소" 또는 "행정사", 고객은 "의뢰인". 1인칭 "저희"보다 사무소명/직함을 씀.
- **톤**: 따뜻하고 신중함. 단정·과장 금지 — "100% 승인" 같은 결과 보장 표현은 절대 쓰지 않음. 대신 "현실적인 방향을 솔직하게 안내". 신뢰 지표는 사실 위주(개소 연도, 등록번호, 직접 진행).
- **대표 문구**: "복잡한 행정 절차, 혼자 고민하지 마세요", "실력에 책임감을 더한", "사무장 없는 사무소 · 시험 출신 행정사 직접 상담".
- **이모지**: 사용 안 함. 아이콘은 Lucide 라인 아이콘으로 대체.
- **줄바꿈**: 한글은 `word-break: keep-all`(어절 단위). 제목은 `text-wrap: balance`, 본문은 `text-wrap: pretty`.

## VISUAL FOUNDATIONS
- **색**: 토프 브라운 단일 계열. Primary `#6C5D4C`, hover/푸터는 PrimaryDark `#524636`, 포인트 Accent `#7C6346`, 배지·강조 배경 AccentSoft `#E1D7C6`. 면은 흰색→Surface `#F5F3EF`→SurfaceAlt `#ECE7DF` 3단. 보라/파랑 그라데이션·네온 금지. 브라운 면 위 텍스트는 흰색, 밝은 면 위는 Ink/Body.
- **타입**: Noto Sans KR 400/500/700. H1 56(48–60) / H2 34 / H3 20 / Body 16–18 / Small 14 / Caption 13. 제목 letter-spacing −0.02em, 본문 line-height 1.7. 본문은 가독성을 위해 작게 가지 않음(폼 입력도 16px·48px 높이).
- **배경/이미지**: 히어로는 풀블리드 사진(따뜻한 도심 스카이라인) + 좌→우 어두운 토프 그라데이션 오버레이로 좌측 텍스트 가독성 확보. 본문 섹션은 흰색/Surface 교차. 패턴·텍스처·일러스트는 쓰지 않음.
- **모서리**: radius 6px(살짝 각진 클래식)가 기본. 배지·아바타만 pill/원형. 과한 라운딩 지양.
- **그림자**: 약하게만. 카드는 거의 없는 1px 보더가 기본, hover 시 `0 6px 20px rgba(82,70,54,.1)` + `translateY(-2px)`. 무거운 drop-shadow 금지.
- **보더**: 1px `#E2DDD3`가 카드·입력·구분선의 기본.
- **애니메이션**: 절제됨. fade-in/up(짧은 ease), 신뢰 띠 marquee, 헤더 투명→흰 배경 0.3s 전환. 바운스·과장된 모션 없음.
- **hover**: primary 버튼은 PrimaryDark로 어두워짐, outline/ghost는 Surface 배경, 링크는 Primary 색. **press**: 살짝 아래로(translateY 1px).
- **focus**: Primary 2px outline 또는 입력 필드 3px Primary 링(rgba 18%).
- **레이아웃**: 컨테이너 1152(기본)/1280(와이드). 섹션 상하 96px. 헤더 80px 고정(홈 상단 투명 → 스크롤 시 흰 배경+blur). 4px 그리드.

## ICONOGRAPHY
- **Lucide** 라인 아이콘(`lucide-react`)을 코드베이스 전역에서 사용. stroke-width ≈ 1.75, 크기 20–30px, 색은 보통 Primary 또는 배지 안에서 PrimaryDark.
- 업무분야 매핑: 단기초청 `user-plus`, 주재원 `briefcase`, 연예인 `mic`, 전문직 `graduation-cap`, 재외동포 `globe`, 영주권 `shield-check`, 결혼비자 `heart`, 국적회복 `flag`. 프로세스: `message-square` `clipboard-list` `file-check-2` `stamp`.
- 직접 SVG를 그리지 말 것 — Lucide CDN(`https://unpkg.com/lucide`)에서 `data-lucide` 속성으로 사용. 이모지·유니코드 아이콘 사용 안 함.
- **로고**: 별도 심볼 없이 텍스트 워드마크 "초이스 행정사 사무소"(Noto Sans KR Bold, −0.02em). 흰 배경엔 Ink, 브라운/푸터 위엔 흰색.

---

## 색 대비·접근성
고령 의뢰인을 포함하므로: 본문 최소 16px, 입력 16px·높이 48px, 보조 텍스트도 Muted(#888) 이하로 흐리게 쓰지 않음. 모든 인터랙티브 요소는 가시적 focus 링 제공.

## INDEX — 파일 안내
- `styles.css` — 전역 진입점(`@import`만). 소비 프로젝트는 이 파일 하나만 link.
- `tokens/` — `colors.css` `typography.css` `spacing.css` `fonts.css` `base.css`.
- `components/core/` — **Button, Badge, Card**(+ CardTitle/CardBody).
- `components/forms/` — **Label, Input, Select, Textarea**.
- `ui_kits/website/` — 홈페이지 인터랙티브 재현(`index.html` + `screens.jsx`). 홈 ↔ 업무분야 전환.
- `guidelines/*.card.html` — Design System 탭 스펙 카드(Colors / Type / Spacing / Brand).
- `SKILL.md` — Agent Skills 호환 진입점.

## CAVEATS
- **글꼴**: 원본은 `next/font`로 Noto Sans KR 를 로드. 여기서는 Google Fonts CDN `@import`로 동일 글꼴을 제공(번들 .ttf 미포함). 오프라인/자체 호스팅이 필요하면 폰트 파일을 받아 `@font-face`로 교체 필요.
- **히어로 이미지**: 원본과 동일한 임시 Unsplash 스톡(여의도 스카이라인). 실제 광화문/사무실 사진 수령 시 교체.
- **대표 행정사 성함/사진**: 코드베이스에 `○○○` 플레이스홀더 — 미포함.
