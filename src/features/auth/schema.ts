import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("올바른 이메일 주소를 입력하세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type CredentialField = keyof Credentials;
