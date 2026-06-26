#!/bin/bash
# create-admin: admin-boilerplate 기반 새 어드민 프로젝트 생성

set -e

BOILERPLATE_REPO="git@github.com:KKIMDoHyun/admin-boilerplate.git"
GIT_NAME="KKIMDoHyun"
GIT_EMAIL="kdh5998@naver.com"
DEFAULT_DEST="$HOME/workspace/dohyun"

echo ""
echo "🔧 create-admin — 어드민 프로젝트 생성기"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 프로젝트명 입력
read -p "프로젝트명 (예: ssong-nail-admin): " PROJECT_NAME
if [ -z "$PROJECT_NAME" ]; then
  echo "❌ 프로젝트명을 입력해주세요."
  exit 1
fi

# 2. 목적지 확인
DEST="$DEFAULT_DEST/$PROJECT_NAME"
if [ -d "$DEST" ]; then
  echo "❌ 이미 존재하는 폴더: $DEST"
  exit 1
fi

echo ""
echo "📁 생성 위치: $DEST"
echo ""

# 3. 클론
echo "📦 admin-boilerplate 클론 중..."
git clone "$BOILERPLATE_REPO" "$DEST" --quiet
cd "$DEST"

# 4. git 초기화 (보일러플레이트 히스토리 제거)
rm -rf .git
git init --quiet
git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"
git add .
git commit -m "feat: initial commit from admin-boilerplate" --quiet
echo "✅ Git 초기화 완료 (author: $GIT_NAME <$GIT_EMAIL>)"

# 5. 의존성 설치
echo "📦 pnpm install 중..."
pnpm install --silent
echo "✅ 의존성 설치 완료"

# 6. 클라이언트 GitHub 레포 연결
echo ""
read -p "클라이언트 GitHub 레포 URL (없으면 Enter 건너뜀): " REMOTE_URL

if [ -n "$REMOTE_URL" ]; then
  git remote add origin "$REMOTE_URL"
  echo "✅ Remote 연결: $REMOTE_URL"
  read -p "지금 바로 push 하시겠습니까? (y/N): " PUSH_NOW
  if [ "$PUSH_NOW" = "y" ] || [ "$PUSH_NOW" = "Y" ]; then
    git push -u origin main
    echo "✅ Push 완료"
  fi
fi

# 7. 완료 메시지
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 완료: $DEST"
echo ""
echo "다음 단계:"
echo "  1. cd $DEST"
echo "  2. .env.local 생성:"
echo "     VITE_SUPABASE_URL=https://xxxx.supabase.co"
echo "     VITE_SUPABASE_ANON_KEY=eyJxxxx"
echo "  3. Cursor에서 열고 '새 클라이언트 어드민 세팅해줘' 입력"
if [ -z "$REMOTE_URL" ]; then
  echo ""
  echo "  ※ 클라이언트 GitHub 레포 연결 (나중에):"
  echo "     git remote add origin [레포 URL]"
  echo "     git push -u origin main"
fi
echo ""
echo "  ※ 콜라보레이터 설정 (클라이언트에게 요청):"
echo "     클라이언트 GitHub repo → Settings → Collaborators → kdh5998@naver.com 초대"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
