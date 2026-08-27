/**
 * RLS 정책 검증 스크립트.
 *
 * 임시 사용자 두 명을 만들고, 각각의 JWT 클레임으로 역할을 바꿔가며
 * 소유자 CRUD 정책과 공개 프레젠테이션 읽기 정책이 의도대로 동작하는지 확인한다.
 * 검증이 끝나면 임시 데이터를 모두 지운다.
 *
 * 실행: pnpm db:verify-rls
 */
import { randomUUID } from "node:crypto";
import pg from "pg";

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("SUPABASE_DB_URL이 없습니다. .env.local을 확인하세요.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

const results = [];

function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

/** 지정한 사용자(또는 비로그인 anon)로 가장해 쿼리를 실행한다. */
async function asRole(userId, run) {
  await client.query("begin");
  try {
    if (userId) {
      await client.query("select set_config('role', 'authenticated', true)");
      await client.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ sub: userId, role: "authenticated" }),
      ]);
    } else {
      await client.query("select set_config('role', 'anon', true)");
      await client.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify({ role: "anon" }),
      ]);
    }
    return await run();
  } finally {
    await client.query("rollback");
  }
}

async function expectDenied(name, userId, run) {
  try {
    await asRole(userId, run);
    check(name, false, "차단되어야 하는데 성공했다");
  } catch (error) {
    const denied = error.code === "42501" || /row-level security/i.test(error.message);
    check(name, denied, denied ? "정책이 차단함" : `예상 밖 오류: ${error.message}`);
  }
}

async function createUser(email) {
  const id = randomUUID();
  await client.query(
    `insert into auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
       confirmation_token, recovery_token, email_change, email_change_token_new,
       email_change_token_current, phone_change, phone_change_token, reauthentication_token
     ) values (
       '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
       extensions.crypt('RlsCheck!2026', extensions.gen_salt('bf')), now(), now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
       '', '', '', '', '', '', '', ''
     )`,
    [id, email],
  );
  return id;
}

await client.connect();

const suffix = randomUUID().slice(0, 8);
const ownerEmail = `rls-owner-${suffix}@webslide.test`;
const otherEmail = `rls-other-${suffix}@webslide.test`;
let ownerId;
let otherId;

try {
  ownerId = await createUser(ownerEmail);
  otherId = await createUser(otherEmail);

  // 트리거가 프로필을 자동으로 만들었는지 확인한다.
  const profiles = await client.query("select id from public.profiles where id = any($1::uuid[])", [
    [ownerId, otherId],
  ]);
  check("가입 시 프로필이 자동으로 생성된다", profiles.rowCount === 2, `${profiles.rowCount}/2`);

  // 소유자가 자기 프레젠테이션을 만들 수 있어야 한다. 검증용 데이터는 관리 연결로 남긴다.
  const presentationId = randomUUID();
  const slideId = randomUUID();
  await client.query(
    "insert into public.presentations (id, owner_id, title) values ($1, $2, 'RLS 검증용')",
    [presentationId, ownerId],
  );
  await client.query(
    "insert into public.slides (id, presentation_id, template, sort_order, title) values ($1, $2, 'cover', 0, '표지')",
    [slideId, presentationId],
  );

  // --- 소유자 ---
  const ownerSelect = await asRole(ownerId, () =>
    client.query("select id from public.presentations where id = $1", [presentationId]),
  );
  check("소유자는 자기 프레젠테이션을 조회한다", ownerSelect.rowCount === 1);

  const ownerInsert = await asRole(ownerId, () =>
    client.query(
      "insert into public.presentations (owner_id, title) values ($1, '새 자료') returning id",
      [ownerId],
    ),
  );
  check("소유자는 프레젠테이션을 생성한다", ownerInsert.rowCount === 1);

  const ownerUpdate = await asRole(ownerId, () =>
    client.query("update public.presentations set title = '수정됨' where id = $1", [
      presentationId,
    ]),
  );
  check("소유자는 프레젠테이션을 수정한다", ownerUpdate.rowCount === 1);

  const ownerSlide = await asRole(ownerId, () =>
    client.query("select id from public.slides where presentation_id = $1", [presentationId]),
  );
  check("소유자는 자기 슬라이드를 조회한다", ownerSlide.rowCount === 1);

  const ownerProfile = await asRole(ownerId, () => client.query("select id from public.profiles"));
  check(
    "소유자에게는 본인 프로필만 보인다",
    ownerProfile.rowCount === 1 && ownerProfile.rows[0].id === ownerId,
    `${ownerProfile.rowCount}행`,
  );

  // --- 다른 사용자 ---
  const otherSelect = await asRole(otherId, () =>
    client.query("select id from public.presentations where id = $1", [presentationId]),
  );
  check("다른 사용자에게 비공개 프레젠테이션이 보이지 않는다", otherSelect.rowCount === 0);

  const otherUpdate = await asRole(otherId, () =>
    client.query("update public.presentations set title = '탈취' where id = $1", [presentationId]),
  );
  check("다른 사용자는 남의 프레젠테이션을 수정하지 못한다", otherUpdate.rowCount === 0);

  const otherDelete = await asRole(otherId, () =>
    client.query("delete from public.presentations where id = $1", [presentationId]),
  );
  check("다른 사용자는 남의 프레젠테이션을 삭제하지 못한다", otherDelete.rowCount === 0);

  const otherSlides = await asRole(otherId, () =>
    client.query("select id from public.slides where presentation_id = $1", [presentationId]),
  );
  check("다른 사용자에게 남의 슬라이드가 보이지 않는다", otherSlides.rowCount === 0);

  await expectDenied("다른 사용자는 남의 프레젠테이션에 슬라이드를 넣지 못한다", otherId, () =>
    client.query(
      "insert into public.slides (presentation_id, template, sort_order) values ($1, 'content', 9)",
      [presentationId],
    ),
  );

  await expectDenied("다른 사용자는 남의 이름으로 프레젠테이션을 만들지 못한다", otherId, () =>
    client.query("insert into public.presentations (owner_id, title) values ($1, '위조')", [
      ownerId,
    ]),
  );

  // --- 비로그인 사용자와 공개 설정 ---
  const anonPrivate = await asRole(null, () =>
    client.query("select id from public.presentations where id = $1", [presentationId]),
  );
  check("비로그인 사용자에게 비공개 자료가 보이지 않는다", anonPrivate.rowCount === 0);

  await client.query("update public.presentations set is_public = true where id = $1", [
    presentationId,
  ]);

  const anonPublic = await asRole(null, () =>
    client.query("select id from public.presentations where id = $1", [presentationId]),
  );
  check("공개로 바꾸면 비로그인 사용자도 조회한다", anonPublic.rowCount === 1);

  const anonPublicSlides = await asRole(null, () =>
    client.query("select id from public.slides where presentation_id = $1", [presentationId]),
  );
  check("공개 자료의 슬라이드도 비로그인 사용자가 조회한다", anonPublicSlides.rowCount === 1);

  const anonUpdate = await asRole(null, () =>
    client.query("update public.presentations set title = '변조' where id = $1", [presentationId]),
  );
  check("공개 자료라도 비로그인 사용자는 수정하지 못한다", anonUpdate.rowCount === 0);

  await expectDenied("비로그인 사용자는 프레젠테이션을 만들지 못한다", null, () =>
    client.query("insert into public.presentations (owner_id, title) values ($1, '익명 생성')", [
      ownerId,
    ]),
  );

  // --- 슬라이드 이미지 Storage ---
  // 객체 경로의 첫 칸이 자기 프레젠테이션인 경우에만 쓰기를 허용한다.
  const ownObject = `${presentationId}/rls-check.png`;
  const ownerUpload = await asRole(ownerId, () =>
    client.query(
      "insert into storage.objects (bucket_id, name, owner_id) values ('slide-images', $1, $2) returning id",
      [ownObject, ownerId],
    ),
  );
  check("소유자는 자기 프레젠테이션 폴더에 이미지를 올린다", ownerUpload.rowCount === 1);

  await expectDenied("남의 프레젠테이션 폴더에는 이미지를 올리지 못한다", otherId, () =>
    client.query(
      "insert into storage.objects (bucket_id, name, owner_id) values ('slide-images', $1, $2)",
      [ownObject, otherId],
    ),
  );

  await expectDenied("프레젠테이션 폴더가 아닌 경로에는 올리지 못한다", ownerId, () =>
    client.query(
      "insert into storage.objects (bucket_id, name, owner_id) values ('slide-images', $1, $2)",
      ["free/anywhere.png", ownerId],
    ),
  );

  // 객체 행 조회도 소유자에게만 보인다. 파일 내려받기는 공개 버킷 경로라 이 정책과 무관하다.
  // Storage는 SQL로 직접 지우는 것을 트리거로 막으므로, 삭제 정책은 E2E에서 실제 API로 확인한다.
  await client.query("begin");
  try {
    // 관리 연결로 넣어 두고 역할만 바꿔 가며 확인한다. 트랜잭션은 마지막에 되돌린다.
    await client.query(
      "insert into storage.objects (bucket_id, name, owner_id) values ('slide-images', $1, $2)",
      [ownObject, ownerId],
    );
    await client.query("select set_config('role', 'authenticated', true)");

    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: otherId, role: "authenticated" }),
    ]);
    const otherSee = await client.query(
      "select name from storage.objects where bucket_id = 'slide-images' and name = $1",
      [ownObject],
    );
    check("다른 사용자에게 남의 슬라이드 이미지가 보이지 않는다", otherSee.rowCount === 0);

    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: ownerId, role: "authenticated" }),
    ]);
    const ownerSee = await client.query(
      "select name from storage.objects where bucket_id = 'slide-images' and name = $1",
      [ownObject],
    );
    check("소유자는 자기 슬라이드 이미지를 조회한다", ownerSee.rowCount === 1);
  } finally {
    await client.query("rollback");
  }
} finally {
  // 임시 사용자를 지우면 프레젠테이션과 슬라이드도 함께 삭제된다.
  for (const id of [ownerId, otherId]) {
    if (id) await client.query("delete from auth.users where id = $1", [id]);
  }
  await client.end();
}

const failed = results.filter((result) => !result.passed);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);

if (failed.length > 0) {
  console.error("실패한 검증이 있습니다.");
  process.exit(1);
}
