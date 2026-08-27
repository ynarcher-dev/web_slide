import { readFileSync } from "node:fs";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("SUPABASE_DB_URL이 없습니다. .env.local을 확인하세요.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query(readFileSync("supabase/seed.sql", "utf-8"));
  console.log("seed 적용 완료: demo@webslide.test / WebSlide!2026");
} finally {
  await client.end();
}
