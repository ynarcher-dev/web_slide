"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 브라우저에서 Supabase 세션을 갱신해 쿠키를 최신 상태로 유지한다.
 *
 * Server Component는 쿠키를 쓸 수 없어 서버에서 토큰을 새로 받아도 저장할 수 없다.
 * 예전에는 미들웨어가 그 자리를 맡았지만, Next.js 16의 `proxy.ts`는 Node 런타임 고정이라
 * Cloudflare Workers에 올릴 수 없어 없앴다. 대신 보호 화면에 이 컴포넌트를 두고
 * 브라우저 클라이언트가 토큰 회전을 맡는다.
 *
 * `createBrowserClient`는 세션을 쿠키에 저장하므로, 갱신 결과를 다음 요청에서 서버가 그대로 읽는다.
 * 클라이언트를 만들면 자동 갱신 타이머가 함께 돌기 시작하며, 구독을 유지해 화면이 살아 있는 동안
 * 인스턴스가 회수되지 않게 한다.
 */
export function SessionRefresher() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // 마운트 직후 한 번 확인해, 만료가 임박한 토큰을 미리 새로 받는다.
    void supabase.auth.getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // 저장은 클라이언트가 알아서 한다. 여기서는 구독을 유지하는 것이 목적이다.
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
