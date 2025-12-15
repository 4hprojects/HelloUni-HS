const express = require('express');
const router = express.Router();
const path = require('path');
const ExcelJS = require('exceljs');

// Example admin authentication middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
}

// GET /api/admin-reports/array-trace
router.get('/array-trace', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    try {
        // Basic filtering (by studentIDNumber, email, fullname, templateId, date range)
        const query = {};
        if (req.query.studentIDNumber) query.studentIDNumber = req.query.studentIDNumber;
        if (req.query.email) query.email = req.query.email;
        if (req.query.fullname) query.fullname = { $regex: req.query.fullname, $options: 'i' };
        if (req.query.templateId) query.templateId = req.query.templateId;
        if (req.query.startDate || req.query.endDate) {
            query.timestamp = {};
            if (req.query.startDate) query.timestamp.$gte = req.query.startDate;
            if (req.query.endDate) query.timestamp.$lte = req.query.endDate;
        }

        // Dynamic fields selection
        let projection = {};
        if (req.query.fields) {
            const fields = req.query.fields.split(',').map(f => f.trim());
            fields.forEach(f => projection[f] = 1);
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const collection = db.collection('array_trace_results');
        const total = await collection.countDocuments(query);
        const results = await collection.find(query, { projection })
            .skip(skip)
            .limit(limit)
            .sort({ timestamp: -1 })
            .toArray();

        res.json({ total, page, limit, results });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});
// Serve HTML page
router.get('/array-trace.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin-reports/array-trace.html'));
});

// Export all reports as XLSX
router.get('/array-trace/export-all-xlsx', requireAdmin, async (req, res) => {
    const db = req.app.locals.db;
    try {
        const collection = db.collection('array_trace_results');
        const results = await collection.find({}).sort({ timestamp: -1 }).toArray();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Array Trace Reports');

        if (results.length > 0) {
            worksheet.columns = Object.keys(results[0]).map(key => ({
                header: key,
                key: key,
                width: 20
            }));
            results.forEach(row => worksheet.addRow(row));
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="array-trace-reports.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        res.status(500).json({ error: 'Failed to export XLSX' });
    }
});

module.exports = router;
