/**
 * End-to-end smoke test for the Projexa API.
 *
 * ZERO DEPENDENCIES — uses Node 20's built-in fetch. Run it against a server that
 * is already running:
 *
 *   Terminal 1:  npm run dev
 *   Terminal 2:  node scripts/smoke-test.mjs
 *
 * It exercises the full stack: env validation, database, auth with token rotation,
 * RBAC, project CRUD, idea-hash staleness, the generation queue, artifact
 * versioning, validation errors and the centralised error handler.
 *
 * Exits 0 if everything passes, 1 otherwise — so it can drop straight into CI.
 */

const BASE = process.env.API_URL ?? 'http://localhost:8000/api/v1';

let passed = 0;
let failed = 0;
const failures = [];

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

const check = (label, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  ${c.green('PASS')}  ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  ${c.red('FAIL')}  ${label}${detail ? `\n        ${c.dim(detail)}` : ''}`);
  }
};

const section = (title) => console.log(`\n${c.bold(c.cyan(title))}`);

/** Minimal cookie jar so refresh-token rotation can be tested properly. */
const jar = new Map();

const api = async (method, path, { body, token, raw = false } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(';');
    const idx = pair.indexOf('=');
    jar.set(pair.slice(0, idx), pair.slice(idx + 1));
  }

  if (raw) return res;
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }
  return { status: res.status, body: json, text };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  console.log(c.bold(`\nProjexa — API smoke test`));
  console.log(c.dim(`Target: ${BASE}\n`));

  const stamp = Date.now();
  const student = { name: 'Smoke Student', email: `student.${stamp}@apm.test`, password: 'Str0ng#Pass1' };
  const other = { name: 'Other Student', email: `other.${stamp}@apm.test`, password: 'Str0ng#Pass1' };

  let accessToken;
  let otherToken;
  let projectId;

  /* ── 1. Health & metadata ──────────────────────────────────────────── */
  section('1. Health & metadata');
  {
    const r = await api('GET', '/health');
    check('GET /health returns 200', r.status === 200, `got ${r.status}`);
    check('database is connected', r.body?.data?.database?.status === 'connected',
      `got ${r.body?.data?.database?.status}`);
    check('response uses the success envelope',
      r.body?.success === true && 'statusCode' in r.body && 'message' in r.body);

    const m = await api('GET', '/meta/constants');
    check('GET /meta/constants returns enums', m.status === 200 && Array.isArray(m.body?.data?.domains));
    check('implemented modules are reported',
      Array.isArray(m.body?.data?.implementedModules) && m.body.data.implementedModules.length > 0,
      `got ${JSON.stringify(m.body?.data?.implementedModules)}`);
  }

  /* ── 2. Validation & error envelope ────────────────────────────────── */
  section('2. Validation & error handling');
  {
    const r = await api('POST', '/auth/register', { body: { name: 'x', email: 'not-an-email', password: '123' } });
    check('invalid registration returns 422', r.status === 422, `got ${r.status}`);
    check('error envelope has field-level errors',
      Array.isArray(r.body?.errors) && r.body.errors.length >= 2 && 'field' in r.body.errors[0]);
    check('error response carries a requestId', typeof r.body?.requestId === 'string');

    const nf = await api('GET', '/this-route-does-not-exist');
    check('unknown route returns 404 in the same envelope',
      nf.status === 404 && nf.body?.success === false);

    const badId = await api('GET', '/projects/not-a-valid-object-id');
    check('malformed ObjectId returns 401 or 400, never 500',
      [400, 401, 422].includes(badId.status), `got ${badId.status}`);
  }

  /* ── 3. Registration & login ───────────────────────────────────────── */
  section('3. Authentication');
  {
    const r = await api('POST', '/auth/register', { body: student });
    check('registration returns 201', r.status === 201, `got ${r.status}: ${r.text?.slice(0, 120)}`);
    check('access token issued', typeof r.body?.data?.accessToken === 'string');
    check('password never appears in the response', !JSON.stringify(r.body).includes('password'));
    check('refresh token delivered as an httpOnly cookie', jar.has('refreshToken'));
    accessToken = r.body?.data?.accessToken;

    const dup = await api('POST', '/auth/register', { body: student });
    check('duplicate email returns 409', dup.status === 409, `got ${dup.status}`);

    const bad = await api('POST', '/auth/login', { body: { email: student.email, password: 'WrongPass1' } });
    check('wrong password returns 401', bad.status === 401, `got ${bad.status}`);

    const ghost = await api('POST', '/auth/login', { body: { email: `ghost.${stamp}@apm.test`, password: 'WrongPass1' } });
    check('unknown email returns the SAME message as wrong password (no enumeration)',
      ghost.status === 401 && ghost.body?.message === bad.body?.message,
      `"${ghost.body?.message}" vs "${bad.body?.message}"`);

    const ok = await api('POST', '/auth/login', { body: { email: student.email, password: student.password } });
    check('valid login returns 200', ok.status === 200, `got ${ok.status}`);
    accessToken = ok.body?.data?.accessToken;
  }

  /* ── 4. Protected routes & token rotation ──────────────────────────── */
  section('4. Protected routes & refresh rotation');
  {
    const noAuth = await api('GET', '/users/me');
    check('no token returns 401', noAuth.status === 401, `got ${noAuth.status}`);

    const badToken = await api('GET', '/users/me', { token: 'clearly.not.a.jwt' });
    check('invalid token returns 401', badToken.status === 401, `got ${badToken.status}`);

    const me = await api('GET', '/users/me', { token: accessToken });
    check('valid token returns the profile', me.status === 200 && me.body?.data?.user?.email === student.email);
    check('credit balance is exposed', typeof me.body?.data?.user?.aiCredits?.limit === 'number');

    const firstCookie = jar.get('refreshToken');
    const refreshed = await api('POST', '/auth/refresh-token');
    check('refresh returns a new access token',
      refreshed.status === 200 && typeof refreshed.body?.data?.accessToken === 'string',
      `got ${refreshed.status}`);
    check('refresh token was ROTATED (cookie changed)', jar.get('refreshToken') !== firstCookie);

    // Replay the old token — reuse detection must reject it.
    const replay = await fetch(`${BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `refreshToken=${firstCookie}` },
    });
    check('replaying a rotated refresh token is rejected (reuse detection)',
      replay.status === 401, `got ${replay.status}`);

    // Family was revoked by the replay, so log in again for the rest of the suite.
    const relogin = await api('POST', '/auth/login', { body: { email: student.email, password: student.password } });
    accessToken = relogin.body?.data?.accessToken;
    check('re-login succeeds after family revocation', relogin.status === 200);
  }

  /* ── 5. RBAC ───────────────────────────────────────────────────────── */
  section('5. Role-based access control');
  {
    const r = await api('GET', '/users', { token: accessToken });
    check('student cannot list all users (403)', r.status === 403, `got ${r.status}`);
    check('403 is distinct from 401', r.body?.message?.toLowerCase().includes('role'));

    const escalate = await api('POST', '/auth/register', {
      body: { ...other, role: 'admin' },
    });
    check('self-registration cannot mint an admin',
      escalate.status === 422 || escalate.body?.data?.user?.role !== 'admin',
      `role came back as ${escalate.body?.data?.user?.role}`);
  }

  /* ── 6. Project CRUD ───────────────────────────────────────────────── */
  section('6. Project CRUD');
  {
    const invalid = await api('POST', '/projects', {
      token: accessToken,
      body: { title: 'abc', description: 'too short', domain: 'nonsense', difficulty: 'wizard' },
    });
    check('invalid project returns 422', invalid.status === 422, `got ${invalid.status}`);

    const created = await api('POST', '/projects', {
      token: accessToken,
      body: {
        title: 'AI-Powered Hospital Management System',
        description:
          'A MERN platform where patients book appointments, doctors manage prescriptions and medical history, and admins view analytics with AI-assisted scheduling.',
        domain: 'healthcare',
        difficulty: 'advanced',
        teamSize: 3,
        preferredTech: ['React', 'Node.js', 'MongoDB'],
        aiIntegrationRequired: true,
        tags: ['mern', 'healthcare'],
      },
    });
    check('project created (201)', created.status === 201, `got ${created.status}: ${created.text?.slice(0, 160)}`);
    check('slug auto-generated', typeof created.body?.data?.project?.slug === 'string');
    check('ideaHash computed', typeof created.body?.data?.project?.ideaHash === 'string');
    projectId = created.body?.data?.project?._id;

    const list = await api('GET', '/projects?page=1&limit=5', { token: accessToken });
    check('project list returns pagination meta',
      list.status === 200 && typeof list.body?.meta?.totalPages === 'number');

    const stats = await api('GET', '/projects/stats', { token: accessToken });
    check('/projects/stats resolves (not parsed as an :id)',
      stats.status === 200 && typeof stats.body?.data?.projects?.total === 'number',
      `got ${stats.status}`);

    const detail = await api('GET', `/projects/${projectId}`, { token: accessToken });
    check('project detail includes an artifact summary',
      detail.status === 200 && Array.isArray(detail.body?.data?.artifacts));
  }

  /* ── 7. Ownership isolation ────────────────────────────────────────── */
  section('7. Ownership isolation');
  {
    const reg = await api('POST', '/auth/login', { body: { email: other.email, password: other.password } });
    otherToken = reg.body?.data?.accessToken;

    if (otherToken) {
      const read = await api('GET', `/projects/${projectId}`, { token: otherToken });
      check("another user cannot read someone else's project", read.status === 403, `got ${read.status}`);

      const write = await api('PATCH', `/projects/${projectId}`, {
        token: otherToken,
        body: { title: 'Hijacked project title' },
      });
      check("another user cannot modify someone else's project", write.status === 403, `got ${write.status}`);
    } else {
      check('second user login succeeded', false, 'could not obtain a second token');
    }

    // Restore the first user's session for the remaining tests.
    const back = await api('POST', '/auth/login', { body: { email: student.email, password: student.password } });
    accessToken = back.body?.data?.accessToken;
  }

  /* ── 8. Idea-hash staleness ────────────────────────────────────────── */
  section('8. Idea change marks artifacts stale');
  {
    const noop = await api('PATCH', `/projects/${projectId}`, {
      token: accessToken,
      body: { tags: ['mern', 'healthcare'] },
    });
    check('editing a non-idea field does NOT flag staleness',
      noop.status === 200 && noop.body?.data?.ideaChanged === false,
      `ideaChanged=${noop.body?.data?.ideaChanged}`);

    const changed = await api('PATCH', `/projects/${projectId}`, {
      token: accessToken,
      body: { description: 'A completely rewritten description that changes the underlying project idea entirely and therefore invalidates every previously generated module.' },
    });
    check('editing the description DOES flag the idea as changed',
      changed.status === 200 && changed.body?.data?.ideaChanged === true,
      `ideaChanged=${changed.body?.data?.ideaChanged}`);
  }

  /* ── 9. AI generation pipeline ─────────────────────────────────────── */
  section('9. AI generation pipeline (15 of 16 implemented modules)');
  {
    // All 16 module types are now implemented. GITHUB_GUIDE is deliberately
    // left out of this batch so section 10 still has a genuinely never-generated
    // (but real, implemented) module type to prove the 404-vs-200 distinction with.
    // Requesting the other 15 in one batch is what actually proves the dependency
    // graph — VIVA_PREP and DOCUMENTATION each depend on four upstream artifacts,
    // so if the topological sort is wrong this is where it would surface.
    const allModules = [
      'OVERVIEW', 'FEATURES', 'TECH_STACK', 'SRS', 'DATABASE_DESIGN',
      'API_DESIGN', 'FOLDER_STRUCTURE', 'ROADMAP', 'VIVA_PREP',
      'UI_PLAN', 'SPRINT_PLAN', 'DOCUMENTATION', 'COST_ESTIMATION', 'RISK_ANALYSIS',
      'DEPLOYMENT_GUIDE',
    ];

    const start = await api('POST', `/projects/${projectId}/generate`, {
      token: accessToken,
      body: { modules: allModules, force: true },
    });
    check('generation returns 202 Accepted', start.status === 202, `got ${start.status}: ${start.text?.slice(0, 200)}`);
    check('a jobId is returned', typeof start.body?.data?.jobId === 'string');

    const ordered = start.body?.data?.modules?.map((m) => m.type) ?? [];
    const before = (a, b) => ordered.indexOf(a) < ordered.indexOf(b);
    check('modules are topologically ordered (OVERVIEW before FEATURES before SRS)',
      before('OVERVIEW', 'FEATURES') && before('FEATURES', 'SRS'),
      `order was ${ordered.join(' -> ')}`);
    check('FOLDER_STRUCTURE runs after both its dependencies (TECH_STACK, DATABASE_DESIGN)',
      before('TECH_STACK', 'FOLDER_STRUCTURE') && before('DATABASE_DESIGN', 'FOLDER_STRUCTURE'));
    check('VIVA_PREP runs after all four of its dependencies',
      before('OVERVIEW', 'VIVA_PREP') && before('SRS', 'VIVA_PREP') &&
      before('DATABASE_DESIGN', 'VIVA_PREP') && before('TECH_STACK', 'VIVA_PREP'),
      `order was ${ordered.join(' -> ')}`);
    check('DOCUMENTATION runs after all four of its dependencies',
      before('OVERVIEW', 'DOCUMENTATION') && before('TECH_STACK', 'DOCUMENTATION') &&
      before('FOLDER_STRUCTURE', 'DOCUMENTATION') && before('API_DESIGN', 'DOCUMENTATION'),
      `order was ${ordered.join(' -> ')}`);
    check('SPRINT_PLAN runs after ROADMAP', before('ROADMAP', 'SPRINT_PLAN'), `order was ${ordered.join(' -> ')}`);
    check('COST_ESTIMATION runs after ROADMAP', before('ROADMAP', 'COST_ESTIMATION'), `order was ${ordered.join(' -> ')}`);
    check('credits are reserved', typeof start.body?.data?.creditsReserved === 'number');

    const jobId = start.body?.data?.jobId;
    let status = null;
    for (let i = 0; i < 90; i += 1) {
      await sleep(500);
      const poll = await api('GET', `/projects/${projectId}/generate/status/${jobId}`, { token: accessToken });
      status = poll.body?.data;
      if (['completed', 'partial', 'failed'].includes(status?.overallStatus)) break;
    }
    check('job reaches a terminal state', ['completed', 'partial', 'failed'].includes(status?.overallStatus),
      `overallStatus=${status?.overallStatus}`);
    check('job completed with all 15 modules successful', status?.overallStatus === 'completed',
      `modules: ${JSON.stringify(status?.modules)}`);
    check('progress reports 100%', status?.progress === 100, `progress=${status?.progress}`);

    const cached = await api('POST', `/projects/${projectId}/generate`, {
      token: accessToken,
      body: { modules: ['OVERVIEW'], force: false },
    });
    check('re-requesting an up-to-date module is served from cache (200, no job)',
      cached.status === 200 && cached.body?.data?.jobId === null,
      `got ${cached.status}, jobId=${cached.body?.data?.jobId}`);
  }

  /* ── 9b. New Phase 4 module shapes ─────────────────────────────────── */
  section('9b. Folder structure, roadmap and viva prep content');
  {
    const folder = await api('GET', `/projects/${projectId}/artifacts/folder-structure`, { token: accessToken });
    check('folder structure artifact resolves', folder.status === 200, `got ${folder.status}`);
    check('folder structure has both frontend and backend trees',
      Array.isArray(folder.body?.data?.artifact?.content?.frontend?.entries) &&
      Array.isArray(folder.body?.data?.artifact?.content?.backend?.entries));

    const roadmap = await api('GET', `/projects/${projectId}/artifacts/roadmap`, { token: accessToken });
    check('roadmap artifact resolves', roadmap.status === 200, `got ${roadmap.status}`);
    check('roadmap has at least one week with tasks',
      Array.isArray(roadmap.body?.data?.artifact?.content?.weeks) &&
      roadmap.body.data.artifact.content.weeks.length > 0 &&
      Array.isArray(roadmap.body.data.artifact.content.weeks[0]?.tasks));

    const viva = await api('GET', `/projects/${projectId}/artifacts/viva-prep`, { token: accessToken });
    check('viva prep artifact resolves', viva.status === 200, `got ${viva.status}`);
    const categories = viva.body?.data?.artifact?.content?.categories ?? [];
    check('viva prep has all four question categories',
      ['technical', 'conceptual', 'project_specific', 'viva_etiquette'].every((c) =>
        categories.some((cat) => cat.category === c)
      ),
      `got categories: ${categories.map((c) => c.category).join(', ')}`);
    check('every category has at least 3 questions',
      categories.every((cat) => cat.questions.length >= 3),
      `counts: ${categories.map((c) => `${c.category}=${c.questions.length}`).join(', ')}`);

    const uiPlan = await api('GET', `/projects/${projectId}/artifacts/ui-plan`, { token: accessToken });
    check('ui plan artifact resolves with at least 3 screens',
      uiPlan.status === 200 && (uiPlan.body?.data?.artifact?.content?.screens?.length ?? 0) >= 3,
      `got ${uiPlan.status}`);

    const cost = await api('GET', `/projects/${projectId}/artifacts/cost-estimation`, { token: accessToken });
    check('cost estimation artifact has numeric totals',
      cost.status === 200 &&
      typeof cost.body?.data?.artifact?.content?.totalMonthlyCost === 'number' &&
      typeof cost.body?.data?.artifact?.content?.totalOneTimeCost === 'number',
      `got ${cost.status}`);

    const risk = await api('GET', `/projects/${projectId}/artifacts/risk-analysis`, { token: accessToken });
    check('risk analysis artifact has at least 4 risks',
      risk.status === 200 && (risk.body?.data?.artifact?.content?.risks?.length ?? 0) >= 4,
      `got ${risk.status}`);
  }

  /* ── 10. Artifacts ─────────────────────────────────────────────────── */
  section('10. Artifacts, editing & versioning');
  {
    const all = await api('GET', `/projects/${projectId}/artifacts`, { token: accessToken });
    check('artifact list returns all 15 generated modules',
      all.status === 200 && all.body?.data?.artifacts?.length >= 15,
      `got ${all.body?.data?.artifacts?.length}`);

    const srs = await api('GET', `/projects/${projectId}/artifacts/srs`, { token: accessToken });
    check('kebab-case URL resolves to the SRS artifact',
      srs.status === 200 && srs.body?.data?.artifact?.type === 'SRS', `got ${srs.status}`);
    check('SRS content matches the declared schema',
      Array.isArray(srs.body?.data?.artifact?.content?.functional) &&
      Array.isArray(srs.body?.data?.artifact?.content?.nonFunctional));
    check('generation metadata recorded',
      typeof srs.body?.data?.artifact?.generationMeta?.latencyMs === 'number');

    const versionBefore = srs.body?.data?.artifact?.version;
    const edited = await api('PATCH', `/projects/${projectId}/artifacts/srs`, {
      token: accessToken,
      body: { content: { ...srs.body.data.artifact.content, editedByUser: true } },
    });
    check('manual edit succeeds', edited.status === 200, `got ${edited.status}`);
    check('manual edit flags isManuallyEdited', edited.body?.data?.artifact?.isManuallyEdited === true);
    check('manual edit bumps the version',
      edited.body?.data?.artifact?.version > versionBefore,
      `${versionBefore} -> ${edited.body?.data?.artifact?.version}`);

    const versions = await api('GET', `/projects/${projectId}/artifacts/srs/versions`, { token: accessToken });
    check('previous version was archived',
      versions.status === 200 && versions.body?.data?.previous?.length >= 1);

    // GITHUB_GUIDE is a valid, implemented module type but was deliberately left
    // out of this run's batch (see section 9), so its artifact row genuinely
    // does not exist yet — this proves 404-vs-200 is driven by real state, not
    // just by whether the type is known.
    const missing = await api('GET', `/projects/${projectId}/artifacts/github-guide`, { token: accessToken });
    check('un-generated module returns 404, not an empty 200', missing.status === 404, `got ${missing.status}`);

    const unknown = await api('GET', `/projects/${projectId}/artifacts/not-a-module`, { token: accessToken });
    check('unknown module type returns 422', unknown.status === 422, `got ${unknown.status}`);
  }

  /* ── 10b. Export & history (Phase 5) ───────────────────────────────── */
  section('10b. Export & project history');
  {
    const pdf = await api('GET', `/projects/${projectId}/export?format=pdf`, { token: accessToken, raw: true });
    check('PDF export returns 200', pdf.status === 200, `got ${pdf.status}`);
    check('PDF export has the right content type', (pdf.headers.get('content-type') ?? '').includes('application/pdf'));
    const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
    const pdfMagic = Buffer.from(pdfBytes.slice(0, 5)).toString();
    check('PDF export starts with the %PDF- magic bytes', pdfMagic === '%PDF-', `got "${pdfMagic}"`);

    const docx = await api('GET', `/projects/${projectId}/export?format=docx&modules=OVERVIEW,SRS`, { token: accessToken, raw: true });
    check('DOCX export (subset of modules) returns 200', docx.status === 200, `got ${docx.status}`);
    const docxBytes = new Uint8Array(await docx.arrayBuffer());
    const docxMagic = Buffer.from(docxBytes.slice(0, 2)).toString('hex');
    check('DOCX export is a valid zip container', docxMagic === '504b', `got ${docxMagic}`);

    const md = await api('GET', `/projects/${projectId}/export?format=md`, { token: accessToken, raw: true });
    check('Markdown export returns 200', md.status === 200, `got ${md.status}`);
    const mdText = await md.text();
    check('Markdown export contains the project title', mdText.includes('#'), 'expected a markdown heading');

    const badFormat = await api('GET', `/projects/${projectId}/export?format=exe`, { token: accessToken });
    check('unsupported export format is rejected with 422', badFormat.status === 422, `got ${badFormat.status}`);

    const history = await api('GET', `/projects/${projectId}/history`, { token: accessToken });
    check('history endpoint returns 200', history.status === 200, `got ${history.status}`);
    const events = history.body?.data?.events ?? [];
    check('history includes a project_created event', events.some((e) => e.type === 'project_created'));
    // 15 modules were generated, but SRS was subsequently hand-edited (section 10),
    // which flips ITS event from module_generated to module_edited — so only 14
    // should still read as a plain generation.
    check('history includes module_generated events for the generated batch',
      events.filter((e) => e.type === 'module_generated').length >= 14,
      `got ${events.filter((e) => e.type === 'module_generated').length}`);
    check('history includes the manual SRS edit as module_edited',
      events.some((e) => e.type === 'module_edited' && e.module === 'SRS'));
    check('history is sorted newest first',
      events.every((e, i) => i === 0 || new Date(events[i - 1].timestamp) >= new Date(e.timestamp)));
  }

  /* ── 11. Soft delete & restore ─────────────────────────────────────── */
  section('11. Soft delete & restore');
  {
    const del = await api('DELETE', `/projects/${projectId}`, { token: accessToken });
    check('delete returns 204', del.status === 204, `got ${del.status}`);

    const gone = await api('GET', `/projects/${projectId}`, { token: accessToken });
    check('deleted project is no longer readable (404)', gone.status === 404, `got ${gone.status}`);

    const restored = await api('POST', `/projects/${projectId}/restore`, { token: accessToken });
    check('project can be restored within the window', restored.status === 200, `got ${restored.status}`);

    const back = await api('GET', `/projects/${projectId}`, { token: accessToken });
    check('restored project is readable again', back.status === 200, `got ${back.status}`);
  }

  /* ── 12. Logout ────────────────────────────────────────────────────── */
  section('12. Session termination');
  {
    const out = await api('POST', '/auth/logout', { token: accessToken });
    check('logout returns 204', out.status === 204, `got ${out.status}`);

    const afterLogout = await api('POST', '/auth/refresh-token');
    check('refresh fails after logout', afterLogout.status === 401, `got ${afterLogout.status}`);
  }

  /* ── Summary ───────────────────────────────────────────────────────── */
  const total = passed + failed;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(
    failed === 0
      ? c.green(c.bold(`  ALL ${total} CHECKS PASSED`))
      : c.red(c.bold(`  ${passed}/${total} passed — ${failed} FAILED`))
  );
  if (failed) {
    console.log(c.red('\n  Failed checks:'));
    failures.forEach((f) => console.log(c.red(`    • ${f}`)));
  }
  console.log(`${'─'.repeat(60)}\n`);

  process.exit(failed === 0 ? 0 : 1);
};

run().catch((error) => {
  console.error(c.red(`\nSmoke test could not run: ${error.message}`));
  console.error(c.dim('Is the server running? Start it with `npm run dev` in another terminal.\n'));
  process.exit(1);
});
