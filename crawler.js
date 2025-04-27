const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function crawlWebsite(url) {
  const videoPath = path.join(
    __dirname,
    "session-videos",
    `qa-session-${Date.now()}.webm`
  );
  fs.mkdirSync(path.dirname(videoPath), { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 50 }); // Visible + slowMo for realism
  const context = await browser.newContext({
    recordVideo: { dir: path.dirname(videoPath) },
  });
  const page = await context.newPage();

  const visited = new Set();
  const pages = [];

  async function moveMouseSmoothly(x, y) {
    const current = await page.mouse.position();
    const steps = 20;
    const deltaX = (x - current.x) / steps;
    const deltaY = (y - current.y) / steps;
    for (let i = 0; i < steps; i++) {
      await page.mouse.move(current.x + deltaX * i, current.y + deltaY * i);
      await page.waitForTimeout(20); // Adds smoothness
    }
  }

  async function visit(link, depth = 0) {
    if (visited.has(link) || !link.startsWith(url) || depth > 1) return;
    visited.add(link);

    try {
      await page.goto(link, { waitUntil: "domcontentloaded", timeout: 15000 });
    } catch (err) {
      console.error(`Failed to load ${link}:`, err.message);
      return;
    }

    // Simulate scrolling
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(500);

    // Simulate clicking first button if exists
    const button = await page.$("button");
    if (button) {
      const box = await button.boundingBox();
      if (box) {
        await moveMouseSmoothly(box.x + box.width / 2, box.y + box.height / 2);
        await button.click();
        await page.waitForTimeout(1000);
      }
    }

    // Capture console logs
    const consoleMessages = [];
    page.on("console", (msg) => consoleMessages.push(msg.text()));

    const content = await page.content();
    const forms = await page.$$("form");
    const buttons = await page.$$("button");

    pages.push({
      url: link,
      content,
      formCount: forms.length,
      buttonCount: buttons.length,
      consoleMessages,
    });

    const hrefs = await page.$$eval("a", (anchors) =>
      anchors.map((a) => a.href).filter((href) => href)
    );
    for (const href of hrefs) {
      await visit(href, depth + 1);
    }
  }

  await visit(url);
  await context.close(); // Save video
  await browser.close();

  return { pages, videoPath };
}

module.exports = { crawlWebsite };
