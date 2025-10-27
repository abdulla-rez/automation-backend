import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import cron from "node-cron";

const DOWNLOADS_PATH = "C:\\Users\\Reizend\\Downloads"; 

async function runAutomation() {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.]/g, "_")
      .replace("T", "_")
      .split("Z")[0];
    const FILE_NAME = `attendanceLogs_${timestamp}.xlsx`;
    const FULL_FILE_PATH = path.join(DOWNLOADS_PATH, FILE_NAME);

    console.log("\n🕒 Starting automation at:", new Date().toLocaleTimeString());

    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    // Step 1: Open App A and Download
    console.log("Opening App A...");
    await page.goto("http://localhost:5173");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#downloadExcelButton"),
    ]);
    await download.saveAs(FULL_FILE_PATH);
    console.log("✅ Downloaded file:", FULL_FILE_PATH);

    // Step 2: Open App B and Upload
    const page2 = await context.newPage();
    await page2.goto("http://localhost:5174");
    const fileInput = await page2.$("input[type='file']");
    await fileInput.setInputFiles(FULL_FILE_PATH);
    console.log("✅ Uploaded file to App B");

    await page2.waitForTimeout(2000);
    await browser.close();
    console.log("✅ Completed cycle.\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// Run every 10 seconds
cron.schedule("*/10 * * * * *", runAutomation);

console.log("🚀 Automation running every 10 seconds...");
console.log("Keep this terminal open (Ctrl+C to stop).");
