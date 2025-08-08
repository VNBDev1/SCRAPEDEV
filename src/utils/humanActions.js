const logger = require('./logger');

class HumanActions {

  static async randomDelay(min = 50, max = 150) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }


  static async typeHumanLike(page, selector, text, options = {}) {
    const {
      minDelay = 20,
      maxDelay = 60,
      clearFirst = true
    } = options;

    logger.debug(`Typing "${text}" into ${selector}`);

    if (clearFirst) {
      await page.click(selector, { clickCount: 3 }); 
      await page.keyboard.press('Backspace');
      await this.randomDelay(100, 200);
    }

    for (let i = 0; i < text.length; i++) {
      await page.type(selector, text[i]);
      await this.randomDelay(minDelay, maxDelay);
    }

    logger.debug(`Finished typing into ${selector}`);
  }

  static async clickHumanLike(page, selector, options = {}) {
    const {
      waitForSelector = true,
      delayBefore = 100,
      delayAfter = 150
    } = options;

    logger.debug(`Clicking on ${selector}`);

    if (waitForSelector) {
      await page.waitForSelector(selector, { timeout: 10000 });
    }

    await this.randomDelay(delayBefore, delayBefore + 50);
    await page.click(selector, {
      delay: Math.random() * 100 + 50 
    });

    await this.randomDelay(delayAfter, delayAfter + 100);

    logger.debug(`Clicked on ${selector}`);
  }

  static async moveMouseHumanLike(page, selector) {
    logger.debug(`Moving mouse to ${selector}`);
    
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.hover(selector);
    await this.randomDelay(50, 150);
  }

  static async scrollHumanLike(page, selector, direction = 'down', distance = 100) {
    logger.debug(`Scrolling ${direction} on ${selector}`);
    
    const scrollOptions = {
      behavior: 'smooth',
      block: direction === 'down' ? 'end' : 'start'
    };

    await page.evaluate((sel, options) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView(options);
      }
    }, selector, scrollOptions);

    await this.randomDelay(200, 400);
  }

  static async waitForPageLoad(page, timeout = 30000) {
    logger.debug('Waiting for page to load');
    
    try {
      await page.waitForLoadState('networkidle', { timeout: timeout / 2 });
      logger.debug('Page loaded successfully (networkidle)');
    } catch (error) {
      logger.warn('Network idle timeout, trying domcontentloaded');
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: timeout / 2 });
        logger.debug('Page loaded successfully (domcontentloaded)');
      } catch (domError) {
        logger.warn('DOM content loaded timeout, continuing anyway');
      }
    }
  }

  static async waitForElementStable(page, selector, timeout = 10000) {
    logger.debug(`Waiting for element ${selector} to be stable`);
    
    await page.waitForSelector(selector, { 
      state: 'visible',
      timeout 
    });

    await this.randomDelay(100, 200);
  }


}

module.exports = HumanActions; 