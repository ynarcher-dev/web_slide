import { SessionRefresher } from "@/features/auth/components/session-refresher";

/**
 * 로그인이 필요한 화면들의 공통 레이아웃.
 *
 * 접근 차단은 각 페이지의 `requireUser`가 담당한다. 레이아웃은 리렌더 시점이
 * 화면 이동과 항상 맞지는 않으므로 보안 경계로 쓰지 않는다.
 * 여기서는 세션 쿠키를 갱신할 자리만 마련한다.
 */
export default function PresentationsLayout({ children }: LayoutProps<"/presentations">) {
  return (
    <>
      <SessionRefresher />
      {children}
    </>
  );
}
