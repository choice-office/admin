# 배포 / 커밋 규칙 (Vercel)

> 온케팅 공통 규칙(`onketing/homepage`·`tool`·`choice-homepage`와 동일 방식). 평소엔 **커밋만 하고 push 하지 않는다**(push = Vercel 배포 트리거). 배포할 때만 배포 커밋을 HEAD로 얹고 push. (이 프로젝트는 Vite SPA → Vercel 정적 배포)

## 배경 — 왜 "배포 커밋"을 따로 두나
- private repo + Vercel이면, **배포되는 HEAD 커밋의 author가 프로젝트 소유자(검증된 이메일)여야만** 배포된다. 아니면 "Deployment Blocked — commit author did not have contributing access". Vercel은 **HEAD 커밋 author만** 검사(중간 커밋 무관, 토큰으로 우회 불가).
- 그래서 작업 커밋은 개발자 개인 author로 쌓고(개인 잔디 유지), 배포 순간에만 소유자 author의 빈 커밋을 HEAD로 얹어 push한다.

## 신원 (이 repo)
- **작업 author** = `KKIMDoHyun <kdh5998@naver.com>` (repo git config 기본) → 개발자 개인 잔디.
- **배포 author** = `choice <lawforyou7@naver.com>` (Vercel 소유자 검증 이메일) → 이 author의 HEAD 커밋만 배포됨.

## 워크플로
- 평소엔 **커밋만, push 금지**.
- 배포할 때만:
  ```bash
  git deploy   # 이 repo 전용 별칭
  # = git commit --allow-empty --author="choice <lawforyou7@naver.com>" -m "chore: deploy" && git push
  ```
  → 대기 중이던 개인 커밋 + 배포 커밋이 함께 push되고 **HEAD(choice)** 로 배포됨(READY).

## 잔디(기여 그래프)
- 작업 커밋(KKIMDoHyun author) → 개발자 개인 계정 잔디.
- 배포 커밋(choice author) → `lawforyou7@naver.com` 연결 계정 잔디.

## Claude Code 규칙
- **"커밋해"** → 개인 author(KKIMDoHyun)로 커밋만. **push 금지.**
- **"배포해 / 푸시해"** → `git deploy`로 choice 배포 커밋 생성 + push.
- git config·`git deploy` 별칭은 이 repo에만(repo-local) 적용 — 전역/다른 프로젝트 무영향.

> 별칭 재설정이 필요하면:
> ```bash
> git config alias.deploy '!git commit --allow-empty --author="choice <lawforyou7@naver.com>" -m "chore: deploy" && git push'
> ```
