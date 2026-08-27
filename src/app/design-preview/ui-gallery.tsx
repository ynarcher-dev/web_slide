"use client";

import { useState } from "react";
import {
  Button,
  EmptyState,
  ErrorMessage,
  LoadingState,
  Menu,
  Modal,
  TextField,
} from "@/components/ui";
import { PreviewSection } from "./section";

export function UiGallery() {
  const [modalOpen, setModalOpen] = useState(false);
  const [lastMenuAction, setLastMenuAction] = useState<string>("없음");

  return (
    <>
      <PreviewSection title="버튼" description="variant 4종과 size 3종, 로딩 및 비활성 상태">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button>기본 동작</Button>
            <Button variant="secondary">보조 동작</Button>
            <Button variant="ghost">가벼운 동작</Button>
            <Button variant="danger">삭제</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">작게</Button>
            <Button size="md">보통</Button>
            <Button size="lg">크게</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button loading>저장 중</Button>
            <Button disabled>비활성</Button>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection title="입력창" description="라벨, 도움말, 오류와 비활성 상태">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="프레젠테이션 제목" placeholder="예: 서비스 소개" required />
          <TextField
            label="푸터 텍스트"
            description="모든 본문 슬라이드 하단에 표시됩니다."
            defaultValue="Copyright © 2026 Y&ARCHER"
          />
          <TextField
            label="웹페이지 주소"
            defaultValue="http://demo.example.com"
            error="HTTPS 주소만 사용할 수 있습니다."
          />
          <TextField label="공유 링크" defaultValue="아직 생성되지 않음" disabled />
        </div>
      </PreviewSection>

      <PreviewSection title="메뉴와 모달" description="키보드 방향키와 Esc로 조작할 수 있습니다.">
        <div className="flex flex-wrap items-center gap-3">
          <Menu
            label="슬라이드 메뉴"
            items={[
              { id: "duplicate", label: "복제", onSelect: () => setLastMenuAction("복제") },
              { id: "move", label: "위로 이동", onSelect: () => setLastMenuAction("위로 이동") },
              {
                id: "disabled",
                label: "잠긴 항목",
                disabled: true,
                onSelect: () => setLastMenuAction("잠긴 항목"),
              },
              {
                id: "delete",
                label: "삭제",
                destructive: true,
                onSelect: () => setLastMenuAction("삭제"),
              },
            ]}
          />
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            모달 열기
          </Button>
          <p className="text-sm text-foreground-muted">최근 메뉴 선택: {lastMenuAction}</p>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="슬라이드를 삭제할까요?"
          description="삭제한 슬라이드는 되돌릴 수 없습니다."
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                취소
              </Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>
                삭제
              </Button>
            </>
          }
        />
      </PreviewSection>

      <PreviewSection title="로딩, 빈 상태, 오류" description="데이터가 없거나 실패했을 때의 화면">
        <div className="grid gap-4 lg:grid-cols-3">
          <LoadingState message="슬라이드를 불러오는 중입니다." />
          <EmptyState
            title="아직 슬라이드가 없습니다."
            description="표지 또는 본문 슬라이드를 만들어 시작하세요."
            action={
              <>
                <Button size="sm">표지 만들기</Button>
                <Button size="sm" variant="secondary">
                  본문 만들기
                </Button>
              </>
            }
          />
          <ErrorMessage
            message="슬라이드를 저장하지 못했습니다. 네트워크 상태를 확인해 주세요."
            onRetry={() => undefined}
          />
        </div>
      </PreviewSection>
    </>
  );
}
