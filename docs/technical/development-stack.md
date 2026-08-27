# Web Slide 개발 스택 및 코드 구성 원칙

> 문서 상태: MVP 기술 스택 결정  
> 작성일: 2026-08-26

## 1. 권장 스택

| 영역          | 선택                           | 용도                                        |
| ------------- | ------------------------------ | ------------------------------------------- |
| 언어          | TypeScript                     | 프론트엔드, 서버 로직, 데이터 타입 통합     |
| 웹 프레임워크 | Next.js App Router             | 화면 라우팅, 서버 렌더링, API 처리          |
| UI            | React                          | 편집기, 슬라이드 목록, 발표 상태 관리       |
| CSS           | Tailwind CSS                   | 레이아웃, 디자인 토큰, 반응형 UI            |
| 애니메이션    | Motion for React               | 슬라이드 전환과 편집기 인터랙션             |
| DB/Auth       | Supabase                       | PostgreSQL, 사용자 인증, RLS                |
| 파일 저장     | Supabase Storage               | 향후 실제 파일 저장이 필요한 경우 최소 사용 |
| PDF           | Playwright 기반 서버 생성      | 발표 화면 캡처 및 16:9 PDF 생성             |
| 테스트        | Vitest + React Testing Library | 단위 및 컴포넌트 테스트                     |
| E2E           | Playwright                     | 편집, 발표, PDF 핵심 흐름 검증              |
| 코드 품질     | ESLint + Prettier              | 정적 검사와 포맷 통일                       |
| 패키지 관리   | pnpm                           | 빠르고 엄격한 의존성 관리                   |

## 2. 선정 이유

### 2.1 TypeScript

프레젠테이션, 슬라이드 템플릿, 웹 콘텐츠 설정과 Supabase 스키마를 하나의 타입 체계로 관리한다. JavaScript 대신 TypeScript를 사용하여 잘못된 슬라이드 데이터가 UI나 PDF 생성 단계까지 전달되는 문제를 줄인다.

Supabase CLI로 데이터베이스 타입을 생성하고 애플리케이션에서 그대로 사용한다.

### 2.2 Next.js App Router + React

Web Slide 편집기는 선택 상태, 자동 저장, 순서 변경, 미리보기 등 클라이언트 상호작용이 많으므로 React가 적합하다. Next.js는 React 기반 UI에 다음 기능을 한 프로젝트 안에서 제공한다.

- 로그인과 사용자 세션 처리
- 프레젠테이션 목록 및 공유 페이지 라우팅
- 서버에서 안전하게 처리해야 하는 로직
- PDF 생성 요청 API
- 향후 배포 최적화

편집기와 발표 화면은 Client Component로 구현하고, 초기 데이터 조회와 권한 확인은 Server Component 또는 서버 로직에서 처리한다.

### 2.3 Tailwind CSS

Tailwind CSS를 기본 스타일 도구로 사용한다. 슬라이드의 실제 디자인 값은 임의 유틸리티에 흩어놓지 않고 CSS 변수 기반 디자인 토큰으로 관리한다.

```css
:root {
  --slide-width: 1920;
  --slide-height: 1080;
  --brand-primary: #e42317;
  --slide-background: #ffffff;
  --slide-footer-color: #333333;
}
```

다음 경우에는 CSS Module을 함께 사용할 수 있다.

- 16:9 슬라이드 스케일 계산
- iframe 1920×1080 렌더링 및 transform 처리
- PDF 출력 전용 `@media print` 규칙
- Tailwind 클래스만으로 읽기 어려운 복잡한 상태 스타일

전역 CSS에 화면별 스타일을 계속 추가하지 않는다.

### 2.4 Motion for React

사용자가 선호하는 부드러운 동작을 위해 Motion을 제한적으로 사용한다.

적용 대상:

- 슬라이드 목록 순서 변경
- 슬라이드 선택 표시
- 속성 패널 열기 및 닫기
- 모달 등장과 퇴장
- 발표 모드 슬라이드 전환

색상 변화나 단순 hover는 CSS transition으로 처리한다. 모든 요소를 Motion 컴포넌트로 만들지 않는다. 사용자의 `prefers-reduced-motion` 설정도 존중한다.

### 2.5 기본 글꼴

기본 한글 글꼴은 **Pretendard Variable을 저장소 자산으로 자체 호스팅**한다.

- 글꼴 파일: `src/styles/fonts/PretendardVariable.woff2`
- 선언: `src/styles/fonts.ts`에서 `next/font/local`로 불러오고 `--font-pretendard` 변수를 노출한다.
- 원본 관리: devDependency `pretendard`의 `dist/web/variable/woff2`에서 복사한다. 버전을 올릴 때 같은 경로에서 다시 복사한다.
- 라이선스: SIL Open Font License 1.1. 출처와 갱신 방법은 `src/styles/fonts/NOTICE.md`에 기록한다.

CDN 링크 대신 자체 호스팅을 선택한 이유는 다음과 같다.

- Playwright 서버 PDF 생성 시 외부 네트워크 상태와 무관하게 같은 글꼴로 렌더링해야 한다.
- 편집 화면, 발표 화면, PDF의 줄바꿈과 자간이 동일해야 한다.
- 외부 요청이 없으므로 초기 렌더링 지연과 FOUT 위험이 줄어든다.

## 3. Supabase 사용 범위

### 3.1 Database

Supabase PostgreSQL은 다음 데이터를 저장한다.

- 사용자 프로필
- 프레젠테이션
- 프레젠테이션 테마
- 슬라이드
- 슬라이드 순서
- 웹페이지 URL과 뷰포트 설정
- 공유 상태

초기 테이블 후보:

```text
profiles
presentations
slides
```

테마 설정은 MVP에서 `presentations`의 컬럼 또는 JSONB로 관리할 수 있다. 슬라이드는 조회, 수정, 삭제와 순서 변경이 빈번하므로 별도 `slides` 테이블로 둔다.

### 3.2 Auth

Supabase Auth를 사용한다. Next.js SSR 환경에서는 쿠키 기반 세션을 사용한다.

MVP 인증 범위:

- **이메일 + 비밀번호 로그인** (2026-08-26 확정)
- 로그아웃
- 로그인 사용자만 편집 가능
- 공개 설정된 프레젠테이션은 비로그인 사용자도 발표 화면 조회 가능

매직 링크 대신 비밀번호 방식을 택한 이유는 로그인 성공 흐름을 메일 발송에 의존하지 않고 E2E로 검증할 수 있기 때문이다. 비밀번호 재설정 화면은 MVP 범위에 넣지 않았다.

구현 위치:

- `src/lib/supabase/client.ts`: 브라우저 클라이언트
- `src/lib/supabase/server.ts`: Server Component와 Server Action용 클라이언트, `getCurrentUser`
- `src/lib/supabase/proxy-session.ts`: 요청마다 세션 쿠키 갱신
- `src/proxy.ts`: 세션 갱신과 경로 보호. Next.js 16에서 `middleware.ts`가 `proxy.ts`로 바뀌었다
- `src/features/auth/`: 로그인 화면, Server Action, 검증 스키마
- `src/lib/routes.ts`: 경로 상수와 보호 대상 경로 판정

보호 규칙은 `/presentations` 접두사 전체다. `proxy.ts`가 1차로 막고, 각 페이지에서도 `getCurrentUser`로 다시 확인한다.

### 3.3 RLS

노출되는 모든 사용자 데이터 테이블에 Row Level Security를 적용한다.

- 소유자만 프레젠테이션 생성, 수정, 삭제 가능
- 소유자만 해당 프레젠테이션의 슬라이드 생성, 수정, 삭제 가능
- 공개 상태인 프레젠테이션과 슬라이드는 읽기만 허용
- 서버 전용 비밀 키를 브라우저 코드에 포함하지 않음

### 3.4 Storage

현재 확정된 MVP에는 사용자 이미지 업로드가 없다.

- Y&ARCHER 로고는 저장소의 정적 자산으로 배포한다.
- 표지는 흰색 기반의 tint 값만 DB에 저장한다.
- PDF는 생성 즉시 다운로드하고 영구 저장하지 않는다.

따라서 초기 구현에서 Storage 버킷을 반드시 만들 필요는 없다. 이후 PDF 보관이나 사용자 파일 업로드가 추가되면 Supabase Storage를 사용하며, 별도의 외부 스토리지 서비스는 추가하지 않는다.

### 3.5 데이터베이스 작업 명령

스키마 변경은 항상 `supabase/migrations`의 SQL 파일로 남긴다. 대시보드에서 직접 수정하지 않는다.

| 명령                 | 하는 일                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `pnpm db:push`       | `supabase/migrations`의 마이그레이션을 대상 DB에 적용한다        |
| `pnpm db:types`      | `src/types/database.types.ts`를 다시 생성한다                    |
| `pnpm db:seed`       | `supabase/seed.sql`을 적용한다. 개발과 검증 환경에서만 사용한다  |
| `pnpm db:verify-rls` | 임시 사용자 두 명을 만들어 RLS 정책을 확인하고 데이터를 정리한다 |

슬라이드 순서 변경은 `public.reorder_slides(p_presentation_id, p_slide_ids)` 함수를 사용한다. 여러 행의 `sort_order`가 한꺼번에 바뀌므로 요청을 하나로 묶는다. `security invoker`라 `slides`의 RLS 정책이 그대로 적용된다.

모두 `.env.local`의 `SUPABASE_DB_URL`을 사용한다. 이 값은 애플리케이션 런타임에서 쓰지 않는다.

`pnpm db:types`는 두 경로를 지원한다.

1. `SUPABASE_ACCESS_TOKEN`이 있으면 Supabase API로 생성한다. Docker가 필요 없다.
2. 없으면 `SUPABASE_DB_URL`로 생성한다. 이 경로는 로컬에 Docker가 필요하다.

### 3.6 DB 타입과 도메인 타입의 경계

- `src/types/database.types.ts`는 DB 행(snake_case)을 그대로 나타낸다. 생성물이므로 직접 고치지 않는다.
- `src/types/domain.ts`는 화면이 사용하는 camelCase 도메인 타입이다.
- 두 타입 사이의 변환은 `src/lib/supabase/mappers.ts`에서만 한다.
- 컴포넌트, 훅, 렌더러는 DB 행 모양을 직접 다루지 않는다.

예를 들어 `presentations` 행의 `brand_color`, `cover_tint`, `footer_text`, `show_page_number`는 도메인 타입에서 `theme` 객체로 묶고, `slides` 행의 `content_url`, `reload_on_enter`, `viewport_*`는 `content` 객체로 묶는다.

## 4. PDF 생성 전략

PDF는 웹 프레젠테이션의 인터랙션을 유지할 수 없으므로 정적인 결과물로 생성한다.

권장 흐름:

1. 서버가 PDF 전용 프레젠테이션 URL을 연다.
2. Playwright가 각 슬라이드와 iframe 웹페이지의 로딩 완료를 기다린다.
3. 각 슬라이드를 16:9 정적 화면으로 캡처한다.
4. 표지와 본문 캡처를 순서대로 PDF 페이지에 배치한다.
5. 생성된 PDF를 사용자에게 바로 내려준다.
6. 서버의 임시 결과물은 요청 종료 후 보관하지 않는다.

iframe 삽입이 가능한 웹페이지만 사용한다는 제품 전제를 따른다. PDF 생성 시 웹페이지가 로딩되지 않으면 내보내기를 실패 처리하고 원인을 사용자에게 알린다.

PDF 생성은 브라우저 인쇄 기능만으로 시작할 수도 있지만, iframe과 폰트 로딩 결과를 일관되게 만들기 위해 서버 측 Playwright 방식을 우선한다.

### 4.1 구현 메모

- 실행 의존성은 `playwright-core`다. 서버가 브라우저를 직접 띄우므로 배포 환경에 Chromium이 있어야 한다. 새 환경에서는 `pnpm exec playwright install chromium`을 한 번 실행한다.
- `GET /presentations/[presentationId]/pdf/download`가 로그인과 소유자를 확인한 뒤 생성기를 호출한다.
- 생성기는 요청자의 세션 쿠키를 그대로 옮겨 담아 `/presentations/[presentationId]/pdf`를 연다. PDF 화면도 같은 소유자 확인을 다시 한다.
- 인쇄 시점은 PDF 화면이 `data-pdf-ready="true"`를 표시할 때다. 이 신호는 iframe 로딩과 `document.fonts.ready`가 끝난 뒤에 켜진다.
- 웹페이지를 제한 시간(20초) 안에 불러오지 못하면 화면이 `data-pdf-frames="timeout"`을 표시하고, 생성기는 반쯤 빈 PDF를 만드는 대신 실패로 알린다.
- 페이지 크기는 슬라이드 좌표계와 같은 1920×1080 px이며, 슬라이드 한 장이 PDF 한 페이지가 된다.
- 결과는 파일로 저장하지 않고 응답 본문으로만 보낸다. 브라우저에서도 저장 후 임시 URL을 곧바로 해제한다.
- PDF에서는 웹페이지를 조작할 수 없으므로 그 영역 전체를 원본 주소 링크로 만든다. `SlideView`의 `linkToSource`가
  이 동작을 켜며 PDF 화면에서만 사용한다. 편집과 발표에서는 같은 자리에 조작 잠금 덮개가 들어간다.

## 5. 상태 관리

MVP에서는 React의 기본 상태와 서버 데이터를 우선 사용한다.

- 편집 중인 필드: 로컬 React state
- 선택된 슬라이드: 편집기 Context 또는 상위 컴포넌트 state
- 저장된 프레젠테이션 데이터: Supabase 조회 결과
- 자동 저장: debounce 후 서버 요청

초기부터 Redux를 도입하지 않는다. 편집기 상태가 여러 컴포넌트에 걸쳐 복잡해질 때만 Zustand 도입을 검토한다.

## 6. 라우트 구조

```text
/
/login
/presentations
/presentations/new
/presentations/[presentationId]/edit
/presentations/[presentationId]/present
/presentations/[presentationId]/pdf
/presentations/[presentationId]/pdf/download
/share/[shareId]
```

역할:

- `/presentations`: 사용자의 프레젠테이션 목록
- `/edit`: 슬라이드 만들기, 목록, 수정, 삭제, 순서 변경
- `/present`: 로그인 사용자의 전체화면 발표
- `/pdf`: 서버 브라우저가 여는 PDF 전용 화면. 사람이 직접 열 일은 없다
- `/pdf/download`: PDF를 만들어 내려주는 라우트 핸들러
- `/share`: 읽기 전용 공유 발표. 공개 식별자 `presentations.share_id`로 찾는다
- `/design-preview`: 디자인 토큰과 공통 UI를 데이터 없이 확인하는 내부 화면. 개발자용이라 프로덕션 빌드에서는
  `notFound()`로 404를 돌려준다. 화면을 지우지 않는 이유는 접근성 검사를 돌릴 곳이 필요해서다

## 7. 권장 소스 구조

```text
src/
├─ app/
│  ├─ (auth)/
│  ├─ presentations/
│  └─ share/
├─ features/
│  ├─ presentations/
│  ├─ slide-renderer/
│  ├─ slide-editor/
│  ├─ slide-player/
│  └─ pdf-export/
├─ components/
│  ├─ ui/
│  └─ layout/
├─ lib/
│  ├─ supabase/
│  └─ validation/
├─ styles/
└─ types/

supabase/
├─ migrations/
└─ seed.sql
```

기능 코드는 기술 종류가 아니라 제품 기능 단위로 묶는다. 예를 들어 슬라이드 목록과 관련된 컴포넌트, 훅, 액션은 `features/slide-editor` 아래에서 함께 관리한다.

`features/slide-renderer`는 편집 미리보기, 목록 썸네일, 발표 화면, PDF가 함께 쓰는 시각 렌더러만 담는다. 이 폴더는 데이터 조회나 저장을 하지 않고, 슬라이드와 테마를 받아 그리기만 한다.

## 8. 500줄 제한 규칙

사용자가 말한 “페이지당 500줄”은 실제 개발 규칙에서 **소스 파일당 최대 500줄**로 정의한다. URL 페이지 하나는 여러 컴포넌트 파일로 나눌 수 있다.

### 8.1 필수 규칙

- 직접 작성한 `.ts`, `.tsx`, `.css` 파일은 500줄을 넘지 않는다.
- 450줄에 도달하면 분리 작업을 시작한다.
- 라우트의 `page.tsx`는 화면 조립 역할만 담당하며 권장 최대 200줄로 제한한다.
- React 컴포넌트는 권장 최대 250줄로 제한한다.
- 하나의 컴포넌트가 데이터 조회, 저장, 모달, 목록과 미리보기까지 모두 담당하지 않는다.
- 타입, 상수, 검증 스키마, 데이터 접근 로직을 UI 파일에서 분리한다.
- 자동 생성 파일과 Supabase DB 타입 파일은 500줄 검사에서 제외한다.

### 8.2 파일이 커질 때 분리 기준

“새 페이지”를 무조건 만드는 대신 역할에 맞는 새 파일로 나눈다.

| 커지는 내용    | 분리 위치 예시                          |
| -------------- | --------------------------------------- |
| 독립 UI 영역   | `components/slide-list.tsx`             |
| 편집 폼        | `components/slide-properties-panel.tsx` |
| 상태 로직      | `hooks/use-slide-editor.ts`             |
| Supabase CRUD  | `data/slide-repository.ts`              |
| 서버 변경 로직 | `actions/update-slide.ts`               |
| 타입           | `types.ts`                              |
| 상수 및 기본값 | `constants.ts`                          |
| 검증           | `schema.ts`                             |

새 URL이 필요한 별도 사용자 화면일 때만 Next.js의 새 `page.tsx`를 만든다.

### 8.3 자동 검사

CI와 로컬 검사 명령에 파일 길이 검사를 추가한다. 500줄 초과 시 빌드 또는 PR 검사를 실패하게 하되, 다음 파일은 예외로 둔다.

- 자동 생성된 Supabase 타입
- lock 파일
- 마이그레이션 SQL
- 외부에서 생성된 코드

## 9. 핵심 구현 경계

### 공통 렌더러

- `SlideStage`: 1920×1080 좌표계를 실제 크기에 맞춰 축소하는 16:9 컨테이너
- `SlideRenderer`: 템플릿에 따라 표지 또는 본문 렌더러를 고르는 단일 진입점
- `SlideView`: `SlideStage`와 `SlideRenderer`를 묶은 기본 표시 단위
- `WebFrame`: 기준 뷰포트로 그린 뒤 축소하는 iframe 영역. iframe은 하이드레이션이 끝난 뒤에 만든다.
  서버 HTML에 들어 있으면 하이드레이션 전에 로딩이 끝나 `load` 이벤트를 놓치고, 다 불러온 웹페이지 위에
  로딩 문구가 남는다. 편집, 발표, PDF가 모두 `useMounted`로 같은 규칙을 따른다

### 편집기

- `SlideEditorShell`: 전체 3단 레이아웃 조립
- `SlideEditorWorkspace`: 상태 훅과 세 패널을 연결하는 조립 지점
- `SlideList`: 목록 조회, 선택, 순서 변경 UI
- `SlidePreview`: 16:9 슬라이드 렌더링과 웹페이지 조작 잠금 전환
- `SlidePropertiesPanel`: 표지 또는 본문 입력 필드
- `useSlideEditor`: 슬라이드 목록, 선택, 순서 변경 상태
- `useAutoSave`: 변경 감지와 자동 저장

### 발표 화면

- `SlidePlayer`: 현재 슬라이드, 이동 상태와 전환 효과
- `PresentationControls`: 이전, 다음, 전체화면, 웹페이지 조작 모드
- `usePlayerNavigation`, `usePlayerKeyboard`, `useFullscreen`, `useAutoHide`: 이동, 키보드, 전체화면, 컨트롤 자동 숨김

발표 화면은 슬라이드를 모두 DOM에 두고 현재 것만 보여 준다. 이동할 때마다 iframe을 다시 만들면 시연 중이던 웹페이지 상태가 사라지기 때문이다. 웹페이지는 현재 슬라이드 기준 앞뒤 한 장까지만 실제로 띄운다.

표지와 본문의 시각 렌더러는 편집 미리보기, 발표 모드, PDF 화면에서 동일한 컴포넌트를 재사용한다. 화면마다 템플릿을 별도로 구현하지 않는다.

## 10. MVP에서 도입하지 않는 기술

- 별도 Express 또는 NestJS 백엔드
- Redux
- GraphQL
- 마이크로서비스
- WebSocket 기반 실시간 공동 편집
- 별도 AWS S3
- 캔버스 편집 엔진
- CSS-in-JS 런타임 라이브러리

## 11. 추후 확정 항목

- Next.js 및 주요 패키지의 정확한 버전 고정
- 이메일 로그인과 매직 링크 중 인증 UX 선택
- PDF 생성 환경과 배포 대상
- 자동 저장 충돌 처리 정책
- 공개 공유 링크의 만료와 비밀번호 지원 여부
- 데이터 삭제 및 복구 정책
