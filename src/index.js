const BrowserManager = require('./browser/browserManager');
const LoginActions = require('./actions/loginActions');
const SearchActions = require('./actions/searchActions');
const SessionManager = require('./browser/sessionManager');
const config = require('./config/environment');
const logger = require('./utils/logger');

class PropelioLoginAutomation {
  constructor() {
    this.browserManager = new BrowserManager();
    this.loginActions = null;
    this.searchActions = null;
    this.sessionLoaded = false;
    this.sessionReused = false;
  }

  async initialize() {
    try {
      logger.info('🚀 Starting Propelio Genesis Login Automation');

      // Pass Cloud Run–friendly flags; if BrowserManager.launch ignores options, this is harmless.
      const page = await this.browserManager.launch({
        headless: process.env.HEADLESS || 'new', // or true
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote'
        ]
      });

      this.loginActions = new LoginActions(page);
      this.searchActions = new SearchActions(page);

      this.sessionLoaded = await SessionManager.loadSession(page);
      logger.info('✅ Automation initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize automation:', error);
      throw error;
    }
  }

  async performLogin() {
    try {
      const { email, password } = config.credentials;
      const sessionData = await SessionManager.loadSession();
      if (sessionData) {
        await SessionManager.restoreSession(this.browserManager.getPage(), sessionData);

        await this.browserManager.navigateTo(config.targetUrl);
        const currentUrl = this.browserManager.getPage().url();
        
        if (!currentUrl.includes('/login')) {
          this.sessionReused = true;
          return true;
        }

        const isLoggedIn = await this.loginActions.isLoginSuccessful();
        if (isLoggedIn) {
          console.log('Session persisted! Login form not needed.');
          this.sessionReused = true;
          return true;
        } else {
          console.log('Session invalid, proceeding with fresh login.');
        }
      }

      await this.browserManager.navigateTo(config.targetUrl);
      await this.loginActions.performLogin(email, password);

      const isSuccessful = await this.loginActions.isLoginSuccessful();

      if (isSuccessful) {
        logger.info('Login successful! Saving session...');
        await SessionManager.saveSession(this.browserManager.getPage());
        this.sessionReused = false;
        return true;
      } else {
        return false;
      }

    } catch (error) {
      logger.error('Login process failed:', error);
      throw error;
    }
  }

  async performSearch(location) {
    try {
      if (this.sessionReused) {
        // no-op placeholder
      }
      await this.searchActions.performSearch(location);
      // NOTE: keep behavior unchanged (no explicit return to avoid breaking existing server.js logic)
    } catch (error) {
      logger.error(`Search process failed for location: ${location}:`, error);
      throw error;
    }
  }

  async run(location) {
    try {
      await this.initialize();
      const loginSuccess = await this.performLogin();
      let searchSuccess = false;
      if (loginSuccess && location) {
        searchSuccess = await this.performSearch(location);
      }
      await this.cleanup();
      return { loginSuccess, searchSuccess, overallSuccess: loginSuccess && searchSuccess };
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  async cleanup() {
    try {
      logger.info('Cleaning up resources...');
      await this.browserManager.close();
      logger.info('Cleanup completed');
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }

  async shutdown() {
    logger.info('Shutting down automation...');
    await this.cleanup();
    process.exit(0);
  }
}

module.exports = PropelioLoginAutomation;
