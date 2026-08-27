# Web Slide 배포 문서

> 문서 상태: MVP 출시 준비
> 마지막 업데이트: 2026-08-27

이 문서는 새 환경에 Web Slide를 올리는 절차와 환경별 제약을 정리한다.
설치와 로컬 실행은 [README](../../README.md)를 본다.

## 1. 배포 대상

**Cloudflare Workers**에 배포한다. Next.js 결과물을 [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)가
Worker 번들로 바꾼 뒤 wrangler가 업로드한다.

| 항목          | 값                                                 |
| ------------- | -------------------------------------------------- |
| Worker 이름   | `web-slide` (`wrangler.jsonc`의 `name`)            |
| 진입점        | `.open-next/worker.js`                             |
| 정적 자산     | `.open-next/assets` (`ASSETS` 바인딩)              |
| 호환성 플래그 | `nodejs_compat`, `global_fetch_strictly_public`    |
| 번들 크기     | 약 10.7MB / gzip 2.1MB. Workers 한도 안에 들어간다 |

관련 파일은 [`wrangler.jsonc`](../../wrangler.jsonc)와 [`open-next.config.ts`](../../open-next.config.ts)다.

### 서버 브라우저도 캐시 바인딩도 필요하지 않다

애플리케이션 런타임은 Supabase로 나가는 HTTPS 요청 외에 외부 실행 파일을 쓰지 않는다.
Chromium은 E2E 테스트에서만 필요하며 배포 환경에는 설치하지 않는다.
슬라이드에 넣은 웹페이지는 **사용자 브라우저의 iframe에서** 뜨므로 서버가 대신 열지 않는다.

R2나 KV 증분 캐시 바인딩도 두지 않는다. 데이터가 있는 화면은 모두 요청마다 렌더링되는
동적 라우트라 ISR 캐시를 쓰지 않기 때문이다. 캐시를 도입하려면 `open-next.config.ts`의
`incrementalCache`와 `wrangler.jsonc`의 바인딩을 함께 추가한다.

### 미들웨어를 두지 않는 이유

Next.js 16의 `proxy.ts`(구 `middleware.ts`)는 Node 런타임 고정이고, `@opennextjs/cloudflare`는
Node 미들웨어를 빌드 단계에서 거부한다. 그래서 인증 차단은 각 페이지의 `requireUser`가,
세션 쿠키 갱신은 보호 레이아웃의 `SessionRefresher`가 맡는다.
자세한 내용은 [개발 스택 문서 3.2](development-stack.md)에 있다.

## 2. 환경 변수

값의 의미와 전체 목록은 [README의 환경 변수](../../README.md#환경-변수)에 있다. 배포 시 주의점만 적는다.

- `NEXT_PUBLIC_*` 세 개는 **빌드 시점에 번들에 박힌다.** 값을 바꾸면 다시 빌드해야 한다.
- `NEXT_PUBLIC_SITE_URL`은 실제 접속 도메인이어야 한다. 공유 링크 주소의 기준이다.
- `SUPABASE_DB_URL`과 `SUPABASE_ACCESS_TOKEN`은 로컬 스크립트 전용이다. **배포 환경에 넣지 않는다.**
- `service_role` 키는 어디에도 넣지 않는다. 애플리케이션은 publishable 키와 RLS만으로 동작한다.

### Cloudflare에 넣는 위치

`NEXT_PUBLIC_*`는 빌드 시점에 번들에 박히므로 **런타임 변수가 아니라 빌드 변수로 넣어야 한다.**

Workers 대시보드 → 해당 Worker → 설정 → 빌드 → **빌드 변수**에 세 개를 등록한다.

| 변수                                   | 예시                                    |
| -------------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | `https://web-slide.example.workers.dev` |
| `NEXT_PUBLIC_SUPABASE_URL`             | `https://<project-ref>.supabase.co`     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...`                    |

값이 비어 있으면 [`src/lib/env.ts`](../../src/lib/env.ts)의 zod 검증이 빌드 도중 실패한다.
`SUPABASE_DB_URL`과 `SUPABASE_ACCESS_TOKEN`은 로컬 스크립트 전용이므로 **넣지 않는다.**

## 3. DB 마이그레이션 적용 절차

스키마 변경은 항상 `supabase/migrations`의 SQL 파일로 남기고, 대시보드에서 직접 고치지 않는다.

```bash
# 1. 대상 DB를 가리키는지 확인한다
grep SUPABASE_DB_URL .env.local

# 2. 적용한다
pnpm db:push

# 3. 권한 경계를 확인한다
pnpm db:verify-rls
```

마이그레이션은 스키마뿐 아니라 **Storage 버킷과 정책도 만든다.**

- `slide-images` 버킷: 이미지 슬라이드에 올린 파일이 들어간다. 공개 버킷이며 10MB, PNG/JPG/WEBP/GIF만 받는다.
- 공개 버킷을 쓰는 이유는 공유 링크를 여는 비로그인 사용자가 로그인 없이 이미지를
  읽어야 하기 때문이다. 파일명은 무작위라 주소를 추측할 수 없지만, **주소를 아는 사람은 누구나 볼 수 있다.**
  비공개 자료의 이미지까지 가려야 한다면 비공개 버킷과 서명 URL로 바꿔야 한다.
- 쓰기(업로드, 수정, 삭제)와 객체 목록 조회는 `storage.objects` RLS가 프레젠테이션 소유자로 제한한다.
  `pnpm db:verify-rls`가 이 경계까지 확인한다.

절차상 확인 사항:

- `pnpm db:push`는 이미 적용된 마이그레이션을 건너뛴다. 같은 명령을 다시 실행해도 안전하다.
- `pnpm db:seed`는 데모 계정과 데모 자료를 만든다. **운영 DB에는 실행하지 않는다.**
- `pnpm db:verify-rls`는 임시 사용자 두 명을 만들어 검사하고 끝나면 지운다. 운영 DB에서도 실행할 수 있지만
  인증 사용자 두 명이 잠깐 생기므로 가능하면 검증 환경에서 돌린다.
- 마이그레이션은 애플리케이션 배포보다 **먼저** 적용한다. 새 코드가 없는 컬럼을 읽으면 즉시 실패한다.

## 4. 배포 절차

### 4.1 Cloudflare 대시보드 설정 (최초 1회)

Workers → 해당 Worker → 설정 → 빌드에서 다음과 같이 맞춘다.

| 항목          | 값                             |
| ------------- | ------------------------------ |
| 빌드 명령     | `pnpm cf:build`                |
| 배포 명령     | `npx wrangler versions upload` |
| 루트 디렉터리 | `/`                            |
| 빌드 변수     | 2장의 `NEXT_PUBLIC_*` 세 개    |

`npx wrangler versions upload`는 새 **버전만** 올린다. 트래픽을 그 버전으로 넘기려면
대시보드에서 배포하거나 배포 명령을 `npx wrangler deploy`로 바꾼다.

### 4.2 배포 전 로컬 절차

```bash
# 1. 의존성
pnpm install --frozen-lockfile

# 2. 검증
pnpm validate

# 3. DB 스키마 (애플리케이션 배포보다 먼저)
pnpm db:push

# 4. Worker 번들 확인
pnpm cf:build
```

DB 마이그레이션을 적용한 뒤 커밋을 푸시하면 Cloudflare가 4.1의 설정으로 빌드한다.

### 4.3 로컬에서 Worker 실행

```bash
pnpm cf:preview   # 번들을 만들고 workerd로 띄운다
pnpm cf:deploy    # 로컬에서 직접 배포한다 (wrangler 로그인 필요)
```

> **Windows 주의:** `pnpm cf:build`는 `node_modules`의 심볼릭 링크를 다시 만든다.
> Windows에서는 개발자 모드를 켜거나 관리자 권한으로 실행해야 하며, 그렇지 않으면
> `EPERM: operation not permitted, symlink`로 멈춘다. Cloudflare 빌드 환경은 Linux라
> 이 제약이 없다. 로컬에서 Linux 기준으로 확인하려면 Docker의 `node:24-bookworm`에서 돌린다.

### 배포 후 점검

- `/login`에서 로그인된다.
- `/presentations`에서 목록이 열린다.
- 편집 화면에서 슬라이드를 만들고 저장 상태가 `저장됨`으로 바뀐다.
- 본문 슬라이드의 웹페이지가 프레임 안에서 뜬다.
- 발표 화면에서 슬라이드가 넘어간다.
- 공개로 바꾼 자료의 공유 링크가 로그인하지 않은 브라우저에서 열린다.
- 로그인하지 않고 `/presentations`를 열면 `/login?redirectTo=%2Fpresentations`로 이동한다.
- `/design-preview`가 404다. 내부 확인용 화면이라 프로덕션 빌드에서는 열리지 않는다.

## 5. 지원 브라우저

| 브라우저 | 엔진     | 지원 | 확인 방법                                   |
| -------- | -------- | ---- | ------------------------------------------- |
| Chrome   | Chromium | 지원 | E2E 전체를 chromium으로 실행                |
| Edge     | Chromium | 지원 | E2E 지원 범위 스모크를 `msedge` 채널로 실행 |
| Firefox  | Gecko    | 지원 | E2E 지원 범위 스모크를 firefox로 실행       |
| Safari   | WebKit   | 지원 | E2E 지원 범위 스모크를 webkit으로 실행      |

기준은 각 브라우저의 최신 두 개 버전이다. 데스크톱 발표를 전제로 하며 모바일 브라우저는 지원 대상이 아니다.
좁은 화면에서 편집기가 깨지지 않게만 처리한다.

확인 명령:

```bash
pnpm e2e                      # chromium 전체
pnpm e2e:browsers             # firefox, webkit, msedge 지원 범위 스모크
```

`pnpm e2e:browsers`는 `e2e/cross-browser.spec.ts` 하나만 세 브라우저에서 실행한다. 로그인, 목록, 슬라이드
만들기, 자동 저장, 발표 이동까지 핵심 경로를 확인한다. firefox와 webkit 실행 파일이 없으면 먼저 설치한다.

```bash
pnpm exec playwright install firefox webkit
```

Edge는 시스템에 설치된 Microsoft Edge를 채널로 사용하므로 별도 설치가 필요 없다. Edge가 없는 환경에서는
`msedge` 프로젝트만 실패하며, 같은 Chromium 엔진이므로 chromium 결과로 갈음할 수 있다.

### 엔진별로 다른 점

- 전체화면은 `Element.requestFullscreen`을 쓴다. Safari는 사용자 제스처가 없으면 거절하므로 발표 컨트롤의
  버튼에서만 호출한다.
- iframe 삽입 가능 여부는 대상 웹페이지의 `X-Frame-Options`와 CSP가 정한다. 브라우저 종류와 무관하다.

## 6. 오류 모니터링

**MVP에는 외부 오류 모니터링 서비스를 도입하지 않는다.**

이유:

- 사용자 수가 적고 배포 대상이 한 곳이라 서버 로그와 Supabase 로그로 원인을 추적할 수 있다.
- Sentry 같은 서비스를 넣으면 슬라이드 제목과 웹페이지 주소가 외부로 나간다. 고객사 자료가 들어갈 수 있어
  MVP 단계에서 굳이 늘릴 이유가 없다.
- 새 의존성 없이도 실패는 사용자에게 보인다. 저장 실패, 이미지 업로드 실패, 목록 조회 실패는 각각 화면에서
  원인과 재시도를 제공한다.

대신 다음을 사용한다.

- 애플리케이션 서버의 표준 출력 로그
- Supabase 대시보드의 Auth와 Postgres 로그

도입을 다시 검토할 시점은 다음 중 하나다. 사용자가 늘어 재현되지 않는 오류 신고가 들어올 때, 또는 저장과
업로드 실패율을 추적해야 할 때.

## 7. 알려진 운영상 제약

- 세션 쿠키 갱신은 브라우저의 `SessionRefresher`가 맡는다. 자바스크립트를 끈 브라우저에서는
  액세스 토큰이 만료된 뒤 다시 로그인해야 한다. 미들웨어를 쓸 수 없는 배포 대상을 택한 대가다.
- 공유 링크는 회수할 수 없다. 링크를 막으려면 공개 설정을 끈다.
- 슬라이드에 넣은 웹페이지가 iframe 삽입을 막으면 편집과 발표 화면 모두에서 뜨지 않는다. 제품 전제상
  삽입이 허용된 주소만 사용한다.
- 이미지 파일은 슬라이드나 프레젠테이션을 지울 때 함께 지운다. 다만 정리에 실패해도 삭제 자체는 진행하므로
  드물게 쓰이지 않는 파일이 남을 수 있다. 버킷 용량은 주기적으로 확인한다.
- HTML 슬라이드의 내용은 격리된 iframe(`sandbox="allow-scripts"`, 같은 출처 아님)에서 실행한다.
  서비스 세션에는 접근할 수 없지만, 붙여 넣은 코드가 바깥으로 네트워크 요청을 보낼 수는 있다.
