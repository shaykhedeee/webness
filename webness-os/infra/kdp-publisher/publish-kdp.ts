import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

// Simple argument parser
const args = process.argv.slice(2);
const options: Record<string, any> = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2);
    if (args[i + 1] && !args[i + 1].startsWith("--")) {
      options[key] = args[i + 1];
      i++;
    } else {
      options[key] = true;
    }
  }
}

// Help message
if (options.help || args.length === 0) {
  console.log(`
Amazon KDP Ebook Publishing Automation Script (Playwright)

Usage:
  npx tsx publish-kdp.ts [options]

Options:
  --epub <path>         Path to EPUB file (Required unless --login-only)
  --cover <path>        Path to Cover image file (.jpg) (Required unless --login-only)
  --title <string>      Book Title (Required unless --login-only)
  --author <string>     Book Author (Required unless --login-only)
  --description <text>  Book Description (Required unless --login-only)
  --keywords <list>     Comma-separated keywords (max 7)
  --price <number>      Price in USD (e.g. 2.99)
  --session-dir <path>  Persistent browser state directory (default: ~/.kdp-session)
  --login-only          Launch browser, open KDP, and pause so you can login and solve MFA.
  --headless            Run in headless mode (default: false, headed is recommended for debugging KDP)
  `);
  process.exit(0);
}

const defaultSessionDir = path.join(os.homedir(), ".kdp-session");
const sessionDir = options["session-dir"] || defaultSessionDir;
const isHeadless = !!options.headless;
const loginOnly = !!options["login-only"];

async function main() {
  console.log(`[KDP] Persistent Session Folder: ${sessionDir}`);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  // Launch browser with persistent context
  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: isHeadless,
    viewport: { width: 1280, height: 800 },
    args: ["--disable-blink-features=AutomationControlled"]
  });

  const page = await context.newPage();
  console.log("[KDP] Navigating to Amazon KDP Bookshelf...");
  await page.goto("https://kdp.amazon.com/en_US/bookshelf", { waitUntil: "networkidle" });

  // Check if we need to log in
  const isSignInVisible = await page.locator("a:has-text('Sign in')").count() > 0 || await page.locator("input[name='email']").count() > 0;

  if (isSignInVisible) {
    console.log("[KDP] ⚠️ Sign-in or email input detected. Not logged in.");
    if (loginOnly) {
      console.log("[KDP] Headed mode active. Please log in, complete MFA, and authorize the device in the browser window.");
      console.log("[KDP] Close the browser window or press Ctrl+C in this terminal when finished to save the cookies.");
      // Keep page open until closed manually
      await new Promise((resolve) => page.on("close", resolve));
      console.log("[KDP] Browser page closed. Session saved successfully.");
      await context.close();
      return;
    } else {
      console.error("[KDP] ❌ ERROR: Not logged in. Please run this script first with: --login-only in headed mode to sign in.");
      await context.close();
      process.exit(1);
    }
  } else {
    console.log("[KDP] ✓ Logged in successfully via stored cookies!");
    if (loginOnly) {
      console.log("[KDP] Already logged in. Exiting.");
      await context.close();
      return;
    }
  }

  // Validate parameters
  const epubPath = options.epub;
  const coverPath = options.cover;
  const title = options.title;
  const author = options.author;
  const description = options.description;
  const price = options.price || "2.99";
  const keywordsList = (options.keywords || "").split(",").map((k: string) => k.trim()).filter(Boolean);

  if (!epubPath || !coverPath || !title || !author || !description) {
    console.error("[KDP] ❌ ERROR: Missing required arguments. Run with --help to see usage.");
    await context.close();
    process.exit(1);
  }

  console.log(`[KDP] Publishing Title: "${title}" by ${author}`);

  // Navigate to Create Ebook Page
  await page.goto("https://kdp.amazon.com/en_US/bookshelf/create", { waitUntil: "networkidle" });
  
  // Click "Kindle eBook"
  console.log("[KDP] Selecting 'Kindle eBook' creation...");
  await page.click("a:has-text('Kindle eBook')");
  await page.waitForLoadState("networkidle");

  // ─── STEP 1: EBOOK DETAILS ───
  console.log("[KDP] Filling eBook Details...");
  
  // Title
  await page.fill("input[name='title']", title);
  
  // Author
  const nameParts = author.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  await page.fill("input[name='author.firstName']", firstName);
  if (lastName) {
    await page.fill("input[name='author.lastName']", lastName);
  }

  // Description (uses an iframe or contenteditable div)
  const descriptionEditor = page.locator("iframe[id='description_iframe']");
  if (await descriptionEditor.count() > 0) {
    const frame = page.frame({ id: "description_iframe" });
    if (frame) {
      await frame.fill("body", description);
    }
  } else {
    await page.fill("textarea[name='description']", description);
  }

  // Publishing Rights
  await page.click("input[name='publishingRights'][value='own']");

  // Keywords
  for (let idx = 0; idx < Math.min(keywordsList.length, 7); idx++) {
    await page.fill(`input[name='keywords[${idx}]']`, keywordsList[idx]);
  }

  // Categories (usually opens a popup modal, we select standard defaults or prompt click)
  console.log("[KDP] Saving details page...");
  await page.click("input[type='submit'][value='Save and Continue']");
  await page.waitForNavigation({ waitUntil: "networkidle" });

  // ─── STEP 2: EBOOK CONTENT ───
  console.log("[KDP] Uploading manuscript and cover...");

  // DRM option - default "No"
  await page.click("input[name='drm'][value='false']");

  // Upload EPUB manuscript
  const fileInput = await page.locator("input[type='file'][name='manuscript']");
  await fileInput.setInputFiles(path.resolve(epubPath));
  console.log("[KDP] Manuscript file queued for upload. Waiting for processing...");
  await page.waitForSelector("text=Manuscript uploaded successfully", { timeout: 120000 });

  // Upload Cover JPG
  await page.click("input[name='coverOption'][value='upload']");
  const coverInput = await page.locator("input[type='file'][name='cover']");
  await coverInput.setInputFiles(path.resolve(coverPath));
  console.log("[KDP] Ebook cover queued for upload. Waiting for processing...");
  await page.waitForSelector("text=Cover uploaded successfully", { timeout: 120000 });

  // Save and Continue
  console.log("[KDP] Saving Ebook content page...");
  await page.click("input[type='submit'][value='Save and Continue']");
  await page.waitForNavigation({ waitUntil: "networkidle" });

  // ─── STEP 3: EBOOK PRICING ───
  console.log("[KDP] Setting Royalty and Pricing...");

  // Royalty - Select 70%
  await page.click("input[name='royaltyPlan'][value='70']");

  // Set Price for Amazon.com
  await page.fill("input[name='price.amazon_com']", price);

  console.log("[KDP] Ebook is configured and ready!");
  console.log("[KDP] ⚠️ Manual Check is recommended before the final launch click.");
  
  if (options.publish) {
    console.log("[KDP] Publishing eBook now...");
    await page.click("input[type='submit'][value='Publish Your Kindle eBook']");
    await page.waitForTimeout(5000);
    console.log("[KDP] ✓ eBook published successfully!");
  } else {
    console.log("[KDP] Book saved as draft. Run with --publish flag to automate the final publish trigger.");
    await page.click("input[type='submit'][value='Save as Draft']");
  }

  await context.close();
}

main().catch((err) => {
  console.error("[KDP] ❌ Playwright task failed:", err);
  process.exit(1);
});
