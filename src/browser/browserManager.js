const puppeteer = require('puppeteer');
const config = require('../config/environment');
const logger = require('../utils/logger');

class BrowserManager {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  // Allow optional overrides from callers; merge with environment defaults
  async launch(overrideOptions = {}) {
    try {
      logger.step('Launching browser');

      const base = config.browserConfig;

      // Merge options, concatenate args, prefer explicit overrides
      let launchOptions = {
        ...base,
        ...overrideOptions,
        args: [...(base.args || []), ...(overrideOptions.args || [])],
        executablePath:
          overrideOptions.executablePath ?? base.executablePath,
        headless: overrideOptions.headless ?? base.headless,
        protocolTimeout: overrideOptions.protocolTimeout ?? 90000,
        dumpio: true,
      };

      // If using pipe transport, remove any conflicting remote-debugging-port arg
      if (launchOptions.pipe) {
        launchOptions.args = (launchOptions.args || []).filter(
          (a) => !String(a).startsWith('--remote-debugging-port')
        );
        if (!launchOptions.args.includes('--remote-debugging-pipe')) {
          launchOptions.args.push('--remote-debugging-pipe');
        }
      }

      this.browser = await puppeteer.launch(launchOptions);
      logger.info(
        `✅ Browser launched with path: ${launchOptions.executablePath || 'auto-detect'}`
      );

      this.page = await this.browser.newPage();
      this.page.setDefaultTimeout(base.timeout);

      await this.page.setUserAgent(
        // Generic UA; avoids headless detection issues
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      );
      await this.page.setViewport(base.defaultViewport);

      // Light network optimization (optional)
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        const type = req.resourceType();
        if (['font'].includes(type)) {
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
    if (!this.page) throw new Error('Browser not launched. Call launch() first.');
    return this.page;
    }

  getBrowser() {
    if (!this.browser) throw new Error('Browser not launched. Call launch() first.');
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
