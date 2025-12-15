// activity_reports.js - FIXED VERSION
document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('filterForm');
    const reportsTableBody = document.getElementById('reportsTableBody');
    const downloadXlsxBtn = document.getElementById('downloadXlsxBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const searchInput = document.getElementById('searchInput');
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');

    // Added modal element refs
    const detailsModal = document.getElementById('detailsModal');
    const detailsBody = document.getElementById('detailsBody');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');
    const deleteModal = document.getElementById('deleteModal');
    const deleteTokenEl = document.getElementById('deleteToken');
    const deleteInputEl = document.getElementById('deleteInput');
    const deleteStatusEl = document.getElementById('deleteStatus');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    let currentSubmissions = [];
    let deleteTargetId = null;
    let deleteToken = '';

    console.log('DOM loaded, initializing...');

    async function fetchReports(params = {}) {
        try {
            const url = new URL('/api/activity/submissions', window.location.origin);
            Object.entries(params).forEach(([key, val]) => { if (val) url.searchParams.append(key, val); });
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) {
                const errorText = await res.text();
                reportsTableBody.innerHTML = `<tr><td colspan="9">Error: ${res.status} ${res.statusText}</td></tr>`;
                return;
            }
            const data = await res.json();
            currentSubmissions = data.submissions || [];
            displayReports(currentSubmissions);
        } catch (error) {
            reportsTableBody.innerHTML = `<tr><td colspan="9">Network Error: ${error.message}</td></tr>`;
        }
    }

    function checklistSummaryString(obj) {
        if (!obj || typeof obj !== 'object') return 'No checklist data';
        let completed = 0, total = 0;
        Object.values(obj).forEach(section => {
            if (section && typeof section === 'object') {
                Object.values(section).forEach(val => {
                    total++;
                    if (val === true) completed++;
                });
            }
        });
        return `${completed}/${total} tasks completed`;
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
    }

    function displayReports(submissions) {
        reportsTableBody.innerHTML = '';
        if (!submissions.length) {
            reportsTableBody.innerHTML = '<tr><td colspan="9">No submissions found.</td></tr>';
            return;
        }
        submissions.forEach(sub => {
            const row = document.createElement('tr');
            const summary = checklistSummaryString(sub.checklistSummary);
            const id = sub.id || sub.submissionNumber || sub.groupNumber || '';
            row.innerHTML = `
                <td>${escapeHtml(sub.submissionNumber || 'N/A')}</td>
                <td>${escapeHtml(sub.groupNumber || 'N/A')}</td>
                <td>${escapeHtml((sub.members || []).join(', ') || 'N/A')}</td>
                <td><a href="${escapeHtml(sub.projectUrl || '')}" target="_blank">${escapeHtml(sub.projectUrl || 'N/A')}</a></td>
                <td>${escapeHtml(sub.senderEmail || 'N/A')}</td>
                <td>${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}</td>
                <td>${escapeHtml(sub.status || 'N/A')}</td>
                <td>${escapeHtml(summary)}</td>
                <td>
                    <button class="details-btn" data-id="${escapeHtml(id)}">Details</button>
                    <button class="delete-btn" data-id="${escapeHtml(id)}">Delete</button>
                </td>
            `;
            reportsTableBody.appendChild(row);
        });
    }

    function buildDetailsHtml(sub) {
        if (!sub.checklistSummary || typeof sub.checklistSummary !== 'object') {
            return '<p>No checklist details.</p>';
        }
        let sections = '';
        Object.entries(sub.checklistSummary).forEach(([sectionName, sectionVals]) => {
            if (sectionVals && typeof sectionVals === 'object') {
                const items = Object.entries(sectionVals).map(([k,v]) =>
                    `<li><strong>${escapeHtml(k)}</strong>: ${v === true ? '✅' : v === false ? '❌' : escapeHtml(String(v))}</li>`
                ).join('');
                sections += `<h4 style="margin:0.5rem 0 0.25rem;">${escapeHtml(sectionName)}</h4><ul style="margin:0 0 0.5rem 1rem;">${items}</ul>`;
            }
        });
        return `
            <p><strong>Submission #:</strong> ${escapeHtml(sub.submissionNumber || 'N/A')}</p>
            <p><strong>Group #:</strong> ${escapeHtml(sub.groupNumber || 'N/A')}</p>
            <p><strong>Members:</strong> ${escapeHtml((sub.members || []).join(', ') || 'N/A')}</p>
            <hr/>
            ${sections || '<p>No sections.</p>'}
        `;
    }

    function openDetails(id) {
        const sub = currentSubmissions.find(s => String(s.id || s.submissionNumber) === String(id));
        detailsBody.innerHTML = sub ? buildDetailsHtml(sub) : '<p>Not found.</p>';
        detailsModal.classList.remove('hidden');
    }
    function closeDetails() { detailsModal.classList.add('hidden'); }

    function generateToken(len = 6) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let out = '';
        if (window.crypto?.getRandomValues) {
            const arr = new Uint32Array(len);
            crypto.getRandomValues(arr);
            for (let i=0;i<len;i++) out += chars[arr[i] % chars.length];
        } else {
            for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
        }
        return out;
    }

    function openDelete(id) {
        deleteTargetId = id;
        deleteToken = generateToken();
        deleteTokenEl.textContent = deleteToken;
        deleteInputEl.value = '';
        confirmDeleteBtn.disabled = true;
        deleteStatusEl.textContent = 'Waiting for input…';
        deleteStatusEl.style.color = '#6b7280';
        deleteModal.classList.remove('hidden');
        deleteInputEl.focus();
    }
    function closeDelete() {
        deleteModal.classList.add('hidden');
        deleteTargetId = null;
    }

    deleteInputEl.addEventListener('input', () => {
        if (deleteInputEl.value.trim().toUpperCase() === deleteToken) {
            confirmDeleteBtn.disabled = false;
            deleteStatusEl.textContent = 'Token matched. Ready to delete.';
            deleteStatusEl.style.color = '#16a34a';
        } else {
            confirmDeleteBtn.disabled = true;
            deleteStatusEl.textContent = 'Mismatch.';
            deleteStatusEl.style.color = '#dc2626';
        }
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!deleteTargetId) return;
        try {
            const res = await fetch(`/api/activity/submissions/${encodeURIComponent(deleteTargetId)}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            currentSubmissions = currentSubmissions.filter(s => String(s.id || s.submissionNumber) !== String(deleteTargetId));
            displayReports(currentSubmissions);
            closeDelete();
        } catch (e) {
            alert('Delete failed: ' + e.message);
        }
    });

    cancelDeleteBtn.addEventListener('click', closeDelete);
    closeDetailsBtn.addEventListener('click', closeDetails);

    reportsTableBody.addEventListener('click', e => {
        const detailsBtn = e.target.closest('.details-btn');
        const deleteBtn = e.target.closest('.delete-btn');
        if (detailsBtn) openDetails(detailsBtn.dataset.id);
        if (deleteBtn) openDelete(deleteBtn.dataset.id);
    });

    [detailsModal, deleteModal].forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    });

    // Live search as you type
    searchInput.addEventListener('input', () => {
        const params = {
            search: searchInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value
        };
        fetchReports(params);
    });

    // Handle filter form submit
    filterForm.addEventListener('submit', e => {
        e.preventDefault();
        const params = {
            search: searchInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value
        };
        fetchReports(params);
    });

    // Download XLSX
    downloadXlsxBtn.addEventListener('click', () => {
        const params = new URLSearchParams({
            search: searchInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value
        });
        window.open(`/api/activity/submissions/xlsx?${params.toString()}`, '_blank');
    });

    // Download PDF
    downloadPdfBtn.addEventListener('click', () => {
        const params = new URLSearchParams({
            search: searchInput.value,
            startDate: startDateInput.value,
            endDate: endDateInput.value
        });
        window.open(`/api/activity/submissions/pdf?${params.toString()}`, '_blank');
    });

    // Reset filters
    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        searchInput.value = '';
        startDateInput.value = '';
        endDateInput.value = '';
        fetchReports();
    });

    // Initial fetch
    console.log('Starting initial fetch...');
    fetchReports();

    // Add this at the end of your DOMContentLoaded event
setTimeout(() => {
    const debugDiv = document.getElementById('debugInfo');
    if (debugDiv) {
        debugDiv.innerHTML = `
            <h3>Debug Info:</h3>
            <p>Table Body: ${reportsTableBody ? 'Found' : 'Not Found'}</p>
            <p>Rows in table: ${reportsTableBody ? reportsTableBody.children.length : 0}</p>
        `;
    }
}, 1000);
});
