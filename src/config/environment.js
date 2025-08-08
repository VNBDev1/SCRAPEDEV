require('dotenv').config();

class EnvironmentConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }

  validateRequiredEnvVars() {
    const required = ['PROPELIO_EMAIL', 'PROPELIO_PASSWORD'];
    const missing = required.filter((key) => !process.env[key]);

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
      // 'new' is recommended for Puppeteer 21+; allow disabling via HEADLESS=false
      headless: process.env.HEADLESS === 'false' ? false : 'new',
      slowMo: parseInt(process.env.SLOW_MO || '0', 10),
      timeout: parseInt(process.env.TIMEOUT || '60000', 10),
      defaultViewport: { width: 1280, height: 720 },
      userDataDir: './puppeteer_profile',
      // Prefer the Chrome bundled in the base image; fallback to env override
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        process.env.CHROME_PATH ||
        '/usr/bin/google-chrome',
      // Critical flags for Cloud Run
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--no-first-run',
        '--disable-extensions',
        '--single-process',
        '--remote-debugging-pipe',
      ],
      // Use pipe transport instead of remote-debugging-port to avoid WS timeout
      pipe: true,
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
