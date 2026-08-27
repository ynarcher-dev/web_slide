"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { signOutAction } from "../actions/auth-actions";

export function SignOutButton() {
  const [, submit, pending] = useActionState(async () => {
    await signOutAction();
  }, undefined);

  return (
    <form action={submit}>
      <Button type="submit" variant="secondary" size="sm" loading={pending}>
        로그아웃
      </Button>
    </form>
  );
}
