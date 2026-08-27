import { z } from "zod";

/**
 * 브라우저에도 전달되는 공개 환경 변수만 다룬다.
 * 비밀 값은 이 파일에 추가하지 않는다. 서버 전용 값이 필요하면 별도 모듈로 분리한다.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `환경 변수가 올바르지 않습니다.\n${detail}\n.env.example을 참고해 값을 채우세요.`,
    );
  }

  return result.data;
}

// Next.js가 값을 정적으로 치환할 수 있도록 각 변수를 직접 참조한다.
export const env = parseEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
