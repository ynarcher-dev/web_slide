import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
// pnpm 워크스페이스에서도 확실히 잡히도록 CLI 진입점을 직접 해석한다.
const SUPABASE_CLI = require.resolve("supabase/dist/supabase.js");
const PRETTIER_CLI = require.resolve("prettier/bin/prettier.cjs");

const OUTPUT = "src/types/database.types.ts";

const dbUrl = process.env.SUPABASE_DB_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * 타입 생성 경로는 두 가지다.
 *
 * 1. SUPABASE_ACCESS_TOKEN이 있으면 Supabase API로 생성한다. Docker가 필요 없다.
 * 2. 없으면 SUPABASE_DB_URL로 생성한다. 이 경로는 로컬에 Docker가 실행 중이어야 한다.
 */
function buildArgs() {
  if (accessToken) {
    const projectRef = projectUrl?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1];
    if (!projectRef) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL에서 프로젝트 ref를 읽지 못했습니다.");
    }
    return ["gen", "types", "typescript", "--project-id", projectRef, "--schema", "public"];
  }

  if (!dbUrl) {
    throw new Error(
      "SUPABASE_ACCESS_TOKEN 또는 SUPABASE_DB_URL이 필요합니다. .env.local을 확인하세요.",
    );
  }

  return ["gen", "types", "typescript", "--db-url", dbUrl, "--schema", "public"];
}

let types;
try {
  types = execFileSync(process.execPath, [SUPABASE_CLI, ...buildArgs()], {
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  });
} catch (error) {
  const stderr = String(error.stderr ?? "");
  if (stderr.includes("docker")) {
    console.error(
      "Docker가 없어 --db-url 경로로는 타입을 생성할 수 없습니다.\n" +
        "SUPABASE_ACCESS_TOKEN(sbp_로 시작하는 개인 액세스 토큰)을 .env.local에 넣고 다시 실행하세요.",
    );
  } else {
    console.error(error.message);
  }
  process.exit(1);
}

const header = [
  "// 이 파일은 `pnpm db:types`가 생성한다. 직접 수정하지 않는다.",
  "// 애플리케이션에서 쓰는 도메인 타입은 src/types/domain.ts에 둔다.",
  "",
].join("\n");

writeFileSync(OUTPUT, header + types, "utf-8");

// CLI 출력은 저장소 포맷 규칙과 다르다. 그대로 두면 `pnpm format:check`가 실패하므로
// 생성 직후 한 번 정리해서 재생성 결과가 항상 같은 모양이 되게 한다.
execFileSync(process.execPath, [PRETTIER_CLI, "--write", OUTPUT], { stdio: "ignore" });

console.log(`${OUTPUT} 생성 완료`);
