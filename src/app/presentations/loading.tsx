import { LoadingState } from "@/components/ui";

export default function PresentationsLoading() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-6">
      <LoadingState message="프레젠테이션 목록을 불러오는 중입니다." />
    </main>
  );
}
