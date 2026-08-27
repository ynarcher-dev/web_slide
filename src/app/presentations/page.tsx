import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/features/auth/require-user";
import { PresentationList } from "@/features/presentations/components/presentation-list";
import { listPresentations } from "@/features/presentations/data/presentation-repository";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "내 프레젠테이션 | Web Slide",
  description: "내가 만든 Web Slide 프레젠테이션 목록",
};

export default async function PresentationsPage() {
  const user = await requireUser(ROUTES.presentations);

  const supabase = await createSupabaseServerClient();
  const presentations = await listPresentations(supabase, user.id);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <Logo height={20} />
        <h1 className="text-xl font-semibold text-foreground">내 프레젠테이션</h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-foreground-muted">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <PresentationList presentations={presentations} />
    </main>
  );
}
