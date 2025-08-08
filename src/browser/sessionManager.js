const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const SESSION_PATH = path.resolve(__dirname, '../../session.json');

class SessionManager {

  static async saveSession(page) {
    try {
      logger.info('Saving session (cookies and local storage)...');
      const cookies = await page.cookies();
      const localStorageData = await page.evaluate(() => {
        let data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          data[key] = localStorage.getItem(key);
        }
        return data;
      });
      fs.writeFileSync(
        SESSION_PATH,
        JSON.stringify({ cookies, localStorage: localStorageData }, null, 2)
      );
      logger.info('Session saved to session.json');
    } catch (error) {
      logger.warn('Failed to save session:', error.message);
    }
  }

  static async loadSession(page) {
    try {
      if (!fs.existsSync(SESSION_PATH)) return false;
      logger.info('Loading session (cookies and local storage)...');
      const session = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8'));
      if (session.cookies) {
        await page.setCookie(...session.cookies);
      }
      if (session.localStorage) {
        await page.evaluate((data) => {
          for (const key in data) {
            localStorage.setItem(key, data[key]);
          }
        }, session.localStorage);
      }
      logger.info('Session loaded from session.json');
      return true;
    } catch (error) {
      logger.warn('Failed to load session:', error.message);
      return false;
    }
  }

  static deleteSession() {
    try {
      if (fs.existsSync(SESSION_PATH)) {
        fs.unlinkSync(SESSION_PATH);
        logger.info('Session file deleted');
      }
    } catch (error) {
      logger.warn('Failed to delete session file:', error.message);
    }
  }
}

module.exports = SessionManager;