require('dotenv').config();


class EnvironmentConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }


  validateRequiredEnvVars() {
    const required = ['PROPELIO_EMAIL', 'PROPELIO_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }
  }


  get credentials() {
    return {
      email: process.env.PROPELIO_EMAIL,
      password: process.env.PROPELIO_PASSWORD,
    };
  }


  get browserConfig() {
    return {
      headless: false, 
      slowMo: parseInt(process.env.SLOW_MO) || 20,
      timeout: parseInt(process.env.TIMEOUT) || 30000,
      defaultViewport: {
        width: 1280,
        height: 720,
      },
      userDataDir: './puppeteer_profile', 
      executablePath:
        process.env.CHROME_PATH ||
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-web-security',
        '--remote-debugging-port=9222',
      ],
    };
  }


  get logging() {
    return {
      level: process.env.LOG_LEVEL || 'info',
      enabled: process.env.LOG_LEVEL !== 'silent',
    };
  }

  get targetUrl() {
    return 'https://genesis.propelio.com/login';
  }
}

module.exports = new EnvironmentConfig();
