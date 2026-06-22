import { chromium } from "playwright";

const baseUrl = process.env.BUDDYUP_TEST_URL ?? "http://127.0.0.1:8082";
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH
  ?? (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined);

const browser = await chromium.launch({ headless: true, executablePath });
const issues = [];

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  const page = await browser.newPage({ viewport });
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      issues.push(`${viewport.name} console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`${viewport.name} page: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().endsWith("/favicon.ico")) {
      issues.push(`${viewport.name} response ${response.status()}: ${response.url()}`);
    }
  });

  await page.goto(`${baseUrl}/auth`, { waitUntil: "networkidle" });
  await page.getByText("Find your activity crew").waitFor();
  await page.screenshot({ path: `/tmp/buddyup-auth-${viewport.name}.png`, fullPage: true });

  await page.getByText("Privacy Policy").click();
  await page.getByText("Privacy policy", { exact: true }).waitFor();
  await page.goBack({ waitUntil: "networkidle" });

  await page.getByText("Terms of Use").click();
  await page.getByText("Terms of use", { exact: true }).waitFor();
  await page.screenshot({ path: `/tmp/buddyup-terms-${viewport.name}.png`, fullPage: true });
  await page.close();
}

await browser.close();

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("Web smoke test passed on phone and desktop viewports.");
