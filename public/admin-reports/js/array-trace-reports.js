//admin-reports/js/array-trace-reports.js
// ====== Config ======
const API_URL = '/api/admin-reports/array-trace';
const DEFAULT_FIELDS = [
    'studentIDNumber', 'fullname', 'email', 'score', 'total', 'percent', 'templateName', 'timestamp'
];

// ====== DOM Elements ======
const fieldSelect = document.getElementById('field-select');
const applyFieldsBtn = document.getElementById('apply-fields-btn');
const exportExcelBtn = document.getElementById('export-excel-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const reportsTable = document.getElementById('reports-table');
const paginationDiv = document.getElementById('pagination');

let currentFields = [...DEFAULT_FIELDS];
let currentPage = 1;
let lastQuery = {};

// ====== Field Options ======
const ALL_FIELDS = [
    { key: 'studentIDNumber', label: 'Student ID' },
    { key: 'fullname', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'score', label: 'Score' },
    { key: 'total', label: 'Total' },
    { key: 'percent', label: 'Percent' },
    { key: 'templateId', label: 'Template ID' },
    { key: 'templateName', label: 'Template Name' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'answers', label: 'Answers' }
];

// ====== Helpers ======
function populateFieldSelect() {
    fieldSelect.innerHTML = '';
    ALL_FIELDS.forEach(field => {
        const option = document.createElement('option');
        option.value = field.key;
        option.textContent = field.label;
        if (currentFields.includes(field.key)) option.selected = true;
        fieldSelect.appendChild(option);
    });
}

function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString();
}

// ====== Fetch & Render ======
async function fetchReports(query = {}) {
    const params = new URLSearchParams({
        ...query,
        fields: currentFields.join(','),
        page: currentPage,
        limit: 20
    });
    const res = await fetch(`${API_URL}?${params}`, { credentials: 'include' });
    if (!res.ok) {
        alert('Failed to fetch reports');
        return { results: [], total: 0 };
    }
    return await res.json();
}

function renderTable(results) {
    // Table Head
    const thead = reportsTable.querySelector('thead');
    thead.innerHTML = '';
    const headRow = document.createElement('tr');
    currentFields.forEach(field => {
        const fieldObj = ALL_FIELDS.find(f => f.key === field);
        const th = document.createElement('th');
        th.textContent = fieldObj ? fieldObj.label : field;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    // Table Body
    const tbody = reportsTable.querySelector('tbody');
    tbody.innerHTML = '';
    results.forEach(row => {
        const tr = document.createElement('tr');
        currentFields.forEach(field => {
            const td = document.createElement('td');
            let value = row[field];
            if (field === 'timestamp') value = formatDate(value);
            if (field === 'answers') value = Array.isArray(value) ? `[${value.length} items]` : '';
            td.textContent = value !== undefined ? value : '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function renderPagination(total, page, limit) {
    paginationDiv.innerHTML = '';
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return;
    for (let p = 1; p <= totalPages; p++) {
        const btn = document.createElement('button');
        btn.textContent = p;
        btn.disabled = p === page;
        btn.addEventListener('click', () => {
            currentPage = p;
            loadReports(lastQuery);
        });
        paginationDiv.appendChild(btn);
    }
}

// ====== Main Loader ======
async function loadReports(query = {}) {
    lastQuery = query;
    const { results, total, page = 1, limit = 20 } = await fetchReports(query);
    renderTable(results);
    renderPagination(total, page, limit);
}

// ====== Event Listeners ======
applyFieldsBtn.addEventListener('click', () => {
    currentFields = Array.from(fieldSelect.selectedOptions).map(opt => opt.value);
    loadReports(lastQuery);
});

searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    let query = {};
    if (q) {
        // Search by fullname, studentIDNumber, or email
        query.fullname = q;
        query.studentIDNumber = q;
        query.email = q;
    }
    currentPage = 1;
    loadReports(query);
});

exportExcelBtn.addEventListener('click', async () => {
    const params = new URLSearchParams({
        ...lastQuery,
        fields: currentFields.join(','),
        export: 'excel'
    });
    window.open(`${API_URL}?${params}`, '_blank');
});

document.getElementById('download-all-xlsx-btn').addEventListener('click', function() {
    window.location.href = '/api/admin-reports/array-trace/export-all-xlsx';
});

// ====== Session Check ======
async function checkAdminSession() {
    const res = await fetch('/api/debug-session', { credentials: 'include' });
    const session = await res.json();
    if (!session.isAdmin) {
        document.body.innerHTML = '<h2>Access denied. Admins only.</h2>';
        throw new Error('Not authorized');
    }
}
checkAdminSession().then(() => {
    // Place the rest of your JS code here, or call your main loader function
    populateFieldSelect();
    loadReports();
});
