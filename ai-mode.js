require("dotenv").config();
const express = require("express");
const { chromium } = require("playwright");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3001;

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/qa-test/ai-mode", async (req, res) => {
  const { websiteUrl, instructions } = req.body;

  if (!websiteUrl || !instructions) {
    return res
      .status(400)
      .json({ error: "Provide websiteUrl and instructions." });
  }

  const videoDir = path.join(__dirname, "session-videos");
  fs.mkdirSync(videoDir, { recursive: true });
  const videoPath = path.join(videoDir, `ai-mode-${Date.now()}.webm`);

  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ recordVideo: { dir: videoDir } });
  const page = await context.newPage();

  try {
    await page.goto(websiteUrl, { waitUntil: "domcontentloaded" });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Function for handling rate limit with retries
    async function generateWithRetry(prompt) {
      let retries = 3;
      while (retries > 0) {
        try {
          const result = await model.generateContent(prompt);
          return result.response;
        } catch (err) {
          if (err.message.includes("429")) {
            console.log(
              `Rate limit hit. Waiting 35 seconds before retrying...`
            );
            await new Promise((resolve) => setTimeout(resolve, 35000));
            retries--;
          } else {
            throw err;
          }
        }
      }
      throw new Error("Failed after multiple retries due to rate limiting.");
    }

    // Generate test plan with retries
    const planPrompt = `You are an expert QA tester.

Convert these natural language instructions into detailed browser actions. Follow these rules:

- Do NOT number the steps.
- Use 'click on' for links, buttons, and interactive elements.
- Use 'type' for input fields.
- Use 'wait' for pauses (e.g., 2 seconds).
- Only use 'navigate to' if a full URL is explicitly provided.

Example:
Instruction: Scroll down to the footer and click on the Privacy Policy link.
Output:
scroll to the footer
click on 'Privacy Policy' link

Instructions: ${instructions}`;

    const planResponse = await generateWithRetry(planPrompt);
    const stepsText = await planResponse.text();
    console.log("Test Plan:\n", stepsText);
    fs.writeFileSync("ai-test-plan.txt", stepsText);

    const steps = stepsText
      .split(/\n|\r/)
      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
      .filter((s) => s.length > 0);

    const pageSnapshots = [];

    // Execute each step
    for (const step of steps) {
      console.log("Executing:", step);
      await page.waitForTimeout(1000);

      if (/scroll/i.test(step)) {
        if (/footer/i.test(step)) {
          const footer = page.locator("footer").first();
          if (await footer.count()) {
            await footer.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
          } else {
            console.warn("Footer not found.");
          }
        } else {
          await page.mouse.wheel(0, 3000);
          await page.waitForTimeout(1000);
        }
      } else if (/type/i.test(step)) {
        const match = step.match(/type '(.*?)' into '(.*?)'/i);
        if (match) {
          const text = match[1];
          const label = match[2].replace(/['"`]/g, "").trim();
          let input = page
            .locator(
              `input[placeholder="${label}"], input[aria-label="${label}"]`
            )
            .first();
          if (!(await input.count())) input = page.getByLabel(label).first();
          if ((await input.count()) && (await input.isVisible())) {
            await input.scrollIntoViewIfNeeded();
            await input.focus();
            await input.fill("");
            await input.type(text, { delay: 100 });
          } else {
            console.warn(`Input for '${label}' not found.`);
          }
        }
      } else if (/click/i.test(step)) {
        const match = step.match(/click (?:on )?'?(.*?)'?$/i);
        let target = match ? match[1].replace(/['"`]/g, "").trim() : null;
        if (target) {
          const cleanTarget = target
            .replace(/\b(the|green|red|blue|yellow|primary|button)\b/gi, "") // Strip common words
            .replace(/\s+/g, " ") // Normalize spaces
            .trim();

          let element = page
            .locator(`button:has-text("${cleanTarget}")`)
            .first();
          if (!(await element.count()))
            element = page.locator(`a:has-text("${cleanTarget}")`).first();
          if (!(await element.count()))
            element = page.locator(`text="${cleanTarget}"`).first();
          if (await element.count()) {
            await element.scrollIntoViewIfNeeded();
            await element.hover();
            await element.click();
          } else {
            console.warn(`Element with text '${cleanTarget}' not found.`);
          }
        }
      } else if (/wait/i.test(step)) {
        const match = step.match(/wait (\d+) seconds?/i);
        const seconds = match ? parseInt(match[1], 10) : 2;
        await page.waitForTimeout(seconds * 1000);
      } else if (/navigate/i.test(step)) {
        const match = step.match(/navigate to (.*?)$/i);
        if (match) {
          const url = match[1];
          if (!url.startsWith("http")) {
            const link = page.locator("*", { hasText: url }).first();
            if (await link.isVisible()) {
              await link.scrollIntoViewIfNeeded();
              await link.click();
            } else {
              console.warn(`Link '${url}' not found.`);
            }
          } else {
            await page.goto(url, { waitUntil: "domcontentloaded" });
          }
        }
      }

      const content = await page.content();
      pageSnapshots.push({ step, content });
    }

    await context.close();
    await browser.close();

    // Generate QA report with retries
    let report = "# AI QA Report\n\n";
    for (const snapshot of pageSnapshots) {
      const analyzePrompt = `You are an expert QA tester.

Analyze the following page snapshot after executing the step: ${snapshot.step}.

Provide:
- A summary of what was found on the page.
- UX improvements (e.g., navigation clarity, responsiveness, accessibility).
- Potential issues or bugs (e.g., broken links, missing elements, console errors).
- Suggestions for improving the user experience.

Snapshot HTML (truncated):
${snapshot.content.slice(0, 2000)}`;

      const analyzeResponse = await generateWithRetry(analyzePrompt);
      report += `## Step: ${snapshot.step}\n${analyzeResponse.text()}\n\n---\n`;
    }

    fs.writeFileSync("ai-qa-report.md", report);

    res.json({
      message: "AI-driven QA test completed.",
      video: videoPath,
      testPlan: "ai-test-plan.txt",
      report: "ai-qa-report.md",
    });
  } catch (err) {
    console.error(err);
    await browser.close();
    res.status(500).json({ error: "AI QA failed.", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI QA tester running on http://localhost:${PORT}`);
});
