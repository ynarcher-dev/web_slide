import type { Enums } from "./database.types";

/**
 * 애플리케이션이 사용하는 도메인 타입.
 *
 * 경계 규칙:
 * - `database.types.ts`(snake_case DB 행)는 `src/lib/supabase` 안에서만 다룬다.
 * - 컴포넌트, 훅, 렌더러는 이 파일의 camelCase 도메인 타입만 사용한다.
 * - 변환은 `src/lib/supabase/mappers.ts`에서만 수행한다.
 */

export type SlideTemplate = Enums<"slide_template">;

export type UserProfile = {
  id: string;
  displayName: string;
};

/** 프레젠테이션 단위로 상속되는 공통 스타일 설정. */
export type PresentationTheme = {
  brandColor: string;
  /** 표지 배경 tint 세기. 0은 흰색, 100은 최대 적용. */
  coverTint: number;
  footerText: string;
  showPageNumber: boolean;
};

/** 프레젠테이션 단위로 저장하는 공통 설정. 테마 값과 공개 여부를 함께 다룬다. */
export type PresentationSettings = PresentationTheme & {
  isPublic: boolean;
};

export type Presentation = {
  id: string;
  ownerId: string;
  title: string;
  theme: PresentationTheme;
  isPublic: boolean;
  shareId: string;
  createdAt: string;
  updatedAt: string;
};

/** 본문 슬라이드에 삽입하는 웹페이지 콘텐츠. 이미지 슬라이드에서는 항상 null이다. */
export type WebPageContent = {
  type: "website";
  url: string;
  reloadOnEnter: boolean;
  viewport: {
    width: number;
    height: number;
  };
};

/**
 * 이미지 슬라이드에 넣는 그림.
 *
 * `path`는 Storage 객체 경로이고 `url`은 그 경로로 만든 공개 주소다.
 * 저장하는 값은 경로 하나뿐이며 주소는 매퍼가 만들어 준다.
 */
export type SlideImage = {
  path: string;
  url: string;
};

/**
 * HTML 슬라이드에 넣는 원본 HTML.
 *
 * 샌드박스 iframe의 srcdoc으로 들어간다. 우리 화면과 같은 출처가 아니므로
 * 안에서 스크립트가 돌아도 편집 화면의 쿠키나 DOM에는 닿지 못한다.
 */
export type SlideHtml = {
  source: string;
};

export type Slide = {
  id: string;
  presentationId: string;
  template: SlideTemplate;
  /** 0부터 시작하는 표시 순서. 페이지 번호는 이 값으로 계산한다. */
  sortOrder: number;
  title: string;
  subtitle: string;
  /** 표지 발표자 이름. 본문 슬라이드에서는 빈 문자열이다. */
  author: string;
  /** 본문 상단의 작은 섹션명. 표지에서는 빈 문자열이다. */
  pageName: string;
  /** URL이 아직 없으면 null이다. 본문(웹페이지) 슬라이드에서만 값이 있다. */
  content: WebPageContent | null;
  /** 이미지를 아직 올리지 않았으면 null이다. 이미지 슬라이드에서만 값이 있다. */
  image: SlideImage | null;
  /** HTML을 아직 넣지 않았으면 null이다. HTML 슬라이드에서만 값이 있다. */
  html: SlideHtml | null;
};

export type PresentationWithSlides = Presentation & {
  slides: Slide[];
};

/** 슬라이드 편집 폼이 한 번에 저장하는 값. 자동 저장은 항상 이 모양을 통째로 보낸다. */
export type SlideFields = {
  title: string;
  subtitle: string;
  author: string;
  pageName: string;
  /** 빈 문자열이면 "URL 없음"으로 저장한다. */
  contentUrl: string;
  reloadOnEnter: boolean;
  /** 빈 문자열이면 "이미지 없음"으로 저장한다. Storage 객체 경로다. */
  imagePath: string;
  /** 빈 문자열이면 "HTML 없음"으로 저장한다. */
  htmlSource: string;
};
