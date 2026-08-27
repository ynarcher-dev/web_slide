import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Server Component, Server Action, Route Handler에서 사용하는 Supabase 클라이언트.
 * 세션은 쿠키에 저장되며, 갱신은 보호 레이아웃의 `SessionRefresher`가 브라우저에서 처리한다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component에서는 쿠키를 쓸 수 없다.
            // 세션 갱신은 브라우저의 `SessionRefresher`가 담당하므로 여기서는 무시해도 안전하다.
          }
        },
      },
    },
  );
}

/**
 * 현재 로그인한 사용자를 반환한다. 로그인하지 않았으면 null이다.
 * 쿠키의 값을 믿지 않고 Supabase 인증 서버에 확인하는 `getUser`를 사용한다.
 */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
