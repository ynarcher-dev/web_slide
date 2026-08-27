/**
 * 대시보드에 끌어다 놓을 `dist/`를 만든다.
 *
 * 평소 배포에서는 wrangler가 배포 시점에 번들링을 대신 해 준다.
 * `.open-next/worker.js`는 4KB짜리 진입점일 뿐이고 실제 코드는 별도 트리에 흩어져 있어서,
 * 그대로 올리면 서버 코드가 실행되지 않는다. 그래서 `--dry-run --outdir`로 번들링 결과만
 * 미리 뽑아 `_worker.js`로 놓고, 정적 자산을 그 옆에 붙인다.
 *
 * 이 경로는 Cloudflare가 공식적으로 안내하는 방법이 아니다. 업로드 후 호환성 플래그에
 * `nodejs_compat`을 넣어야 하며, 그래도 안 되면 `pnpm cf:deploy`를 쓴다.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OPEN_NEXT = join(ROOT, ".open-next");
const DIST = join(ROOT, "dist");
const STAGING = join(ROOT, ".cf-dist-staging");

if (!existsSync(join(OPEN_NEXT, "worker.js"))) {
  console.error("`.open-next/worker.js`가 없다. 먼저 `pnpm cf:build`를 실행한다.");
  process.exit(1);
}

// wrangler가 실제 업로드할 형태로 번들링한 결과만 뽑는다. 배포는 하지 않는다.
console.log("wrangler로 번들링 중...");
// wrangler를 node로 직접 부른다. Windows의 .cmd 래퍼는 Node 20부터 shell 없이 실행할 수 없고,
// shell을 쓰면 인자가 이스케이프되지 않아 경고가 난다.
// 패키지의 exports가 bin 경로를 막고 있어 resolve 대신 설치 경로를 그대로 쓴다.
const wranglerBin = join(ROOT, "node_modules", "wrangler", "bin", "wrangler.js");
if (!existsSync(wranglerBin)) {
  console.error("wrangler를 찾지 못했다. `pnpm install`을 먼저 실행한다.");
  process.exit(1);
}
execFileSync(process.execPath, [wranglerBin, "deploy", "--dry-run", "--outdir", STAGING], {
  stdio: "inherit",
});

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// 정적 자산을 먼저 깔고 번들을 `_worker.js`로 얹는다.
cpSync(join(OPEN_NEXT, "assets"), DIST, { recursive: true });
renameSync(join(STAGING, "worker.js"), join(DIST, "_worker.js"));

// 소스맵은 올리지 않는다. 공개 주소로 서빙되며 서버 코드가 그대로 드러난다.
rmSync(STAGING, { recursive: true, force: true });

console.log("");
console.log("dist/ 준비 완료. Workers 생성 -> 업로드 및 배포에 폴더째 끌어다 놓는다.");
console.log("업로드 후 호환성 플래그에 nodejs_compat을 반드시 넣는다.");
