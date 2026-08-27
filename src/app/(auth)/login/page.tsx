import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { LoginForm } from "@/features/auth/components/login-form";
import { ROUTES, safeRedirectPath } from "@/lib/routes";

export const metadata: Metadata = {
  title: "로그인 | Web Slide",
  description: "Web Slide에 로그인해 프레젠테이션을 만들고 편집합니다.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { redirectTo } = await props.searchParams;
  const target = safeRedirectPath(
    Array.isArray(redirectTo) ? redirectTo[0] : redirectTo,
    ROUTES.presentations,
  );

  return (
    <main id="main-content" className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-panel border border-border-subtle bg-surface p-8">
        <div className="mb-6 flex flex-col gap-3">
          <Logo height={22} />
          <h1 className="text-xl font-semibold text-foreground">Web Slide 로그인</h1>
          <p className="text-sm text-foreground-muted">
            이메일과 비밀번호로 로그인하면 내 프레젠테이션을 편집할 수 있습니다.
          </p>
        </div>

        <LoginForm redirectTo={target} />
      </div>
    </main>
  );
}
