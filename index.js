const express = require("express");
const { crawlWebsite } = require("./crawler");
const { analyzePages } = require("./analyzer");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/qa-test", async (req, res) => {
  const { websiteUrl } = req.body;

  if (!websiteUrl) {
    return res.status(400).json({ error: "Please provide a websiteUrl." });
  }

  try {
    console.log(`Crawling: ${websiteUrl}`);
    const { pages, videoPath } = await crawlWebsite(websiteUrl);

    console.log(`Analyzing ${pages.length} pages...`);
    const report = await analyzePages(pages);

    fs.writeFileSync("report.md", report);
    console.log("QA report generated.");

    res.json({
      message: "QA test completed. Check report.md and video for details.",
      video: videoPath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`QA tester running on http://localhost:${PORT}`);
});
