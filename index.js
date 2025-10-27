import express from "express";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import cron from "node-cron";

const app = express();
app.get("/", (req, res) => res.send("Automation service is running"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Server started on port", process.env.PORT || 3000)
);

// ----------------------------------------------------------------
const DOWNLOADS_PATH = path.resolve("/tmp/downloads");
if (!fs.existsSync(DOWNLOADS_PATH)) fs.mkdirSync(DOWNLOADS_PATH, { recursive: true });

// Environment-based frontend URLs
const APP_A_URL =  "https://automation-frontend-1.onrender.com";
const APP_B_URL =  "https://automation-frontend-2.onrender.com";

async function runAutomation() {
  try {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "_").split("Z")[0];
    const FILE_NAME = `attendanceLogs_${timestamp}.xlsx`;
    const FULL_FILE_PATH = path.join(DOWNLOADS_PATH, FILE_NAME);

    console.log("\n🕒 Starting automation at:", new Date().toLocaleTimeString());

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    await page.goto(APP_A_URL);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#downloadExcelButton"),
    ]);
    await download.saveAs(FULL_FILE_PATH);
    console.log("✅ Downloaded:", FULL_FILE_PATH);

    const page2 = await context.newPage();
    await page2.goto(APP_B_URL);
    const fileInput = await page2.$("input[type='file']");
    await fileInput.setInputFiles(FULL_FILE_PATH);
    console.log("✅ Uploaded file to App B");

    await browser.close();
    console.log("✅ Completed cycle.\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

cron.schedule("*/10 * * * * *", runAutomation);
console.log("🚀 Automation running every 10 seconds…");
