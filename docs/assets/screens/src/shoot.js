// screens.html 의 .shot 마다 ../<id>.png 한 장으로 찍는다(2배 해상도). 예시 그림용.
// 실행: NODE_PATH=<playwright 가 설치된 node_modules> node docs/assets/screens/src/shoot.js
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 800 }, deviceScaleFactor: 2 });
  await page.goto("file://" + path.join(__dirname, "screens.html"));
  await page.evaluate(() => document.fonts.ready);
  for (const shot of await page.locator(".shot").all()) {
    const id = await shot.getAttribute("id");
    await shot.screenshot({ path: path.join(__dirname, "..", `${id}.png`) });
    console.log(`${id}.png`);
  }
  await browser.close();
})();
