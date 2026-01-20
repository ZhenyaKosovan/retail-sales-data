// DOM elements
const retrieveBtn = document.getElementById('retrieveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const spinner = document.getElementById('spinner');
const dataGrid = document.getElementById('dataGrid');
const errorMessage = document.getElementById('errorMessage');

// Store fetched data globally
let retailSalesData = [];

// ONS API configuration
const ONS_API_BASE = 'https://api.beta.ons.gov.uk/v1';

// UI State Management
function showSpinner() {
    spinner.classList.remove('hidden');
    retrieveBtn.disabled = true;
}

function hideSpinner() {
    spinner.classList.add('hidden');
    retrieveBtn.disabled = false;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function enableDownloadButton() {
    downloadBtn.disabled = false;
}

function disableDownloadButton() {
    downloadBtn.disabled = true;
}

// Fetch retail sales data from ONS API
async function fetchRetailSalesData() {
    try {
        console.log('fetchRetailSalesData: Starting...');
        // Using the retail-sales-index dataset directly
        const datasetId = 'retail-sales-index';
        const metadataUrl = `${ONS_API_BASE}/datasets/${datasetId}`;
        console.log('Fetching metadata from:', metadataUrl);

        // Fetch dataset metadata to get latest edition and version
        const datasetResponse = await fetch(metadataUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Metadata response status:', datasetResponse.status);

        if (!datasetResponse.ok) {
            throw new Error(`HTTP error! status: ${datasetResponse.status}`);
        }

        const datasetInfo = await datasetResponse.json();
        console.log('Metadata received:', datasetInfo.title);

        // Get the latest version information
        const latestVersion = datasetInfo.links?.latest_version;

        if (!latestVersion) {
            throw new Error('Unable to find latest version information');
        }

        // Extract edition and version from the link
        const versionMatch = latestVersion.href.match(/editions\/([^/]+)\/versions\/(\d+)/);

        if (!versionMatch) {
            throw new Error('Unable to parse version information');
        }

        const edition = versionMatch[1];
        const version = versionMatch[2];
        console.log(`Latest version: ${edition}/v${version}`);

        // Construct CSV download URL
        const csvUrl = `https://download.ons.gov.uk/downloads/datasets/${datasetId}/editions/${edition}/versions/${version}.csv`;
        console.log('Downloading CSV from:', csvUrl);

        // Fetch CSV data
        const csvResponse = await fetch(csvUrl);
        console.log('CSV response status:', csvResponse.status);

        if (!csvResponse.ok) {
            throw new Error(`CSV download failed! status: ${csvResponse.status}`);
        }

        const csvText = await csvResponse.text();
        console.log(`CSV downloaded: ${(csvText.length / 1024 / 1024).toFixed(2)} MB`);

        // Process CSV into structured data
        console.log('Parsing CSV data...');
        const processedData = parseCSVData(csvText);
        console.log(`Parsed ${processedData.length} sectors`);

        return processedData;

    } catch (error) {
        console.error('❌ fetchRetailSalesData error:', error.message);
        console.error('Error type:', error.name);
        console.error('Full error:', error);
        throw error;
    }
}

// Parse CSV data and extract relevant information
function parseCSVData(csvText) {
    const lines = csvText.split('\n');

    if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
    }

    // Parse header to get column indices
    const header = lines[0].split(',');
    const valueIdx = 0; // v4_1
    const timeCodeIdx = 2; // mmm-yy
    const timeLabelIdx = 3; // Time
    const sectorCodeIdx = 6; // sic-unofficial
    const sectorLabelIdx = 7; // UnofficialStandardIndustrialClassification
    const pricesCodeIdx = 8; // type-of-prices
    const pricesLabelIdx = 9; // Prices

    // Find the latest time period
    const timeSet = new Set();
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length > timeCodeIdx && cols[timeCodeIdx]) {
            timeSet.add(cols[timeCodeIdx]);
        }
    }

    // Get the latest time period (they're in format mmm-yy)
    const latestTime = Array.from(timeSet).sort((a, b) => {
        // Convert mmm-yy to date for comparison
        const dateA = parseMonthYear(a);
        const dateB = parseMonthYear(b);
        return dateB - dateA;
    })[0];

    // Extract data for latest period with "chained-volume-of-retail-sales"
    const sectorMap = new Map();

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);

        if (cols.length <= pricesCodeIdx) continue;

        const timeCode = cols[timeCodeIdx];
        const pricesCode = cols[pricesCodeIdx];

        // Filter for latest time and chained volume metric
        if (timeCode === latestTime && pricesCode === 'chained-volume-of-retail-sales') {
            const value = cols[valueIdx];
            const sector = cols[sectorLabelIdx];
            const period = cols[timeLabelIdx];

            if (value && sector && !sectorMap.has(sector)) {
                sectorMap.set(sector, {
                    sector: formatSectorName(sector),
                    value: parseFloat(value).toFixed(1),
                    period: formatPeriod(period),
                    unit: 'Index (2019=100)'
                });
            }
        }
    }

    // Convert to array and sort
    const result = Array.from(sectorMap.values()).sort((a, b) =>
        a.sector.localeCompare(b.sector)
    );

    return result;
}

// Parse a CSV line handling quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

// Convert mmm-yy to Date object
function parseMonthYear(mmm_yy) {
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const parts = mmm_yy.split('-');
    if (parts.length !== 2) return new Date(0);

    const month = months[parts[0]];
    const yearPart = parseInt(parts[1]);

    // Handle two-digit years: 00-49 = 2000-2049, 50-99 = 1950-1999
    const year = yearPart < 50 ? 2000 + yearPart : 1900 + yearPart;

    return new Date(year, month, 1);
}

// Format sector name to be more readable
function formatSectorName(sector) {
    // Remove quotes if present
    sector = sector.replace(/^"(.*)"$/, '$1');

    // Capitalize first letter of each word
    return sector.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

// Format period to be more readable
function formatPeriod(period) {
    // Remove quotes if present
    return period.replace(/^"(.*)"$/, '$1');
}

// Fallback: Use mock data if API fails
function getMockData() {
    return [
        {
            sector: "All Retailing Including Automotive Fuel",
            value: "100.6",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "All Retailing Excluding Automotive Fuel",
            value: "100.9",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Predominantly Food Stores",
            value: "94.9",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Total Of Predominantly Non-food Stores",
            value: "105.5",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Non-store Retailing",
            value: "105.6",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Textile, Clothing And Footwear Stores",
            value: "101.5",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Household Goods Stores",
            value: "104.9",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Other Stores",
            value: "109.8",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Predominantly Automotive Fuel",
            value: "97.8",
            period: "Nov-25",
            unit: "Index (2019=100)"
        },
        {
            sector: "Non-specialised Stores",
            value: "104.8",
            period: "Nov-25",
            unit: "Index (2019=100)"
        }
    ];
}

// Render data grid
function renderDataGrid(data) {
    console.log('renderDataGrid called with data:', data ? data.length : 'null', 'items');

    if (!data || data.length === 0) {
        console.log('No data to render');
        dataGrid.innerHTML = '<p class="no-data">No data available to display</p>';
        return;
    }

    // Clear existing content
    dataGrid.innerHTML = '';
    console.log('Creating', data.length, 'data cards...');

    // Create card for each sector
    data.forEach((item, index) => {
        console.log(`Creating card ${index + 1}:`, item.sector);
        const card = document.createElement('div');
        card.className = 'data-card';

        card.innerHTML = `
            <h3>${item.sector}</h3>
            <div class="value">${item.value}</div>
            <div class="meta">
                <span class="period">${item.period}</span>
                <span class="unit">${item.unit}</span>
            </div>
        `;

        dataGrid.appendChild(card);
    });

    console.log('✓ Rendered', data.length, 'cards to DOM');
    console.log('dataGrid children count:', dataGrid.children.length);
}

// Download data as CSV
function downloadData() {
    if (!retailSalesData || retailSalesData.length === 0) {
        showError('No data available to download');
        return;
    }

    // Create CSV content
    const headers = ['Sector', 'Value', 'Period', 'Unit'];
    const csvRows = [headers.join(',')];

    retailSalesData.forEach(item => {
        const row = [
            `"${item.sector}"`,
            item.value,
            `"${item.period}"`,
            `"${item.unit}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `retail-sales-${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle retrieve data button click
async function handleRetrieveData() {
    console.log('=== Starting data retrieval ===');
    hideError();
    showSpinner();
    disableDownloadButton();
    dataGrid.innerHTML = '';

    try {
        console.log('Attempting to fetch from API...');
        // Try to fetch from API
        const data = await fetchRetailSalesData();

        console.log('Fetch successful, data length:', data ? data.length : 0);

        if (!data || data.length === 0) {
            throw new Error('No data returned from API');
        }

        retailSalesData = data;
        console.log('Rendering data grid with', retailSalesData.length, 'items');
        renderDataGrid(retailSalesData);
        enableDownloadButton();
        console.log('✓ Live data displayed successfully');

    } catch (error) {
        console.error('❌ Fetch failed:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);

        // Use mock data as fallback
        console.log('Loading mock data as fallback...');
        showError('Unable to fetch live data from ONS API. Displaying sample data instead.');
        retailSalesData = getMockData();
        console.log('Mock data loaded:', retailSalesData.length, 'items');
        console.log('Mock data sample:', retailSalesData[0]);

        try {
            renderDataGrid(retailSalesData);
            console.log('✓ Mock data rendered successfully');
            enableDownloadButton();
        } catch (renderError) {
            console.error('❌ Failed to render mock data:', renderError);
            console.error('Render error details:', renderError.message);
        }
    } finally {
        hideSpinner();
        console.log('=== Data retrieval complete ===');
    }
}

// Event listeners
let isLoading = false;

retrieveBtn.addEventListener('click', async () => {
    if (isLoading) return;
    isLoading = true;
    await handleRetrieveData();
    isLoading = false;
});

downloadBtn.addEventListener('click', downloadData);
