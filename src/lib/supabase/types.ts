import type { createSupabaseServerClient } from "./server";

/**
 * 서버에서 만든 Supabase 클라이언트 타입.
 *
 * 데이터 접근 함수는 이 타입을 인자로 받아 호출자가 클라이언트를 주입하게 한다.
 * 타입만 가져오므로 `next/headers`에 의존하는 런타임 코드가 함께 딸려오지 않는다.
 */
export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
