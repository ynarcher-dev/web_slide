import "@testing-library/jest-dom/vitest";

// 테스트에서는 실제 Supabase 프로젝트에 접속하지 않지만,
// 환경 변수 검증을 통과해야 클라이언트 모듈을 import 할 수 있다.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "sb_publishable_test";
