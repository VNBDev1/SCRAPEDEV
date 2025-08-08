const logger = require('../utils/logger');
const HumanActions = require('../utils/humanActions');


class LoginActions {
  constructor(page) {
    this.page = page;
  }

  async performLogin(email, password) {
    try {
      logger.step('Starting login process');

      await HumanActions.waitForPageLoad(this.page);
      const currentUrl = this.page.url();

      if (!currentUrl.includes('/login')) {
        return true;
      }

      await this.fillEmailField(email);

      await this.fillPasswordField(password);

      await this.clickLoginButton();
      await this.waitForLoginCompletion();

      logger.stepComplete('Login process completed successfully');
    } catch (error) {
      logger.stepFailed('Login process', error);
      throw error;
    }
  }


  async fillEmailField(email) {
    try {
      logger.step('Filling email field');


      const currentUrl = this.page.url();
      await this.page.waitForTimeout(2000);

      const pageTitle = await this.page.title();
      logger.info(`Page title: ${pageTitle}`);
      console.log(`Page title: ${pageTitle}`);

      if (
        currentUrl.includes('/search') ||
        pageTitle.toLowerCase().includes('search')
      ) {
        logger.info('Detected search page, navigating to login...');
        console.log('Detected search page, navigating to login...');
        await this.page.goto('https://genesis.propelio.com/login', {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await this.page.waitForTimeout(2000);
      }
      const allInputs = await this.page.$$('input');
      logger.info(`Found ${allInputs.length} input fields on the page`);
      console.log(`Found ${allInputs.length} input fields on the page`);

      const inputDetails = await Promise.all(
        allInputs.map(async (input, index) => {
          const placeholder = await input.evaluate(el =>
            el.getAttribute('placeholder')
          );
          const type = await input.evaluate(el => el.getAttribute('type'));
          const id = await input.evaluate(el => el.getAttribute('id'));
          const name = await input.evaluate(el => el.getAttribute('name'));
          const className = await input.evaluate(el =>
            el.getAttribute('class')
          );
          return { index, placeholder, type, id, name, className };
        })
      );

      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="Email" i]',
        'input[placeholder*="Enter your email" i]',
        'input[placeholder*="Email address" i]',
      ];

      let emailField = null;
      for (const selector of emailSelectors) {
        try {
          await this.page.waitForSelector(selector, {
            timeout: 3000,
            visible: true,
          });
          emailField = selector;
          logger.info(`✅ Email field found with selector: ${selector}`);
          console.log(`✅ Email field found with selector: ${selector}`);
          break;
        } catch (error) {
          logger.debug(`Email selector ${selector} not found`);
          continue;
        }
      }

      if (!emailField) {
        for (const inputDetail of inputDetails) {
          if (
            inputDetail.placeholder &&
            (inputDetail.placeholder.toLowerCase().includes('email') ||
              inputDetail.placeholder.toLowerCase().includes('e-mail'))
          ) {
            const dynamicSelector = `input[placeholder="${inputDetail.placeholder}"]`;
            try {
              await this.page.waitForSelector(dynamicSelector, {
                timeout: 3000,
                visible: true,
              });
              emailField = dynamicSelector;
          
              break;
            } catch (error) {
              continue;
            }
          }
        }
      }

      if (!emailField) {
        throw new Error('Email field not found on the page');
      }

      await HumanActions.moveMouseHumanLike(this.page, emailField);
      await HumanActions.typeHumanLike(this.page, emailField, email, {
        minDelay: 15,
        maxDelay: 80,
      });

      logger.stepComplete('Email field filled');
    } catch (error) {
      logger.stepFailed('Fill email field', error);
      throw error;
    }
  }

  async fillPasswordField(password) {
    try {
      logger.step('Filling password field');
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[id*="password"]',
        'input[placeholder*="password" i]',
        'input[placeholder*="Password" i]',
      ];

      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          passwordField = selector;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!passwordField) {
        throw new Error('Password field not found on the page');
      }
      await HumanActions.moveMouseHumanLike(this.page, passwordField);
      await HumanActions.typeHumanLike(this.page, passwordField, password, {
        minDelay: 15,
        maxDelay: 80,
      });

      logger.stepComplete('Password field filled');
    } catch (error) {
      logger.stepFailed('Fill password field', error);
      throw error;
    }
  }

  async clickLoginButton() {
    try {
      const loginButtonSelectors = [
        'button[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign In")',
        'input[type="submit"]',
        'button[id*="login"]',
        'button[class*="login"]',
        'a[href*="login"]',
        '.login-button',
        '#login-button',
      ];

      let loginButton = null;
      for (const selector of loginButtonSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          loginButton = selector;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!loginButton) {
        try {
          loginButton = await this.page.$x(
            "//button[contains(text(), 'Login') or contains(text(), 'Sign In') or contains(text(), 'Log in')]"
          );
          if (loginButton.length > 0) {
            loginButton = loginButton[0];
          } else {
            throw new Error('Login button not found');
          }
        } catch (error) {
          throw new Error('Login button not found on the page');
        }
      }
      await HumanActions.moveMouseHumanLike(this.page, loginButton);
      await HumanActions.clickHumanLike(this.page, loginButton, {
        delayBefore: 150,
        delayAfter: 200,
      });

      logger.stepComplete('Login button clicked');
    } catch (error) {
      logger.stepFailed('Click login button', error);
      throw error;
    }
  }

  async waitForLoginCompletion() {
    try {
      await this.page.waitForFunction(
        () => {
          return window.location.href !== 'https://genesis.propelio.com/login';
        },
        { timeout: 30000 }
      );
      await HumanActions.waitForPageLoad(this.page);

      logger.stepComplete('Login completed successfully');
    } catch (error) {
      logger.stepFailed('Wait for login completion', error);
      throw error;
    }
  }

  async isLoginSuccessful() {
    try {
      const currentUrl = this.page.url();
      const isOnLoginPage = currentUrl.includes('/login');

      if (isOnLoginPage) {
        // Check for error messages
        const errorSelectors = [
          '.error',
          '.alert-danger',
          '[data-testid="error"]',
          '.login-error',
        ];

        for (const selector of errorSelectors) {
          try {
            const errorElement = await this.page.$(selector);
            if (errorElement) {
              const errorText = await errorElement.textContent();
              logger.error(`Login failed: ${errorText}`);
              return false;
            }
          } catch (error) {
     
          }
        }
      }

      return !isOnLoginPage;
    } catch (error) {
      logger.error('Error checking login status:', error);
      return false;
    }
  }
}

module.exports = LoginActions;
