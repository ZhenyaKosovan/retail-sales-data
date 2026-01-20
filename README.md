# UK Retail Sales Data Viewer

A simple, static webpage that displays retail sales data from the Office for National Statistics (ONS) using their Beta API. The data is presented in a responsive 2-column grid layout with download functionality.

## Features

- **Live Data Fetching**: Retrieves the latest retail sales statistics from the ONS Beta API
- **Responsive Design**: 2-column grid on desktop, single column on mobile devices
- **Data Download**: Export data as CSV for further analysis
- **Loading States**: Visual feedback during data retrieval
- **Error Handling**: Graceful fallback to sample data if API is unavailable
- **Clean UI**: Modern, accessible interface with ONS-inspired color scheme

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
- **Data Format**: JSON

The application attempts to fetch live data from the ONS API. If the API is unavailable or returns an error, it falls back to displaying sample data.

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on mobile and tablet devices

## Known Limitations

- **Beta API**: The ONS API is in beta and may have breaking changes
- **CORS**: Some browsers may have CORS restrictions when running locally (use a local server)
- **Rate Limits**: The ONS API may have rate limits (not documented)
- **Data Freshness**: Data is updated according to ONS release schedule (typically monthly)
- **Fallback Data**: If API fails, sample data is shown with a warning message

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
