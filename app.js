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
        // Dataset ID from ONS: retail-sales-index
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
        const latestVersion = datasetInfo.links?.latest_version || datasetInfo.links?.self;

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

        // Fetch observations data
        const observationsUrl = `${ONS_API_BASE}/datasets/${datasetId}/editions/${edition}/versions/${version}/observations`;

        const observationsResponse = await fetch(observationsUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!observationsResponse.ok) {
            throw new Error(`HTTP error! status: ${observationsResponse.status}`);
        }

        const observationsData = await observationsResponse.json();

        // Process observations into structured data
        const processedData = processObservations(observationsData);

        return processedData;

    } catch (error) {
        console.error('Error fetching retail sales data:', error);
        throw error;
    }
}

// Process observations from API response
function processObservations(observationsData) {
    if (!observationsData || !observationsData.observations) {
        throw new Error('No observations data available');
    }

    const observations = observationsData.observations;

    // Group by sector and get the latest value for each
    const sectorMap = new Map();

    observations.forEach(obs => {
        const sector = obs.dimensions?.['retail-sector']?.label || obs.dimensions?.sector?.label || 'Unknown Sector';
        const value = parseFloat(obs.observation) || 0;
        const period = obs.dimensions?.time?.label || obs.dimensions?.['time-period']?.label || 'Unknown Period';
        const unit = observationsData.unit_of_measure || 'Index';

        // Keep track of latest observation for each sector
        if (!sectorMap.has(sector) || new Date(period) > new Date(sectorMap.get(sector).period)) {
            sectorMap.set(sector, {
                sector,
                value: value.toFixed(1),
                period,
                unit
            });
        }
    });

    // Convert map to array and sort by sector name
    const result = Array.from(sectorMap.values()).sort((a, b) =>
        a.sector.localeCompare(b.sector)
    );

    return result;
}

// Fallback: Use mock data if API fails
function getMockData() {
    return [
        {
            sector: "All Retailing",
            value: "112.3",
            period: "December 2025",
            unit: "Index (2016=100)"
        },
        {
            sector: "Predominantly Food Stores",
            value: "108.7",
            period: "December 2025",
            unit: "Index (2016=100)"
        },
        {
            sector: "Predominantly Non-food Stores",
            value: "109.4",
            period: "December 2025",
            unit: "Index (2016=100)"
        },
        {
            sector: "Non-store Retailing",
            value: "128.9",
            period: "December 2025",
            unit: "Index (2016=100)"
        },
        {
            sector: "Textile, Clothing and Footwear Stores",
            value: "102.5",
            period: "December 2025",
            unit: "Index (2016=100)"
        },
        {
            sector: "Household Goods Stores",
            value: "98.6",
            period: "December 2025",
            unit: "Index (2016=100)"
        },
        {
            sector: "Other Stores",
            value: "115.3",
            period: "December 2025",
            unit: "Index (2016=100)"
        },
        {
            sector: "Automotive Fuel",
            value: "95.2",
            period: "December 2025",
            unit: "Index (2016=100)"
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
