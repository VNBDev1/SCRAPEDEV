# Propelio Login Automation

Automated login script for Propelio Genesis using Puppeteer with enhanced comparable sales extraction.

## Features

- **Automated Login**: Handles login to Propelio Genesis platform
- **Property Search**: Searches for properties by location
- **Enhanced Comparable Sales Extraction**:
  - Applies filters (Prop Type, Sold Within, Distance, Year Built)
  - Clicks on property cards to extract detailed information
  - Extracts property name, price, and gallery images
  - Handles "+XX" overlay clicks to load full image galleries
  - Waits for DOM to fully load before scraping
- **Data Export**: Saves all extracted data to JSON files

## Enhanced Comparable Sales Extraction

The system now includes advanced comparable sales extraction with the following features:

### Filter Application

- **Prop Type**: Filters by property type (default: Single Family)
- **Sold Within**: Filters by sale timeframe (default: 6 Months)
- **Distance**: Filters by distance from subject property (default: 1 Mile)
- **Year Built**: Filters by construction year (default: Any)

### Enhanced Card Processing Flow

The system now follows a complete flow for each property card:

1. **Click on Card**: Opens the property popup
2. **Extract Property Data**:
   - Property name (multiple selector fallbacks)
   - Property price (multiple selector fallbacks)
   - Property details (bedrooms, bathrooms, sqft, year built, etc.)
3. **Click Gallery Button**: Opens the image gallery
4. **Extract Images**:
   - Extracts all image URLs from `<img>` tags with class `chakra-image css-bh4wo8`
   - Handles multiple gallery layouts
5. **Close Gallery**: Uses button with class `chakra-button css-ei8nls`
6. **Close Popup**: Uses button with class `chakra-modal__close-button css-7wxst2`
7. **Move to Next Card**: Repeats the process for each card

### Gallery and Popup Management

- **Gallery Close Button**: `class="chakra-button css-ei8nls"`
- **Popup Close Button**: `class="chakra-modal__close-button css-7wxst2"`
- **Fallback Selectors**: Multiple alternative selectors for robustness
- **Error Handling**: Graceful handling if buttons are not found

### Data Structure

The extracted comparable data is stored in the following JSON structure:

```json
{
  "530 Rolling Hills Rd": {
    "price": "$1,775,000",
    "gallery": {
      "images": ["image1.jpg", "image2.jpg", ...],
      "totalImages": 15
    },
    "extractedAt": "2025-08-06T18:09:01.385Z"
  }
}
```

## Installation

```bash
npm install
```

## Configuration

1. Copy `env.example` to `.env`
2. Fill in your Propelio credentials:
   ```
   PROPELIO_EMAIL=your_email@example.com
   PROPELIO_PASSWORD=your_password
   ```

## Usage

### Start the server

```bash
npm start
```

### API Endpoints

#### Health Check

```bash
GET /health
```

#### Start Automation (includes enhanced comparable extraction)

```bash
GET /scrap?location=Texas
```

#### Get Status

```bash
GET /status
```

#### Get Results

```bash
GET /results
```

### Direct Script Execution

Run the test script to see the enhanced comparable extraction in action:

```bash
node test-comparable.js
```

## Data Output

All extracted data is saved to JSON files in the `property_data/` directory with the following structure:

```json
{
  "location": "9800 Canyon Crest Cir",
  "extractedAt": "2025-08-06T18:09:01.385Z",
  "propertyData": {
    "Years of Ownership": "4 Years",
    "Bedrooms": "4",
    "Full Baths": "3",
    "Living Sqft": "2,677",
    "Year Built": "1986"
  },
  "landInfo": {
    "Subdivision": "Valley Ranch Sec 7"
  },
  "comparableSales": {
    "530 Rolling Hills Rd": {
      "price": "$1,775,000",
      "gallery": {
        "images": ["image1.jpg", "image2.jpg"],
        "totalImages": 2
      },
      "extractedAt": "2025-08-06T18:09:01.385Z"
    }
  }
}
```

## Technical Details

### Enhanced Features

1. **Smart Filter Application**: Automatically applies common filters to refine comparable results
2. **Robust Element Waiting**: Uses custom wait functions to ensure DOM elements are fully loaded
3. **Image Gallery Handling**: Detects and handles "+XX" overlays to load complete image galleries
4. **Error Handling**: Graceful error handling with detailed logging
5. **Human-like Interactions**: Uses random delays and smooth scrolling for natural behavior

### Selector Strategy

The system uses multiple selector strategies to handle different page layouts:

- Primary selectors: `[data-testid="property-card"]`, `.property-card`
- Fallback selectors: `[class*="card"]`, `[class*="ComparableEntryCard"]`
- Image selectors: `img.chakra-image.css-bh4wo8`
- Text selectors: `p.chakra-text.css-1lecq6p`, `p.chakra-text.css-12g6l16`

## Troubleshooting

### Common Issues

1. **Login Failures**: Check credentials in `.env` file
2. **No Cards Found**: The page structure may have changed - check console logs
3. **Filter Application Fails**: Filters may not be available on all pages
4. **Image Extraction Issues**: Network issues or lazy loading may affect image extraction

### Debug Mode

Enable detailed logging by setting the log level in your environment:

```bash
LOG_LEVEL=debug npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
# propelio-script
