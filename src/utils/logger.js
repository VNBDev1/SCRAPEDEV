const config = require('../config/environment');


class Logger {
  constructor() {
    this.enabled = config.logging.enabled;
    this.level = config.logging.level;
  }


  info(message, ...args) {
    if (this.enabled && this.shouldLog('info')) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }


  warn(message, ...args) {
    if (this.enabled && this.shouldLog('warn')) {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

 
  error(message, ...args) {
    if (this.enabled && this.shouldLog('error')) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }


  debug(message, ...args) {
    if (this.enabled && this.shouldLog('debug')) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }


  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    return levels[level] <= levels[this.level];
  }

 
  step(stepName) {
    this.info(`🔄 Starting step: ${stepName}`);
  }


  stepComplete(stepName) {
    this.info(`✅ Completed step: ${stepName}`);
  }

 
  stepFailed(stepName, error) {
    this.error(`❌ Failed step: ${stepName}`, error);
  }
}

module.exports = new Logger(); 