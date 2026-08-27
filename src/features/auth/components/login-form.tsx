"use client";

import { useActionState, useState } from "react";
import { Button, ErrorMessage, TextField } from "@/components/ui";
import { signInAction, signUpAction } from "../actions/auth-actions";
import { IDLE_AUTH_FORM_STATE } from "../types";

type Mode = "signIn" | "signUp";

const COPY: Record<Mode, { submit: string; switchLabel: string; switchAction: string }> = {
  signIn: {
    submit: "로그인",
    switchLabel: "아직 계정이 없나요?",
    switchAction: "회원가입",
  },
  signUp: {
    submit: "회원가입",
    switchLabel: "이미 계정이 있나요?",
    switchAction: "로그인",
  },
};

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<Mode>("signIn");
  const [signInState, submitSignIn, signInPending] = useActionState(
    signInAction,
    IDLE_AUTH_FORM_STATE,
  );
  const [signUpState, submitSignUp, signUpPending] = useActionState(
    signUpAction,
    IDLE_AUTH_FORM_STATE,
  );

  const isSignUp = mode === "signUp";
  const state = isSignUp ? signUpState : signInState;
  const pending = isSignUp ? signUpPending : signInPending;
  const copy = COPY[mode];

  return (
    <form action={isSignUp ? submitSignUp : submitSignIn} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <TextField
        label="이메일"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />

      <TextField
        label="비밀번호"
        name="password"
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        required
        description={isSignUp ? "8자 이상으로 입력하세요." : undefined}
        error={state.fieldErrors?.password}
      />

      {state.status === "error" && state.message ? <ErrorMessage message={state.message} /> : null}

      {state.status === "success" && state.message ? (
        <p role="status" className="rounded-panel bg-success-50 p-3 text-sm text-success-600">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" loading={pending}>
        {copy.submit}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        {copy.switchLabel}{" "}
        <button
          type="button"
          onClick={() => setMode(isSignUp ? "signIn" : "signUp")}
          className="rounded-control font-medium text-brand-600 underline underline-offset-2"
        >
          {copy.switchAction}
        </button>
      </p>
    </form>
  );
}
