import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// pnpm 워크스페이스에서도 확실히 잡히도록 CLI 진입점을 직접 해석한다.
const SUPABASE_CLI = require.resolve("supabase/dist/supabase.js");

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("SUPABASE_DB_URL이 없습니다. .env.local을 확인하세요.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [SUPABASE_CLI, "db", "push", "--db-url", dbUrl, "--yes"],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
