// public/js/java-leaderboard.js
document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let rowsPerPage = 25;
    let totalRows = 0;
    let filters = { search: '', dateFrom: '', dateTo: '' };
    let allResults = [];
    let sortState = { column: null, direction: null }; // direction: 'asc', 'desc', or null

    const tableBody = document.getElementById('leaderboardBody');
    const emptyState = document.getElementById('emptyState');
    const pagination = document.getElementById('pagination');
    const rowsPerPageSelect = document.getElementById('rowsPerPage');
    const seeMoreButton = document.getElementById('seeMoreButton');
    const quizIdSelect = document.getElementById('quizIdSelect');

    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    function escapeHTML(text) {
        return text ? text.replace(/[&<>"'`=\/]/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
            "'": '&#39;', '`': '&#96;', '=': '&#61;', '/': '&#47;'
        }[s])) : '';
    }

    // Fetch distinct quizIDs for dropdown
    async function populateQuizIdDropdown() {
        const res = await fetch('/api/admin_dashboard/java-leaderboard/quizids', { credentials: 'include' });
        const data = await res.json();
        if (Array.isArray(data.quizIDs)) {
            quizIdSelect.innerHTML = '<option value="">All Quizzes</option>';
            data.quizIDs.forEach(qid => {
                const opt = document.createElement('option');
                opt.value = qid;
                opt.textContent = qid;
                quizIdSelect.appendChild(opt);
            });
        }
    }

    async function fetchLeaderboard(page = 1, limit = rowsPerPage, append = false) {
        const params = new URLSearchParams({
            search: filters.search,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            quizID: filters.quizID || '',
            limit,
            skip: (page - 1) * limit
        });
        const res = await fetch(`/api/admin_dashboard/java-leaderboard?${params}`, { credentials: 'include' });
        const data = await res.json();
        totalRows = data.total || 0;
        if (append) {
            allResults = allResults.concat(data.results);
        } else {
            allResults = data.results;
        }
        renderTable();
        renderPagination();
    }

    function sortResults() {
        if (!sortState.column || !sortState.direction) return;
        allResults.sort((a, b) => {
            let valA = a[sortState.column];
            let valB = b[sortState.column];

            // Handle numbers and dates
            if (sortState.column === 'score' || sortState.column === 'correctItems' ||
                sortState.column === 'totalItems' || sortState.column === 'accuracy' ||
                sortState.column === 'timeTaken') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }
            if (sortState.column === 'submittedAt') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    function renderTable() {
        tableBody.innerHTML = '';
        if (!Array.isArray(allResults) || !allResults.length) {
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';
        sortResults();
        allResults.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHTML(row.idNumber)}</td>
                <td>${escapeHTML(row.firstName)}</td>
                <td>${escapeHTML(row.lastName)}</td>
                <td title="${escapeHTML(row.quizID)}">${escapeHTML(row.quizID)}</td>
                <td>${escapeHTML(row.score?.toString())}</td>
                <td>${escapeHTML(row.correctItems?.toString())}</td>
                <td>${escapeHTML(row.totalItems?.toString())}</td>
                <td>${escapeHTML(row.accuracy?.toString())}</td>
                <td>${formatTime(row.timeTaken)}</td>
                <td>${row.submittedAt ? new Date(row.submittedAt).toLocaleString() : ''}</td>
                <td>
                    <button class="delete-btn" data-id="${escapeHTML(row.idNumber)}" data-quiz="${escapeHTML(row.quizID)}">Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function renderPagination() {
        pagination.innerHTML = '';
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        if (totalPages <= 1) return;
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.disabled = i === currentPage;
            btn.addEventListener('click', () => {
                currentPage = i;
                fetchLeaderboard(currentPage, rowsPerPage);
            });
            pagination.appendChild(btn);
        }
    }

    document.getElementById('filterForm').addEventListener('submit', e => {
        e.preventDefault();
        filters.search = document.getElementById('searchInput').value.trim();
        filters.dateFrom = document.getElementById('dateFrom').value;
        filters.dateTo = document.getElementById('dateTo').value;
        currentPage = 1;
        fetchLeaderboard(currentPage, rowsPerPage);
    });

    document.getElementById('resetButton').addEventListener('click', () => {
        filters = { search: '', dateFrom: '', dateTo: '' };
        document.getElementById('searchInput').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        currentPage = 1;
        fetchLeaderboard(currentPage, rowsPerPage);
    });

    document.getElementById('emptyResetButton').addEventListener('click', () => {
        filters = { search: '', dateFrom: '', dateTo: '' };
        document.getElementById('searchInput').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        currentPage = 1;
        fetchLeaderboard(currentPage, rowsPerPage);
    });

    rowsPerPageSelect.addEventListener('change', () => {
        rowsPerPage = parseInt(rowsPerPageSelect.value, 10);
        currentPage = 1;
        fetchLeaderboard(currentPage, rowsPerPage);
    });

    seeMoreButton.addEventListener('click', () => {
        fetchLeaderboard(currentPage + 1, rowsPerPage, true);
        currentPage++;
    });

    document.getElementById('exportXLSX').addEventListener('click', () => {
        const params = new URLSearchParams({
            search: filters.search,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
        });
        window.open(`/api/admin_dashboard/java-leaderboard/xlsx?${params}`, '_blank');
    });

    document.getElementById('exportPDF').addEventListener('click', () => {
        const params = new URLSearchParams({
            search: filters.search,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
        });
        window.open(`/api/admin_dashboard/java-leaderboard/pdf?${params}`, '_blank');
    });

    quizIdSelect.addEventListener('change', () => {
        filters.quizID = quizIdSelect.value;
        currentPage = 1;
        fetchLeaderboard(currentPage, rowsPerPage);
    });

    // Add event listeners to table headers for sorting
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-sort');
            if (sortState.column !== col) {
                sortState = { column: col, direction: 'asc' };
            } else if (sortState.direction === 'asc') {
                sortState.direction = 'desc';
            } else if (sortState.direction === 'desc') {
                sortState.direction = null;
            } else {
                sortState.direction = 'asc';
            }
            renderTable();
        });
    });

    function handleResponsiveColumns() {
        const table = document.getElementById('leaderboardTable');
        if (!table) return;
        const screenWidth = window.innerWidth;
        if (screenWidth < 768) {
            table.classList.add('compact-view');
        } else {
            table.classList.remove('compact-view');
        }
    }

    window.addEventListener('load', handleResponsiveColumns);
    window.addEventListener('resize', handleResponsiveColumns);

    // Initial load
    filters.quizID = '';
    populateQuizIdDropdown();
    fetchLeaderboard(currentPage, rowsPerPage);

    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const idNumber = e.target.getAttribute('data-id');
            const quizID = e.target.getAttribute('data-quiz');
            if (confirm(`Delete data for student ID ${idNumber} on quiz "${quizID}"?`)) {
                const res = await fetch('/api/admin_dashboard/java-leaderboard/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ idNumber, quizID })
                });
                const data = await res.json();
                if (data.success) {
                    fetchLeaderboard(currentPage, rowsPerPage);
                } else {
                    alert('Delete failed: ' + (data.message || 'Unknown error'));
                }
            }
        }
    });
});