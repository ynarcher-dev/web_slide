import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { loginUrlFor } from "@/lib/routes";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * 보호 화면에서 로그인 사용자를 얻는다. 로그인하지 않았으면 로그인 화면으로 보낸다.
 *
 * 미들웨어를 두지 않으므로 이 확인이 유일한 서버 경계다. 화면마다 반드시 호출해야 하며,
 * 데이터 조회는 그 뒤에 사용자 id로 소유권을 함께 확인한다. DB 쪽 RLS가 한 겹 더 막는다.
 *
 * `returnTo`를 주면 로그인 후 그 화면으로 되돌아온다.
 */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrlFor(returnTo));
  return user;
}
