const puppeteer = require('puppeteer');
const config = require('../config/environment');
const logger = require('../utils/logger');


class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async launch() {
    try {
      logger.step('Launching browser');


      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Users/apple/.cache/puppeteer/chrome/mac-121.0.6167.85/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        undefined, 
      ];

      let browser = null;
      let lastError = null;

      for (const chromePath of chromePaths) {
        try {
          logger.info(`Trying Chrome path: ${chromePath || 'auto-detect'}`);

          const launchOptions = {
            ...config.browserConfig,
            executablePath: chromePath,
            protocolTimeout: 60000,
            dumpio: true, // Enable debug output
          };

          browser = await puppeteer.launch(launchOptions);
          logger.info(
            `✅ Browser launched successfully with path: ${chromePath || 'auto-detect'}`
          );
          break;
        } catch (error) {
          lastError = error;
          logger.warn(
            `❌ Failed to launch with path ${chromePath || 'auto-detect'}: ${error.message}`
          );
          continue;
        }
      }

      if (!browser) {
        throw new Error(
          `Failed to launch browser with any Chrome path. Last error: ${lastError?.message}`
        );
      }

      this.browser = browser;
      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(config.browserConfig.timeout);
      await this.page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      );
      await this.page.setViewport(config.browserConfig.defaultViewport);
      await this.page.setRequestInterception(true);
      this.page.on('request', req => {
        const resourceType = req.resourceType();
        if (['image', 'font'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });
      logger.stepComplete('Browser launched successfully');
      return this.page;
    } catch (error) {
      logger.stepFailed('Browser launch', error);
      throw error;
    }
  }

  async navigateTo(url) {
    try {
      logger.step(`Navigating to ${url}`);
      // Try with networkidle2 first
      try {
        await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: config.browserConfig.timeout,
        });
      } catch (timeoutError) {
        logger.warn('Network idle timeout, trying with domcontentloaded');
  
        await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: config.browserConfig.timeout,
        });
      }
      logger.stepComplete(`Navigation to ${url}`);
    } catch (error) {
      logger.stepFailed(`Navigation to ${url}`, error);
      throw error;
    }
  }

  getPage() {
    if (!this.page) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return this.page;
  }

  getBrowser() {
    if (!this.browser) {
      throw new Error('Browser not launched. Call launch() first.');
    }
    return this.browser;
  }

  async close() {
    try {
      logger.step('Closing browser');
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        logger.stepComplete('Browser closed');
      }
    } catch (error) {
      logger.stepFailed('Browser close', error);
      throw error;
    }
  }

  isRunning() {
    return this.browser !== null && this.browser.isConnected();
  }

  async restart() {
    logger.step('Restarting browser');
    await this.close();
    await this.launch();
    logger.stepComplete('Browser restarted');
  }
}

module.exports = BrowserManager;
