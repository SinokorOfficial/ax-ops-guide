// 공개 저장소(이 문서 저장소)의 실제 GitHub 화면을 로그인 없이 찍는다.
// 화면 위에 설명용 번호를 얹고 계정 이름은 가린 뒤 한 번에 찍으므로, 가리지 않은 원본은 남지 않는다.
// 실행: NODE_PATH=<playwright 가 설치된 node_modules> node docs/assets/screens/src/capture.js
// 가릴 곳 · 번호 붙일 곳을 못 찾으면 0 이 아닌 코드로 끝난다(GitHub 화면이 바뀐 것 — 선택자를 고친다).
const path = require("path");
const { chromium } = require("playwright");

const REPO = "https://github.com/SinokorOfficial/ax-ops-guide";
const OUT = path.join(__dirname, "..");

// 화면에 보이는 계정 이름 · 아바타를 회색 상자로 덮는다. 덮은 개수를 돌려준다.
const maskAccounts = () => {
  const cover = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return 0;
    const m = document.createElement("div");
    m.style.cssText = `position:absolute;z-index:9998;left:${r.left + scrollX - 2}px;top:${r.top + scrollY - 1}px;width:${r.width + 4}px;height:${r.height + 2}px;background:#d0d7de;border-radius:4px`;
    document.body.appendChild(m);
    return 1;
  };
  // 계정 링크(/<계정> · 작성자별 커밋 목록) · 사람 아바타, 그리고 같은 이름이 글자로만 나온 곳
  const links = [...document.querySelectorAll('a[data-hovercard-type="user"], a[href*="commits?author="]')];
  const names = new Set(links.map((a) => a.textContent.trim()).filter(Boolean));
  let n = 0;
  for (const el of links) n += cover(el);
  for (const el of document.querySelectorAll('img.avatar-user, img[class*="AvatarStack"]')) n += cover(el);
  for (const el of document.querySelectorAll("main span, main strong")) {
    if (el.children.length === 0 && names.has(el.textContent.trim())) n += cover(el);
  }
  return n;
};

// 번호 동그라미와 구석 표기를 얹는다. marks: [{ box, n, side }]
const drawMarks = ({ marks, clip }) => {
  for (const { box, n, side } of marks) {
    const d = document.createElement("div");
    const size = 28;
    let left = box.x + box.width + 4, top = box.y + box.height / 2 - size / 2;
    if (side === "left") left = box.x - size - 4;
    if (side === "top") { left = box.x + box.width / 2 - size / 2; top = box.y - size - 2; }
    if (side === "bottom") { left = box.x + box.width / 2 - size / 2; top = box.y + box.height + 2; }
    d.textContent = n;
    d.style.cssText = `position:absolute;z-index:9999;left:${left + scrollX}px;top:${top + scrollY}px;width:${size}px;height:${size}px;border-radius:50%;background:#00796b;color:#fff;font:700 15px/24px sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 0 0 1px #00796b`;
    document.body.appendChild(d);
  }
  const tag = document.createElement("div");
  tag.textContent = "실제 화면(공개 저장소)";
  tag.style.cssText = `position:absolute;z-index:9999;left:${clip.x + clip.width - 176}px;top:${clip.y + 6}px;width:168px;text-align:center;font:12px/18px sans-serif;color:#616161;border:1px solid #c7c7c7;border-radius:9px;background:#fff`;
  document.body.appendChild(tag);
};

async function shoot(ctx, name, url, { width, marks, clipTo, minMasks, top = "header.GlobalNav", pad = 16 }) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const resolved = [];
  for (const m of marks) {
    const loc = m.find(page).first();
    const box = await loc.boundingBox().catch(() => null);
    if (!box) throw new Error(`${name}: 번호 ${m.n} 을 붙일 곳을 찾지 못함`);
    resolved.push({ box, n: m.n, side: m.side || "right" });
  }
  // 찍을 범위: 로그아웃 머리줄(Sign in) 아래부터 clipTo 요소의 아래 끝까지
  const head = await page.locator(top).first().boundingBox();
  const end = await clipTo(page).first().boundingBox();
  if (!head || !end) throw new Error(`${name}: 찍을 범위를 찾지 못함`);
  const clip = { x: 0, y: head.y, width, height: Math.ceil(end.y + end.height + pad - head.y) };
  const masked = await page.evaluate(maskAccounts);
  if (masked < minMasks) throw new Error(`${name}: 계정 이름을 ${masked}곳만 가림(기대 ${minMasks}곳 이상)`);
  await page.evaluate(drawMarks, { marks: resolved, clip });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), clip });
  console.log(`${name}.png (가림 ${masked}곳)`);
  await page.close();
}

const tab = (label) => (p) => p.locator("nav[aria-label='Repository'] a", { hasText: label });

(async () => {
  const runs = await (await fetch("https://api.github.com/repos/SinokorOfficial/ax-ops-guide/actions/runs?per_page=50")).json();
  const failed = runs.workflow_runs.find((r) => r.conclusion === "failure");
  if (!failed) throw new Error("실패한 실행이 없어 실패 화면을 찍을 수 없음");

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2, locale: "en-US", timezoneId: "Asia/Seoul" });

  await shoot(ctx, "repo-home", REPO, {
    width: 1012, minMasks: 1, pad: 6, // 표 바로 아래(오른쪽 칸)의 기여자 목록이 찍히지 않게 바짝 자른다
    marks: [
      { n: 1, find: tab("Code"), side: "bottom" },
      { n: 2, find: tab("Issues"), side: "bottom" },
      { n: 3, find: tab("Pull requests"), side: "bottom" },
      { n: 4, find: tab("Actions"), side: "bottom" },
      { n: 5, find: (p) => p.locator("#ref-picker-repos-header-ref-selector, button[aria-label*='branch']"), side: "top" },
      { n: 6, find: (p) => p.locator("table[aria-labelledby='folders-and-files'] tbody tr.react-directory-row").nth(1), side: "left" },
    ],
    clipTo: (p) => p.locator("table[aria-labelledby='folders-and-files']"),
  });

  // Actions 목록 화면에는 저장소 탭 줄이 없다(왼쪽에 워크플로 목록).
  const runRow = (p, label) => p.locator(`li[aria-label^='${label}']`).first();
  await shoot(ctx, "actions-list", REPO + "/actions", {
    width: 1012, minMasks: 1, top: "main",
    marks: [
      { n: 1, find: (p) => runRow(p, "completed successfully").locator("svg.octicon").first(), side: "left" },
      { n: 2, find: (p) => runRow(p, "failed").locator("svg.octicon").first(), side: "left" },
      { n: 3, find: (p) => runRow(p, "failed").locator("h4 a span span") },
      { n: 4, find: (p) => runRow(p, "failed").locator("a[data-component='BranchName']") },
    ],
    clipTo: (p) => p.locator("li[aria-label*='Run ']").last(),
  });

  await shoot(ctx, "actions-run-fail", failed.html_url, {
    width: 1012, minMasks: 1,
    marks: [
      { n: 1, find: (p) => p.locator("h1.PageHeader-title"), side: "left" },
      { n: 2, find: (p) => p.getByText("Failure", { exact: true }) },
      { n: 3, find: (p) => p.locator("a[class*='ActionListContent']").filter({ hasText: /^deploy$/ }) },
      { n: 4, find: (p) => p.getByText("Annotations", { exact: true }) },
    ],
    clipTo: (p) => p.getByText("Show more").first(),
  });

  await shoot(ctx, "issues-tab", REPO + "/issues", {
    width: 1012, minMasks: 0,
    marks: [
      { n: 1, find: tab("Issues"), side: "bottom" },
      { n: 2, find: (p) => p.getByRole("link", { name: "New issue" }), side: "left" },
      { n: 3, find: (p) => p.locator("a", { hasText: /^Closed/ }) },
    ],
    clipTo: (p) => p.getByText("No results matched your search"),
  });

  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
