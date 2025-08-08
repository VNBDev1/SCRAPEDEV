const logger = require('../utils/logger');
const HumanActions = require('../utils/humanActions');
const fs = require('fs').promises;
const path = require('path');

/**
 * Search actions for Propelio Genesis
 */
class SearchActions {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to search page and perform search
   */
  async performSearch(location) {
    try {
      logger.step(`Starting search for location: ${location}`);

      // Navigate to search page
      await this.navigateToSearchPage();

      // Find and fill search bar
      await this.fillSearchBar(location);

      // Wait for search results
      await this.waitForSearchResults();

      // Extract property data after search results load
      await this.extractPropertyData(location);

      logger.stepComplete(`Search completed for location: ${location}`);
    } catch (error) {
      logger.stepFailed('Search process', error);
      throw error;
    }
  }

  /**
   * Navigate to the search page
   */
  async navigateToSearchPage() {
    try {
      logger.step('Navigating to search page');

      await this.page.goto('https://genesis.propelio.com/search/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Wait for page to load
      await HumanActions.waitForPageLoad(this.page);

      logger.stepComplete('Navigation to search page');
    } catch (error) {
      logger.stepFailed('Navigate to search page', error);
      throw error;
    }
  }

  /**
   * Find and fill the search bar
   */
  async fillSearchBar(location) {
    try {
      logger.step('Filling search bar');

      // Try multiple selectors for the search input
      const searchSelectors = [
        'input.chakra-input.css-ysqbtp',
        'input[placeholder*="Search for a specific property"]',
        'input.chakra-input',
        'input[type="text"]',
      ];

      let searchSelector = null;
      let input = null;

      // Try each selector until we find the input
      for (const selector of searchSelectors) {
        try {
          await this.page.waitForSelector(selector, {
            timeout: 5000,
            visible: true,
          });
          input = await this.page.$(selector);
          if (input) {
            searchSelector = selector;
            console.log(`✅ Search input found with selector: ${selector}`);
            break;
          }
        } catch (error) {
          logger.debug(`Selector ${selector} not found`);
          continue;
        }
      }

      if (!input) {
        logger.error('❌ Search input not found with any selector!');
        throw new Error('Search input not found!');
      }

      // Log the input's placeholder and value
      const placeholder = await this.page.evaluate(el => el.placeholder, input);
      const value = await this.page.evaluate(el => el.value, input);
      logger.info(
        `✅ Search input found! Placeholder: "${placeholder}", Current value: "${value}"`
      );
      console.log(
        `✅ Search input found! Placeholder: "${placeholder}", Current value: "${value}"`
      );

      await HumanActions.moveMouseHumanLike(this.page, searchSelector);
      await HumanActions.typeHumanLike(this.page, searchSelector, location, {
        minDelay: 10,
        maxDelay: 20,
      });

      await this.page.focus(searchSelector);
      await this.page.keyboard.press('Enter');
      await HumanActions.randomDelay(500, 1000);
    } catch (error) {
      logger.stepFailed('Fill search bar', error);
      throw error;
    }
  }

  /**
   * Wait for search results to load
   */
  async waitForSearchResults() {
    try {
      // Wait for any loading indicators to disappear
      await this.page
        .waitForFunction(
          () => {
            const loadingElements = document.querySelectorAll(
              '[class*="loading"], [class*="spinner"], [class*="loader"]'
            );
            return loadingElements.length === 0;
          },
          { timeout: 10000 }
        )
        .catch(() => {
          logger.warn('No loading indicators found, continuing anyway');
        });

      // Wait for page to stabilize
      await HumanActions.waitForPageLoad(this.page);

      logger.stepComplete('Search results loaded');
    } catch (error) {
      logger.stepFailed('Wait for search results', error);
      throw error;
    }
  }

  async extractPropertyData(location) {
    try {
      // Wait for the property info tab to be available
      await this.page.waitForSelector('[role="tabpanel"]', { timeout: 15000 });

      // Extract data from both Property Info and Land Info tabs
      const propertyInfoData = {};
      const landInfoData = {};

      // First, extract data from Property Info tab (first source)
      logger.info('Extracting data from Property Info tab...');
      console.log('Extracting data from Property Info tab...');

      const propertyInfoDataRaw = await this.page.evaluate(() => {
        const data = {};

        // Find all property info cards
        const cards = document.querySelectorAll('.chakra-card');

        cards.forEach(card => {
          // Look for data pairs (label and value)
          const dataPairs = card.querySelectorAll('.css-o2ldmt');

          dataPairs.forEach(pair => {
            const labelElement = pair.querySelector('.css-10lbh8o');
            const valueElement = pair.querySelector('.css-1b44ksl');

            if (labelElement && valueElement) {
              const label = labelElement.textContent.trim();
              const value = valueElement.textContent.trim();

              if (label && value) {
                data[label] = value;
              }
            }
          });
        });

        return data;
      });

      // Store property info data separately
      Object.assign(propertyInfoData, propertyInfoDataRaw);
      console.log(
        `✅ Property Info data extracted: ${Object.keys(propertyInfoData).length} fields`
      );

      console.log('Clicking on Land Info tab...');

      // Wait for the Land Info tab button to be available and click it
      await this.page.waitForSelector('button[id="land"]', {
        timeout: 10000,
        visible: true,
      });
      await this.page.click('button[id="land"]');

      // Wait for the Land Info tab content to load
      await HumanActions.randomDelay(2000, 3000);

      // Extract ALL data from Land Info tab (second source)
      console.log('Extracting ALL data from Land Info tab...');

      const landInfoDataRaw = await this.page.evaluate(() => {
        const data = {};

        // Find all land info cards
        const cards = document.querySelectorAll('.chakra-card');

        cards.forEach(card => {
          // Look for data pairs (label and value)
          const dataPairs = card.querySelectorAll('.css-o2ldmt');

          dataPairs.forEach(pair => {
            const labelElement = pair.querySelector('.css-10lbh8o');
            const valueElement = pair.querySelector('.css-1b44ksl');

            if (labelElement && valueElement) {
              const label = labelElement.textContent.trim();
              const value = valueElement.textContent.trim();

              if (label && value) {
                data[label] = value;
              }
            }
          });
        });

        return data;
      });

      // Store land info data separately
      Object.assign(landInfoData, landInfoDataRaw);
      console.log(
        `✅ Land Info data extracted: ${Object.keys(landInfoData).length} fields`
      );

      // Check if we have complete data from both sources
      const hasPropertyData = Object.keys(propertyInfoData).length > 0;
      const hasLandData = Object.keys(landInfoData).length > 0;

      console.log(
        `📊 Data Status: Property Info (${Object.keys(propertyInfoData).length} fields), Land Info (${Object.keys(landInfoData).length} fields)`
      );

      if (!hasPropertyData || !hasLandData) {
        console.log(
          'Incomplete data: Missing data from one or both sources'
        );
        console.log(
          `Property Info data: ${hasPropertyData ? 'Available' : 'Missing'}`
        );
        console.log(
          `Land Info data: ${hasLandData ? '✅ Available' : 'Missing'}`
        );
        return;
      }

      console.log(
        '✅ Complete data available from both sources! Proceeding to extract comparable data...'
      );

  
      const comparableDataArray = await this.navigateToCompSales();


      await this.saveAllDataToJson(
        propertyInfoData,
        landInfoData,
        location,
        comparableDataArray
      );

      logger.stepComplete('Property data extraction completed');
    } catch (error) {
      console.log('Error extracting property data:', error.message);
    }
  }

  async navigateToCompSales() {
    try {
      console.log('Navigating to Comp Sales page...');

  
      await this.page.waitForSelector('a[href*="/comps"]', {
        timeout: 30000,
        visible: true,
      });


      await this.page.click('a[href*="/comps"]');
      await HumanActions.randomDelay(4000, 6000);
      await this.waitForPageFullyLoaded();
      console.log('Successfully navigated to Comp Sales page');

      const comparableData = await this.page.evaluate(() => {
        const cardSelector = 'div.css-1r4muzy';
        const propertyCard = document.querySelector(cardSelector);

        if (propertyCard) {
          return {
            cardFound: true,
            cardSelector: cardSelector,
            cardCount: 1,
          };
        } else {
         
          return {
            cardFound: false,
            message: 'No card with class found',
          };
        }
      });

      if (comparableData.cardFound) {
        console.log('Attempting to click card...');

        await this.page.waitForSelector(comparableData.cardSelector, {
          timeout: 10000,
          visible: true,
        });
        const allComparableData = [];

        try {
          await this.page.click(comparableData.cardSelector);
          console.log(`Card clicked successfully!`);

          await HumanActions.randomDelay(3000, 5000);
          const popupExists = await this.page.evaluate(() => {
            const popup = document.querySelector(
              '[role="dialog"], .modal, [class*="modal"], [class*="popup"]'
            );
            return popup !== null;
          });

          if (popupExists) {
            await HumanActions.randomDelay(2000, 3000);
            const comparableProperties = await this.processCards();
            allComparableData.push(...comparableProperties);
          } else {
            console.log('No popup appeared after clicking card');
          }
        } catch (clickError) {
      
          await this.page.$eval(comparableData.cardSelector, el => el.click());
  
        }

        return allComparableData; 
      } else {
      
        return [];
      }
    } catch (error) {
      logger.stepFailed('Navigate to Comp Sales', error);
      console.log('Error navigating to Comp Sales:', error.message);
      return [];
    }
  }

  async waitForPageFullyLoaded() {
    try {
      await HumanActions.randomDelay(5000, 10000); 


    } catch (error) {
      console.log('Error waiting for page to load:', error.message);
  
    }
  }




  async processCards() {
    const allComparableProperties = [];
  
  
    const totalPages = await this.page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button.css-19tveih')];
      const lastButton = buttons[buttons.length - 1];
      return lastButton ? parseInt(lastButton.textContent.trim()) : 1;
    });
  
    let currentPageNum = 2;
  
    while (currentPageNum <= totalPages) {
      console.log(`Processing page ${currentPageNum}...`);
  
      await this.page.evaluate((pageNum) => {
        const btn = [...document.querySelectorAll('button.css-19tveih')]
          .find(b => b.textContent.trim() === String(pageNum));
        if (btn) btn.click();
      }, currentPageNum);
  
      await this.page.waitForSelector('.css-55rv9h', { timeout: 10000 });
      await HumanActions.randomDelay(2000, 3000);
  
      const currentPropertyData = await this.extractPropertyInfoFromCurrentSlide();
  
      const currentLocation = await this.page.evaluate(() => {
        const locationElement = document.querySelector('p.chakra-text.css-1h9zzih');
        return locationElement ? locationElement.textContent.trim() : 'Unknown Location';
      });
  
      await HumanActions.randomDelay(2000, 3000);
  
      await this.clickGalleryButton();
      await HumanActions.randomDelay(2000, 3000);
  
      const galleryImages = await this.extractGalleryImages();
      await HumanActions.randomDelay(2000, 3000);
  
      await this.closeGallery();
      await HumanActions.randomDelay(2000, 3000);
  
      allComparableProperties.push({
        page: currentPageNum,
        propertyInfo: {
          ...currentPropertyData,
          location: currentLocation,
        },
        gallery: {
          allImages: galleryImages,
        },
      });
 
      if (currentPageNum < totalPages) {
        const hasNext = await this.page.$('button.next:not([disabled])');
        if (hasNext) {
          await this.page.click('button.next');
          await HumanActions.randomDelay(2000, 3000);
        }
      }
  
      currentPageNum++;
    }
  
    return allComparableProperties;
  }
  

  async clickGalleryButton() {
    try {
      await this.page.waitForSelector('.css-1yeo1ts', { timeout: 15000 });
      await this.page.click('.css-1yeo1ts');

      await HumanActions.randomDelay(2000, 3000);
      await this.extractGalleryImages();
    } catch (error) {
      return false;
    }
  }
  

  async waitForSliderToLoad() {
    try {
      console.log('⏳ Waiting for slider to load...');

      // Wait for the loading spinner to disappear
      await this.page.waitForFunction(
        () => {
          const spinner = document.querySelector(
            'div.chakra-spinner.css-1jyuc43'
          );
          return spinner === null;
        },
        { timeout: 15000 }
      );

      console.log('✅ Loading spinner disappeared');

      // Wait for actual images to appear in the slider
      await this.page.waitForFunction(
        () => {
          const images = document.querySelectorAll(
            'img[src*="api.propelio.com"], img[src*="mls-media"]'
          );
          return images.length > 0;
        },
        { timeout: 15000 }
      );

      console.log('✅ Slider images loaded');

      // Additional wait to ensure slider is fully functional
      await HumanActions.randomDelay(1000, 2000);
    } catch (error) {
      console.log('⚠️ Error waiting for slider to load:', error.message);
      // Continue anyway, the extraction will handle missing images
    }
  }

  async extractGalleryImages() {
    try {
 
      await this.page.waitForSelector('.chakra-portal .swiper-wrapper img', {
        timeout: 15000,
      });
  
      const imageUrls = await this.page.evaluate(() => {
        const images = document.querySelectorAll(
          '.chakra-portal .chakra-stack.css-nh7bkn .swiper-wrapper .swiper-slide:not(.swiper-slide-duplicate) img'
        );
      
        const urls = [...images]
          .map(img => img.src)
          .filter(src => !!src && !src.startsWith('data:image/svg+xml'));
      
        return [...new Set(urls)];
      });
      
      
  
      console.log(`✅ Extracted ${imageUrls.length} image URLs`);
   
      
  
      return imageUrls;
    } catch (error) {
      console.log('❌ Error extracting image URLs:', error.message);
      return [];
    }
  }
  

  async closeGallery() {
    try {
      console.log('🔍 Looking for close button in full-screen image modal...');

      // Wait a bit for the image modal to be fully loaded
      await HumanActions.randomDelay(1000, 2000);

      // Look for close button and click it
      const closeButton = await this.page.$('.css-ei8nls');
      if (closeButton) {
        await closeButton.click();
        console.log('✅ Successfully closed full-screen image modal');
        // Wait additional time for the modal to fully close
        await HumanActions.randomDelay(1000, 2000);
        return true;
      } else {
        console.log('❌ Close button not found');
        return false;
      }
    } catch (error) {
      console.log('❌ Error closing full-screen image modal:', error.message);
      return false;
    }
  }

  async extractPropertyInfoFromCurrentSlide() {
    try {
      console.log('🔍 Extracting property info from current slide...');

      const propertyInfo = await this.page.evaluate(() => {
        const getText = selector => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };

        const getRowValue = labelText => {
          const rows = Array.from(document.querySelectorAll('.comp-stat-row'));
          const row = rows.find(r => {
            const label = r.querySelector('.row-label');
            return label?.textContent.trim() === labelText;
          });
          return row
            ? row.querySelector('.row-value')?.textContent.trim()
            : '--';
        };


        const statusElement = document.querySelector(
          '.css-13qnkqp p, .css-9re8mq'
        );
        const status = statusElement ? statusElement.textContent.trim() : '';

        return {
          // Address Information
          location: getText('.address p.css-1h9zzih'),
          subdivision: getText('.address p.subdivision'),
          data: getText('.css-nc73jn'),

          // Status Information
          Status: status,

      

          // Pricing Information
          'List Price': getRowValue('List Price'),
          'List Price SqFt': getRowValue('List Price SqFt'),
          'Sales Price': getRowValue('Sales Price'),
          'Sales Price SqFt': getRowValue('Sales Price SqFt'),

          // Timeline Information
          'Contract Date': getRowValue('Contract Date'),
          'Sold Date': getRowValue('Sold Date'),
          'Days on Market': getRowValue('Days on Market'),

          // Property Details
          Subdivision: getRowValue('Subdivision'),
          'Year Built': getRowValue('Year Built'),
          'Approx. Acres': getRowValue('Approx. Acres'),
          'Lot SqFt': getRowValue('Lot SqFt'),
          Type: getRowValue('Type'),

          // Room Information
          Bedrooms: getRowValue('Bedrooms'),
          'Full Baths': getRowValue('Full Baths'),
          'Half Baths': getRowValue('Half Baths'),

          // System Information
          ExtractionTimestamp: new Date().toISOString(),
        };
      });

      console.log('✅ Extracted property info:', propertyInfo);
      return propertyInfo;
    } catch (error) {
      console.error('❌ Error extracting property info:', error);
      return {
        // Address Information
        location: '',
        subdivision: '',
        data: '',

        // Status Information
        Status: '',

        // Pricing Information
        'List Price': '',
        'List Price SqFt': '',
        'Sales Price': '',
        'Sales Price SqFt': '',

        // Timeline Information
        'Contract Date': '',
        'Sold Date': '',
        'Days on Market': '',

        // Property Details
        Subdivision: '',
        'Year Built': '',
        'Approx. Acres': '',
        'Lot SqFt': '',
        Type: '',

        // Room Information
        Bedrooms: '',
        'Full Baths': '',
        'Half Baths': '',

        // System Information
        ExtractionTimestamp: new Date().toISOString(),
      };
    }
  }

  async saveAllDataToJson(
    propertyInfoData,
    landInfoData,
    location,
    comparableDataArray
  ) {
    try {
      const dataDir = path.join(process.cwd(), 'property_data');
      await fs.mkdir(dataDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `property_data_${location.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.json`;
      const filepath = path.join(dataDir, filename);

      const dataToSave = {
        location: location,
        extractedAt: new Date().toISOString(),
        propertyData: propertyInfoData,
        landInfo: landInfoData,
        comparableSales: comparableDataArray || [], 
        summary: {
          totalFields:
            Object.keys(propertyInfoData).length +
            Object.keys(landInfoData).length,
          propertyInfoFields: Object.keys(propertyInfoData).length,
          landInfoFields: Object.keys(landInfoData).length,
          comparablePropertiesCount: comparableDataArray
            ? comparableDataArray.length
            : 0,
          hasCompleteData:
            Object.keys(propertyInfoData).length > 0 &&
            Object.keys(landInfoData).length > 0,
        },
      };

      await fs.writeFile(filepath, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to save data to JSON:', error);
    }
  }
}

module.exports = SearchActions;
