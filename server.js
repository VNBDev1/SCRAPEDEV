const express = require('express');
const cors = require('cors');
// const PropelioLoginAutomation = require('./src/index'); // DELETED: lazy-load inside runAutomation
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global variable to track automation status
let automationStatus = {
  isRunning: false,
  currentJob: null,
  results: []
};

/**
 * Root endpoint (quick readiness probe)
 */
app.get('/', (_req, res) => res.status(200).send('service up'));

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    automation: {
      isRunning: automationStatus.isRunning,
      currentJob: automationStatus.currentJob
    }
  });
});

/**
 * Main scraping endpoint
 */
app.get('/scrap', async (req, res) => {
  const { location } = req.query;
  
  if (!location) {
    return res.status(400).json({
      success: false,
      error: 'Location parameter is required. Use /scrap?location=Texas'
    });
  }

  if (automationStatus.isRunning) {
    return res.status(409).json({
      success: false,
      error: 'Automation is already running. Please wait for completion.',
      currentJob: automationStatus.currentJob
    });
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  automationStatus.isRunning = true;
  automationStatus.currentJob = {
    id: jobId,
    location: location,
    startedAt: new Date().toISOString(),
    status: 'starting'
  };

  res.json({
    success: true,
    message: 'Automation started successfully',
    jobId: jobId,
    location: location,
    status: 'running'
  });

  runAutomation(jobId, location);
});

/**
 * Get automation status
 */
app.get('/status', (req, res) => {
  res.json({
    automation: automationStatus,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get results
 */
app.get('/results', (req, res) => {
  res.json({
    results: automationStatus.results,
    count: automationStatus.results.length,
    timestamp: new Date().toISOString()
  });
});

/**
 * Clear results
 */
app.delete('/results', (req, res) => {
  automationStatus.results = [];
  res.json({
    success: true,
    message: 'Results cleared successfully'
  });
});

/**
 * Run the automation
 */
async function runAutomation(jobId, location) {
  try {
    // Lazy-load to avoid heavy work before the server starts
    const PropelioLoginAutomation = require('./src/index');

    logger.info(`🚀 Starting automation for job ${jobId} with location: ${location}`);
    
    automationStatus.currentJob.status = 'running';
    
    const automation = new PropelioLoginAutomation();
    
    await automation.initialize();
    
    const loginSuccess = await automation.performLogin();
    
    let searchSuccess = false;
    let comparableData = {};
    
    if (loginSuccess) {
      searchSuccess = await automation.performSearch(location);
      if (searchSuccess) {
        try {
          logger.info('🔍 Extracting enhanced comparable sales data...');
          comparableData = await automation.searchActions.navigateToCompSales();
          logger.info('✅ Enhanced comparable sales extraction completed');
          console.log('✅ Enhanced comparable sales data:', comparableData);
        } catch (error) {
          logger.error('❌ Enhanced comparable extraction failed:', error.message);
          console.log('❌ Enhanced comparable extraction failed:', error.message);
          comparableData = {};
        }
      }
    }
    
    const result = {
      jobId: jobId,
      location: location,
      loginSuccess: loginSuccess,
      searchSuccess: searchSuccess,
      comparableExtractionSuccess: Object.keys(comparableData).length > 0,
      comparableData: comparableData,
      overallSuccess: loginSuccess && searchSuccess,
      completedAt: new Date().toISOString(),
      duration: Date.now() - new Date(automationStatus.currentJob.startedAt).getTime()
    };
    
    automationStatus.results.push(result);
    
    automationStatus.isRunning = false;
    automationStatus.currentJob = {
      ...automationStatus.currentJob,
      status: 'completed',
      completedAt: new Date().toISOString(),
      loginSuccess: loginSuccess,
      searchSuccess: searchSuccess,
      comparableExtractionSuccess: Object.keys(comparableData).length > 0,
      overallSuccess: loginSuccess && searchSuccess
    };
    
    logger.info(`✅ Automation completed for job ${jobId}. Login: ${loginSuccess}, Search: ${searchSuccess}, Comparable: ${Object.keys(comparableData).length > 0}`);
    
  } catch (error) {
    logger.error(`❌ Automation failed for job ${jobId}:`, error);
    
    automationStatus.isRunning = false;
    automationStatus.currentJob = {
      ...automationStatus.currentJob,
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: error.message
    };
    
    automationStatus.results.push({
      jobId: jobId,
      location: location,
      loginSuccess: false,
      searchSuccess: false,
      comparableExtractionSuccess: false,
      comparableData: {},
      overallSuccess: false,
      error: error.message,
      completedAt: new Date().toISOString(),
      duration: Date.now() - new Date(automationStatus.currentJob.startedAt).getTime()
    });
  }
}

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET / - Root',
      'GET /health - Health check',
      'GET /scrap?location=Texas - Start automation (includes enhanced comparable extraction)',
      'GET /status - Get automation status',
      'GET /results - Get automation results',
      'DELETE /results - Clear results'
    ]
  });
});

/**
 * Start server (bind to 0.0.0.0 for Cloud Run)
 */
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Express server running on http://0.0.0.0:${PORT}`);
  logger.info(`📡 Available endpoints:`);
  logger.info(`   GET  /           - Root`);
  logger.info(`   GET  /health     - Health check`);
  logger.info(`   GET  /scrap?location=Texas - Start automation`);
  logger.info(`   GET  /status     - Get automation status`);
  logger.info(`   GET  /results    - Get automation results`);
  logger.info(`   DELETE /results  - Clear results`);
});

module.exports = app;
