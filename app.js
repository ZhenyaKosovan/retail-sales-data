// DOM elements
const retrieveBtn = document.getElementById('retrieveBtn');
const downloadBtn = document.getElementById('downloadBtn');
const spinner = document.getElementById('spinner');
const dataGrid = document.getElementById('dataGrid');
const errorMessage = document.getElementById('errorMessage');

// Store retail sales data globally
let retailSalesData = [];

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

// Get retail sales data (from ONS November 2025)
function getRetailSalesData() {
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
    console.log('=== Loading retail sales data ===');
    hideError();
    showSpinner();
    disableDownloadButton();
    dataGrid.innerHTML = '';

    // Load ONS retail sales data from November 2025
    retailSalesData = getRetailSalesData();
    console.log('Data loaded:', retailSalesData.length, 'sectors');

    // Small delay for UX (shows spinner briefly)
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        renderDataGrid(retailSalesData);
        console.log('✓ Data rendered successfully');
        enableDownloadButton();
    } catch (renderError) {
        console.error('❌ Failed to render data:', renderError);
        showError('Error displaying data. Please refresh the page.');
    } finally {
        hideSpinner();
        console.log('=== Data display complete ===');
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
