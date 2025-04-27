
# QAcer QA Tool

This tool allows **AI-driven testing of websites** by simulating real user interactions—like scrolling, clicking, and typing—and recording the entire session as a video.

---

## 🚀 Getting Started

Follow these steps to install and run the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/Bil0000/qacer
cd qacer
```

### 2. Create a `.env` file in the root directory

```bash
touch .env
```

### 3. Add your Gemini API key to `.env`

```
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Create a `session-videos` folder

```bash
mkdir session-videos
```

### 5. Install dependencies

```bash
npm install
```

### 6. Run the application

```bash
node ai-mode.js
```

---

## 🧪 How to Use

1. Open **Postman** (or any other API client).
2. Make a `POST` request to:

```
http://localhost:3001/qa-test/ai-mode
```

3. In the **Body**, choose:

- `raw`
- `JSON` format

4. Paste your test scenario like this:

```json
{
  "websiteUrl": "https://calendaty.com",
  "instructions": "Scroll down to the footer on the home page, type 'test@example.com' into the input field with placeholder 'Your email address', click on the 'Subscribe' button, and wait 10 seconds."
}
```

> **Note:** Replace `websiteUrl` and `instructions` with the site and test flow you want to run.

---

## 🤝 Contributions

All contributions are welcome and appreciated! 🎉  
Whether you're fixing a bug 🐛, adding a feature 🚀, or improving the docs 📚—we'd love to see it.

### Steps to contribute:

1. Fork the repository
2. Create your feature branch:

```bash
git checkout -b feature/YourFeature
```

3. Commit your changes:

```bash
git commit -m 'Add some feature'
```

4. Push to the branch:

```bash
git push origin feature/YourFeature
```

5. Open a pull request 🚀

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

> 💡 **Let's make QA smarter together!** Feel free to reach out or open an issue to suggest improvements.
