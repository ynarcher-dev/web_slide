import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const MAX_LINES = 500;
const TARGET_EXTENSIONS = [".ts", ".tsx", ".css"];
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "coverage",
  "playwright-report",
  "test-results",
]);
const EXCLUDED_PATTERNS = [
  /(^|\/)supabase\/migrations\//,
  /database\.types\.ts$/,
  /next-env\.d\.ts$/,
  /\.d\.ts$/,
];

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      files.push(...collectFiles(join(dir, entry.name)));
      continue;
    }
    const fullPath = join(dir, entry.name);
    const relPath = relative(ROOT, fullPath).replace(/\\/g, "/");
    if (!TARGET_EXTENSIONS.some((ext) => relPath.endsWith(ext))) continue;
    if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(relPath))) continue;
    files.push(relPath);
  }
  return files;
}

const violations = [];

for (const file of collectFiles(ROOT)) {
  const lineCount = readFileSync(join(ROOT, file), "utf-8").split("\n").length;
  if (lineCount > MAX_LINES) {
    violations.push({ file, lineCount });
  }
}

if (violations.length > 0) {
  console.error(`다음 파일이 ${MAX_LINES}줄 제한을 초과했습니다:\n`);
  for (const { file, lineCount } of violations) {
    console.error(`  ${file} (${lineCount}줄)`);
  }
  process.exit(1);
}

console.log(`파일 길이 검사 통과 (최대 ${MAX_LINES}줄, 대상 ${collectFiles(ROOT).length}개 파일)`);
