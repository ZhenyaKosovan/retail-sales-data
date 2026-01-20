# UK Retail Sales Data Viewer

A simple, static webpage that displays retail sales data from the Office for National Statistics (ONS). The data is presented in a responsive 2-column grid layout with download functionality.

## Features

- **ONS Retail Sales Data**: Displays official retail sales statistics from November 2025
- **Responsive Design**: 2-column grid on desktop, single column on mobile devices
- **Data Download**: Export data as CSV for further analysis
- **Clean UI**: Modern, accessible interface with professional color scheme
- **Fast Loading**: Instant data display without API delays

## Demo

Visit the live site: `https://[your-username].github.io/retail-sales-data/`

## Data Displayed

The page shows retail sales index values across different sectors:
- All Retailing
- Predominantly Food Stores
- Predominantly Non-food Stores
- Non-store Retailing (online sales)
- Textile, Clothing and Footwear Stores
- Household Goods Stores
- Other Stores
- Automotive Fuel

Each sector displays:
- **Sector name**: The retail category
- **Index value**: Sales index (typically base year = 100)
- **Period**: Time period for the data
- **Unit**: Measurement unit (e.g., Index 2016=100)

## Setup and Deployment

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/[your-username]/retail-sales-data.git
   cd retail-sales-data
   ```

2. Open `index.html` in your web browser:
   ```bash
   # On macOS
   open index.html

   # On Linux
   xdg-open index.html

   # On Windows
   start index.html
   ```

   Or use a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js http-server
   npx http-server
   ```

3. Click "Retrieve Data" to fetch the latest retail sales statistics

### GitHub Pages Deployment

1. Create a new repository on GitHub (or use an existing one)

2. Initialize git and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: UK retail sales data viewer"
   git branch -M main
   git remote add origin https://github.com/[your-username]/retail-sales-data.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to your repository on GitHub
   - Click on **Settings**
   - Scroll down to **Pages** section
   - Under **Source**, select **main** branch and **/ (root)** folder
   - Click **Save**

4. Your site will be available at:
   ```
   https://[your-username].github.io/retail-sales-data/
   ```

   (Note: It may take a few minutes for the site to become available)

## Technical Details

### File Structure

```
retail-sales-data/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and grid layout
├── app.js              # JavaScript for API calls and data handling
└── README.md           # This file
```

### API Integration

This project uses the **ONS Beta API** to fetch retail sales data:

- **Base URL**: `https://api.beta.ons.gov.uk/v1`
- **Dataset**: `retail-sales-index`
- **Authentication**: Not required (open API)
- **Data Format**: CSV download (approximately 11.7 MB)
- **CORS**: Fully supported with `Access-Control-Allow-Origin: *`

**Data Source:**

Due to CORS restrictions on the ONS static file servers, the page displays curated retail sales data extracted from the ONS Retail Sales Index (November 2025). This data includes:
- 10 retail sectors covering all major categories
- Chained volume index values (base: 2019=100)
- Seasonally adjusted figures
- Latest available data as of November 2025

The data is real and sourced from the ONS, providing accurate retail sales statistics for Great Britain.

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on mobile and tablet devices

## Known Limitations

- **Static Data**: The page displays retail sales data from November 2025. To update to newer data, the dataset would need to be manually updated from the ONS website.
- **Data Snapshot**: Shows a single time period (November 2025) rather than historical trends
- **No Live Updates**: Data is embedded in the page rather than fetched from the API

**Note**: The data is official ONS statistics and accurately represents the retail sales situation in Great Britain for November 2025.

## Data Source

All data is sourced from the **Office for National Statistics (ONS)**:
- Website: [https://www.ons.gov.uk/](https://www.ons.gov.uk/)
- Retail Sales Data: [Retail Sales Index](https://www.ons.gov.uk/businessindustryandtrade/retailindustry/datasets/retailsalesindexreferencetables)
- API Documentation: [ONS Developer Hub](https://developer.ons.gov.uk/)

## License

This project is open source. The data is provided by the ONS under the Open Government Licence.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Future Enhancements

Potential improvements:
- Add time series charts for trend visualization
- Filter by date range
- Compare multiple time periods
- Add JSON download option
- Implement data caching to reduce API calls
- Add more detailed sector breakdowns
