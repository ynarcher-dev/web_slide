# Web Slide

슬라이드 템플릿 안에 실제 웹페이지를 삽입해, 설명과 제품 시연을 하나의 발표 흐름에서 진행하는 웹 프레젠테이션 도구다.

- 표지와 본문 두 가지 템플릿만 제공하고 레이아웃은 자동으로 계산한다.
- 본문 콘텐츠는 16:9로 고정한 영역 하나이며, 웹페이지(iframe)·이미지·붙여 넣은 HTML 중 하나를 넣는다.
- HTML 슬라이드에 넣을 장표는 [HTML 슬라이드 작성 프롬프트](docs/product/html-slide-prompt.md)의 기준을 따른다.
- 발표 모드에서 슬라이드를 넘기다가 삽입한 웹페이지를 그대로 조작할 수 있다.
- 읽기 전용 공유 링크를 지원한다.

자세한 제품 범위는 [제품 기획서](docs/product/web-slide-product-plan.md), 기술 결정은 [개발 스택 문서](docs/technical/development-stack.md), 개발 진행 기준은 [AGENTS.md](AGENTS.md)에 있다.
초기 기준에서 달라진 부분은 [보완 사항 문서](docs/product/scope-updates.md)에, 출시 전 사람이 훑는 확인 절차는 [수동 확인 시나리오](docs/technical/mvp-manual-scenario.md)에 있다.

## 요구 사항

| 항목     | 버전                                        |
| -------- | ------------------------------------------- |
| Node.js  | 20.9 이상 (`--env-file-if-exists` 사용)     |
| pnpm     | 11.9 이상                                   |
| Supabase | 프로젝트 하나 (로컬 CLI 또는 원격 프로젝트) |
| Chromium | E2E를 돌릴 때만 필요. Playwright로 설치한다 |

## 설치와 실행

```bash
pnpm install

# 환경 변수 준비
cp .env.example .env.local   # 값은 아래 표를 참고해 채운다

# DB 스키마 적용
pnpm db:push

# 개발용 데모 데이터(선택). 운영 DB에는 넣지 않는다
pnpm db:seed

# E2E를 돌릴 때 한 번만
pnpm exec playwright install chromium

pnpm dev
```

`http://localhost:3000/presentations`로 접속한다. 로그인하지 않았다면 `/login`으로 이동한다. `pnpm db:seed`를 실행했다면 `demo@webslide.test` / `WebSlide!2026`으로 로그인할 수 있다.

루트 경로 `/`는 서비스 소개만 표시하는 화면이다. 실제 기능은 `/presentations` 아래에 있다.

## 환경 변수

`.env.local`에 채운다. 예시는 [.env.example](.env.example)에 있다.

| 변수                                   | 필수   | 사용처                | 설명                                                                        |
| -------------------------------------- | ------ | --------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | 예     | 런타임(브라우저·서버) | 공유 링크가 쓰는 절대 주소의 기준. 배포 도메인을 넣는다                     |
| `NEXT_PUBLIC_SUPABASE_URL`             | 예     | 런타임(브라우저·서버) | Supabase 프로젝트 URL                                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 예     | 런타임(브라우저·서버) | Supabase publishable 키. 브라우저에 노출되며 접근은 RLS로 제한한다          |
| `SUPABASE_DB_URL`                      | 아니오 | 로컬 스크립트 전용    | 마이그레이션·타입 생성·RLS 검증 스크립트가 쓰는 직접 연결 문자열. 커밋 금지 |
| `SUPABASE_ACCESS_TOKEN`                | 아니오 | 로컬 스크립트 전용    | 있으면 Docker 없이 `pnpm db:types`를 실행한다                               |

`NEXT_PUBLIC_*` 세 개는 [src/lib/env.ts](src/lib/env.ts)에서 zod로 검증한다. 값이 없거나 형식이 틀리면 앱이 시작하면서 실패한다.

서버 전용 비밀 키(`service_role` 등)는 애플리케이션 런타임에서 사용하지 않는다.

## 명령어

| 명령                     | 하는 일                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `pnpm dev`               | 개발 서버                                                   |
| `pnpm build`             | 프로덕션 빌드                                               |
| `pnpm start`             | 빌드 결과 실행                                              |
| `pnpm validate`          | 타입 검사 → 린트 → 포맷 검사 → 단위 테스트 → 파일 길이 검사 |
| `pnpm typecheck`         | `tsc --noEmit`                                              |
| `pnpm lint`              | ESLint                                                      |
| `pnpm format`            | Prettier 적용                                               |
| `pnpm format:check`      | Prettier 검사                                               |
| `pnpm test`              | Vitest 단위·컴포넌트 테스트                                 |
| `pnpm test:watch`        | Vitest watch                                                |
| `pnpm e2e`               | Playwright E2E 전체(chromium). 개발 서버를 자동으로 띄운다  |
| `pnpm e2e:browsers`      | firefox, webkit, msedge에서 지원 범위 스모크만 실행         |
| `pnpm check:file-length` | 직접 작성한 소스가 500줄을 넘지 않는지 검사                 |
| `pnpm db:push`           | `supabase/migrations`를 대상 DB에 적용                      |
| `pnpm db:seed`           | `supabase/seed.sql` 적용. 개발·검증 환경 전용               |
| `pnpm db:types`          | `src/types/database.types.ts` 재생성                        |
| `pnpm db:verify-rls`     | 임시 사용자 두 명으로 RLS 정책을 확인하고 정리              |

`db:*` 명령은 `.env.local`의 `SUPABASE_DB_URL`을 사용한다.

## 테스트

```bash
pnpm validate       # 타입·린트·포맷·단위 테스트·파일 길이
pnpm e2e            # chromium 전체. axe 접근성 검사와 콘솔 오류 검사 포함
pnpm e2e:browsers   # firefox, webkit, msedge 지원 범위 스모크
pnpm db:verify-rls  # RLS 정책 재검증
```

E2E는 다음을 전제로 한다.

- `pnpm db:seed`로 만든 데모 계정이 대상 DB에 있어야 한다.
- 일부 테스트가 `https://example.com`을 iframe으로 띄우므로 네트워크가 필요하다.
- `pnpm e2e:browsers`는 firefox와 webkit 실행 파일이 필요하다. `pnpm exec playwright install firefox webkit`으로 한 번 설치한다.

모든 E2E가 같은 데모 계정을 쓰고 Supabase 로그아웃이 그 사용자의 모든 세션을 끊기 때문에 `workers: 1`로 순차 실행한다.

## 라우트

| 경로                          | 설명                                                          |
| ----------------------------- | ------------------------------------------------------------- |
| `/`                           | 서비스 소개                                                   |
| `/login`                      | 이메일 + 비밀번호 로그인과 회원가입                           |
| `/presentations`              | 내 프레젠테이션 목록, 만들기·이름 변경·삭제·설정              |
| `/presentations/[id]/edit`    | 3단 편집기: 슬라이드 목록, 미리보기, 속성 패널                |
| `/presentations/[id]/present` | 전체화면 발표                                                 |
| `/share/[shareId]`            | 공개 프레젠테이션의 읽기 전용 발표                            |
| `/design-preview`             | 내부 확인용 디자인 토큰·공통 UI 화면. 프로덕션 빌드에서는 404 |

`/presentations` 아래는 각 페이지가 [requireUser](src/features/auth/require-user.ts)로 직접 막는다. Server Action도 저마다 다시 확인하고, DB 쪽 RLS가 마지막 한 겹을 맡는다. 미들웨어(`proxy.ts`)는 두지 않는다. Cloudflare Workers가 Node 미들웨어를 지원하지 않기 때문이며, 세션 쿠키 갱신은 보호 레이아웃의 [SessionRefresher](src/features/auth/components/session-refresher.tsx)가 브라우저에서 처리한다.

## 배포

Cloudflare Workers에 배포한다. Next.js 결과물을 `@opennextjs/cloudflare`가 Worker 번들로 바꾼다.

| 명령              | 설명                                      |
| ----------------- | ----------------------------------------- |
| `pnpm cf:build`   | `.open-next/worker.js` 번들 생성          |
| `pnpm cf:preview` | 번들을 workerd로 로컬 실행                |
| `pnpm cf:deploy`  | 로컬에서 직접 배포 (wrangler 로그인 필요) |
| `pnpm cf:upload`  | 새 버전만 업로드                          |

Cloudflare 대시보드에는 빌드 명령을 `pnpm cf:build`로 두고, `NEXT_PUBLIC_*` 세 개를 **빌드 변수**로
등록해야 한다. 런타임 변수로는 동작하지 않는다. 값이 없으면 빌드 중 환경 변수 검증이 실패한다.

> Windows에서 `pnpm cf:build`를 돌리려면 개발자 모드가 필요하다. 심볼릭 링크를 만들지 못하면
> `EPERM ... symlink`로 멈춘다. Cloudflare 빌드 환경(Linux)에는 이 제약이 없다.

전체 절차와 제약은 [배포 문서](docs/technical/deployment.md)에 있다.

## 프로젝트 구조

```text
src/
├─ app/            라우트와 화면 조립
├─ features/       제품 기능 단위 코드
│  ├─ auth/            로그인, requireUser 서버 경계, 세션 갱신
│  ├─ presentations/
│  ├─ slide-editor/
│  └─ slide-renderer/   편집·발표 화면이 공유하는 시각 렌더러
├─ components/     공통 UI와 레이아웃
├─ lib/            Supabase 클라이언트, 검증, 경로, 환경 변수
├─ styles/         디자인 토큰과 Pretendard
└─ types/          DB 타입과 도메인 타입

supabase/
├─ migrations/     스키마 변경 이력
└─ seed.sql        개발용 데모 데이터

wrangler.jsonc       Cloudflare Worker 설정
open-next.config.ts  Next.js -> Worker 변환 설정
```

직접 작성한 `.ts`, `.tsx`, `.css`는 500줄을 넘지 않는다. 자세한 분리 기준은 [개발 스택 문서 8장](docs/technical/development-stack.md)에 있다.

## 배포

Node.js 런타임과 Chromium이 함께 있는 환경이 필요하다. 절차와 환경별 주의사항은 [배포 문서](docs/technical/deployment.md)에 있다.

## 지원 브라우저

Chrome, Edge, Firefox, Safari의 최신 두 개 버전을 지원 대상으로 한다. 확인 범위와 알려진 차이는 [배포 문서의 지원 브라우저](docs/technical/deployment.md#5-지원-브라우저)를 참고한다.
