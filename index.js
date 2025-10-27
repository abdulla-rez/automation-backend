import express from "express";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import cron from "node-cron";

const app = express();

// ✅ Keeps Render happy
app.get("/", (req, res) => res.send("Automation service is running"));
app.listen(process.env.PORT || 3000, () =>
  console.log("🌐 Dummy server started on port", process.env.PORT || 3000)
);

// ----------------------------------------------------
// 🔽 Your existing automation code
// ----------------------------------------------------
const DOWNLOADS_PATH = path.resolve("/tmp/downloads");
if (!fs.existsSync(DOWNLOADS_PATH)) fs.mkdirSync(DOWNLOADS_PATH, { recursive: true });

async function runAutomation() {
  try {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "_").split("Z")[0];
    const FILE_NAME = `attendanceLogs_${timestamp}.xlsx`;
    const FULL_FILE_PATH = path.join(DOWNLOADS_PATH, FILE_NAME);

    console.log("\n🕒 Starting automation at:", new Date().toLocaleTimeString());

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    await page.goto("http://localhost:5173");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#downloadExcelButton"),
    ]);
    await download.saveAs(FULL_FILE_PATH);
    console.log("✅ Downloaded:", FULL_FILE_PATH);

    const page2 = await context.newPage();
    await page2.goto("http://localhost:5174");
    const fileInput = await page2.$("input[type='file']");
    await fileInput.setInputFiles(FULL_FILE_PATH);
    console.log("✅ Uploaded file to App B");

    await browser.close();
    console.log("✅ Completed cycle.\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// Run every 10 s
cron.schedule("*/10 * * * * *", runAutomation);
console.log("🚀 Automation running every 10 seconds…");
