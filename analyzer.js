require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzePages(pages) {
  let report = "# QA Report (Gemini)\n\n";
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  for (const page of pages) {
    const { url, content, formCount, buttonCount, consoleMessages } = page;

    const prompt = `
You are an expert QA tester. Analyze this webpage for:

- Bugs, missing elements (alt text, forms, error handling).
- Unhandled edge cases.
- Suggested test cases.
- Consider console logs: ${consoleMessages.join(", ")}

## Page URL: ${url}

## Page Info:
- Forms: ${formCount}
- Buttons: ${buttonCount}

## Page HTML:
${content.slice(0, 2000)}
`;

    let retries = 3;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        report += `## ${url}\n${text}\n\n---\n`;
        break;
      } catch (err) {
        if (err.message.includes("429")) {
          console.log(`Rate limit hit. Waiting 35 seconds before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 35000));
          retries--;
        } else {
          console.error(`Error analyzing ${url}:`, err.message);
          report += `## ${url}\nError analyzing this page: ${err.message}\n\n---\n`;
          break;
        }
      }
    }
  }

  return report;
}

module.exports = { analyzePages };
