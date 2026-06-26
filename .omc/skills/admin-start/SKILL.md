# Admin Start — 자동 모드 라우터

어드민 관련 요청이 들어오면 **모드를 지정하지 않아도** 상황을 판단해 적절한 OMC 모드를 자동 선택한다.

## 사용법

```
새 클라이언트 어드민 세팅해줘 → 자동으로 인터뷰 또는 admin-kickoff 선택
contacts에 주소 컬럼 추가해줘 → 바로 실행
에러 여러 개 고쳐줘 → ultrawork
```

---

## 자동 라우팅 로직

**사용자에게 모드를 묻지 말고 직접 판단해서 실행한다.**

### 1. 새 클라이언트 적용 요청

"새 프로젝트 세팅", "클라이언트 적용", "외주 세팅" 등의 요청은 아래 항목을 체크한다:

| 항목 | 있음 | 없음 |
|------|------|------|
| Supabase URL / ANON KEY | +2 | 0 |
| contacts 컬럼 구성 | +2 | 0 |
| 클라이언트명 / 도메인 | +1 | 0 |

**점수 0~2점**: 정보 부족 → 인터뷰 진행 후 `admin-kickoff`

**점수 3점 이상**: 정보 충분 → `admin-kickoff` 바로 실행

#### 인터뷰 질문 순서 (정보 부족 시)

1. 클라이언트명과 도메인 (예: `admin.example.com`)
2. Supabase 프로젝트 URL과 ANON KEY 있는지
3. contacts 테이블 컬럼 구성 (기본: 이름·이메일·전화·메시지. 추가/제거할 컬럼?)
4. 관리자 계정 이메일 (Supabase Auth에 생성할 계정)

충분한 정보가 모이면 `admin-kickoff` 스킬 실행.

### 2. 작업 성격별 분기

| 요청 유형 | 선택 모드 |
|-----------|----------|
| 새 클라이언트 전체 세팅 | 점수 기반 위 로직 |
| contacts 컬럼 추가/제거 | 바로 실행 (database.ts + contact-fields.ts 동시 수정) |
| 에러 여러 파일 | `ultrawork` |
| 버그인데 원인 불명확 | `debugger` 에이전트 |
| 리팩토링 / 범위 큰 작업 | `ralplan` 먼저 |
| 완성까지 검증 필요 | `ralph` 루프 |
| 단순 1~2파일 수정 | 바로 처리 |

### 3. 완료 후 항상

1. `pnpm lint` 통과 확인 (sandbox 내 가능)
2. `pnpm build` 성공 확인 (required_permissions: all)
3. lsp_diagnostics로 타입 에러 0개 확인
4. 변경사항 요약 (한국어)
5. OMC Commit Protocol 트레일러 포함 커밋

---

## 판단 예시

| 입력 | 점수 | 선택 |
|------|------|------|
| "어드민 세팅해줘" | 0 | 인터뷰 |
| "새 클라이언트인데 컬럼은 이름·이메일·메시지만" | 2 | 인터뷰 (Supabase 정보 없음) |
| "Supabase URL, KEY 있고 컬럼은 기본 + 회사명 추가" | 5 | admin-kickoff 바로 실행 |
| "phone 컬럼 제거해줘" | — | 바로 실행 |
| "lint 에러 다 고쳐줘" | — | ultrawork |

---

## 참고

- `admin-kickoff`: 실제 8단계 적용 프로세스
- CLAUDE.md: 코드 컨벤션 + OMC 작업 원칙
- `.cursor/rules/contact-fields.mdc`: contact-fields.ts 수정 패턴
- `.cursor/rules/supabase.mdc`: Supabase RLS + Auth 설정
