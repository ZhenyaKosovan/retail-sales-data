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
        // Using the retail-sales-index dataset directly
        const datasetId = 'retail-sales-index';

        // Fetch dataset metadata to get latest edition and version
        const datasetResponse = await fetch(`${ONS_API_BASE}/datasets/${datasetId}`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!datasetResponse.ok) {
            throw new Error(`HTTP error! status: ${datasetResponse.status}`);
        }

        const datasetInfo = await datasetResponse.json();

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

        // Construct CSV download URL
        const csvUrl = `https://download.ons.gov.uk/downloads/datasets/${datasetId}/editions/${edition}/versions/${version}.csv`;

        // Fetch CSV data
        const csvResponse = await fetch(csvUrl);

        if (!csvResponse.ok) {
            throw new Error(`HTTP error! status: ${csvResponse.status}`);
        }

        const csvText = await csvResponse.text();

        // Process CSV into structured data
        const processedData = parseCSVData(csvText);

        return processedData;

    } catch (error) {
        console.error('Error fetching retail sales data:', error);
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
    const year = 2000 + parseInt(parts[1]);

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
    if (!data || data.length === 0) {
        dataGrid.innerHTML = '<p class="no-data">No data available to display</p>';
        return;
    }

    // Clear existing content
    dataGrid.innerHTML = '';

    // Create card for each sector
    data.forEach(item => {
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
    hideError();
    showSpinner();
    disableDownloadButton();
    dataGrid.innerHTML = '';

    try {
        // Try to fetch from API
        const data = await fetchRetailSalesData();

        if (!data || data.length === 0) {
            throw new Error('No data returned from API');
        }

        retailSalesData = data;
        renderDataGrid(retailSalesData);
        enableDownloadButton();

    } catch (error) {
        console.error('Error:', error);

        // Use mock data as fallback
        showError('Unable to fetch live data from ONS API. Displaying sample data instead.');
        retailSalesData = getMockData();
        renderDataGrid(retailSalesData);
        enableDownloadButton();
    } finally {
        hideSpinner();
    }
}

// Event listeners
retrieveBtn.addEventListener('click', handleRetrieveData);
downloadBtn.addEventListener('click', downloadData);

// Prevent multiple rapid clicks
let isLoading = false;
retrieveBtn.addEventListener('click', async () => {
    if (isLoading) return;
    isLoading = true;
    await handleRetrieveData();
    isLoading = false;
});
