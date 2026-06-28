import { chromium } from "playwright";
import { logger } from "./logger.js";
import fs from "fs";
import path from "path";

export interface KdpPublishJob {
  title: string;
  subtitle: string;
  author: string;
  description: string;
  keywords: string[];
  epubPath: string;
  coverPath: string;
  isDraft: boolean;
}

/**
 * Automates Amazon KDP Publishing using Playwright.
 * Note: Amazon has strict bot detection. This script uses a persistent user profile 
 * so cookies are retained. The user MUST log in manually once.
 */
export async function runKdpPublisher(job: KdpPublishJob, profilePath: string): Promise<string> {
  logger.info({ title: job.title }, "🚀 Starting Automated KDP Publishing Pipeline...");

  // Verify files exist
  if (!fs.existsSync(job.epubPath)) throw new Error(`EPUB not found: ${job.epubPath}`);
  if (!fs.existsSync(job.coverPath)) throw new Error(`Cover not found: ${job.coverPath}`);

  // Launch Chrome with a persistent context to bypass initial login barriers after the first run
  const browser = await chromium.launchPersistentContext(profilePath, {
    headless: false, // Must be false or Amazon will block it instantly
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();

  try {
    // 1. Navigate to KDP
    await page.goto("https://kdp.amazon.com/en_US/bookshelf", { waitUntil: "networkidle" });
    
    // Check if we need to log in
    if (page.url().includes("signin")) {
      logger.warn("⚠️ KDP Login Required! Please log in manually in the opened browser window. The script will wait...");
      // Wait for the user to log in and reach the bookshelf
      await page.waitForURL("**/bookshelf**", { timeout: 300000 }); // 5 minutes timeout
      logger.info("✅ Login successful! Resuming automation...");
    }

    // 2. Click "Create" -> "Kindle eBook"
    logger.info("Navigating to Title Creation...");
    await page.click('button:has-text("Create")'); // The big create button
    await page.waitForSelector('text="Kindle eBook"');
    await page.click('button:has-text("Create eBook")'); // Create eBook button

    // 3. Fill Metadata (Page 1: Details)
    logger.info("Filling Book Metadata...");
    await page.waitForSelector('input[name="bookTitle"]');
    await page.fill('input[name="bookTitle"]', job.title);
    
    if (job.subtitle) {
      await page.fill('input[name="bookSubtitle"]', job.subtitle);
    }
    
    // Author Name
    const authorParts = job.author.split(" ");
    if (authorParts.length > 0) {
      await page.fill('input[name="authorPrimaryContributor.primaryContributor.authorFirstName"]', authorParts[0]);
      if (authorParts.length > 1) {
        await page.fill('input[name="authorPrimaryContributor.primaryContributor.authorLastName"]', authorParts.slice(1).join(" "));
      }
    }

    // Description
    // KDP description uses an iframe or a specific textarea, handling gracefully
    await page.fill('textarea[name="bookDescription"]', job.description);

    // Publishing Rights (I own the copyright)
    await page.check('input[name="publishingRights.isPublicDomain"][value="false"]');

    // Keywords
    logger.info("Filling Keywords...");
    for (let i = 0; i < Math.min(job.keywords.length, 7); i++) {
      await page.fill(`input[name="keywords[${i}]"]`, job.keywords[i]);
    }

    // Save and Continue to Content
    logger.info("Saving metadata and proceeding to Content Upload...");
    await page.click('button:has-text("Save and Continue")');
    await page.waitForNavigation({ waitUntil: "networkidle" });

    // 4. Upload Content (Page 2)
    logger.info("Uploading EPUB Manuscript...");
    await page.check('input[name="drmOptions.isDrmEnabled"][value="false"]'); // No DRM

    // Upload manuscript (Using file chooser)
    const [manuscriptChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Upload eBook manuscript")')
    ]);
    await manuscriptChooser.setFiles(job.epubPath);

    // Wait for Amazon's processing to complete (this takes a while)
    logger.info("Waiting for Amazon to process the manuscript...");
    await page.waitForSelector('text="Manuscript uploaded successfully"', { timeout: 300000 });

    logger.info("Uploading Cover Image...");
    await page.click('input[name="coverDesignOptions.isUsingKdpCoverCreator"][value="false"]');
    const [coverChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Upload your cover file")')
    ]);
    await coverChooser.setFiles(job.coverPath);
    await page.waitForSelector('text="Cover uploaded successfully"', { timeout: 120000 });

    // Skip AI disclaimer if present (New Amazon policy)
    const hasAiCheck = await page.$('input[name="aiContentOptions.isAiGenerated"]');
    if (hasAiCheck) {
      await page.check('input[name="aiContentOptions.isAiGenerated"][value="true"]');
      // They ask for details, select generated
      await page.selectOption('select[name="aiContentOptions.textCategory"]', { label: "Generated" });
      await page.selectOption('select[name="aiContentOptions.imageCategory"]', { label: "Generated" });
    }

    logger.info("Saving content and proceeding to Pricing...");
    await page.click('button:has-text("Save and Continue")');
    await page.waitForNavigation({ waitUntil: "networkidle" });

    // 5. Pricing and Publishing (Page 3)
    logger.info("Setting Pricing Options...");
    await page.check('input[name="kdpSelectOptions.isEnrolled"][value="true"]'); // Enroll in KDP Select
    await page.check('input[name="territoryOptions.hasWorldwideRights"][value="true"]'); // Worldwide
    await page.check('input[name="royaltyOptions.royaltyPlan"][value="70"]'); // 70% royalty
    
    // Set price to $2.99
    await page.fill('input[name="marketplacePrices.amazonDotCom.listPrice"]', "2.99");

    if (job.isDraft) {
      logger.info("Saving as Draft...");
      await page.click('button:has-text("Save as Draft")');
      await page.waitForSelector('text="Draft saved"');
    } else {
      logger.info("🚀 Publishing eBook...");
      await page.click('button:has-text("Publish Your Kindle eBook")');
      await page.waitForSelector('text="Congratulations"', { timeout: 120000 });
    }

    logger.info("🎉 KDP Publishing Pipeline completed successfully!");
    return "SUCCESS";

  } catch (error: any) {
    logger.error({ error: error.message }, "❌ KDP Publishing failed");
    throw error;
  } finally {
    // Keep browser open slightly longer so user can see it
    await page.waitForTimeout(5000);
    await browser.close();
  }
}
