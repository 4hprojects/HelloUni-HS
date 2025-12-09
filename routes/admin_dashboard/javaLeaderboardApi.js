// routes/admin_dashboard/javaLeaderboardApi.js

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// Middleware to check admin
function isAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    
    // Debug logging
    console.log('Admin check failed:', {
        hasSession: !!req.session,
        sessionRole: req.session?.role,
        sessionUser: req.session?.user,
        sessionID: req.sessionID
    });
    
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
}

// GET /java-leaderboard
router.get('/java-leaderboard', isAdmin, async (req, res) => {
    const db = req.app.locals.db; // Assume db is attached in server.js
    const collection = db.collection('tblQuizLeaderboard');

    // Parse filters
    const { search = '', dateFrom, dateTo, limit = 25, skip = 0 } = req.query;
    const query = {};

    // Search filter (studentID, firstName, lastName, quizID, email)
    if (search) {
        query.$or = [
            { idNumber: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { quizID: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
        query.submittedAt = {};
        if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
        if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }

    // Quiz ID filter
    if (req.query.quizID) {
        query.quizID = req.query.quizID;
    }

    // Pagination
    const pageLimit = Math.max(1, Math.min(parseInt(limit), 100));
    const pageSkip = Math.max(0, parseInt(skip));

    // Fetch data
    const total = await collection.countDocuments(query);
    const results = await collection.find(query)
        .sort({ submittedAt: -1 })
        .skip(pageSkip)
        .limit(pageLimit)
        .toArray();

    res.json({ success: true, total, results });
});

// GET /java-leaderboard/xlsx
router.get('/java-leaderboard/xlsx', isAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const collection = db.collection('tblQuizLeaderboard');
    const { search = '', dateFrom, dateTo } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { idNumber: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { quizID: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (dateFrom || dateTo) {
        query.submittedAt = {};
        if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
        if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }

    const results = await collection.find(query).sort({ submittedAt: -1 }).toArray();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leaderboard');
    sheet.columns = [
        { header: 'Student ID', key: 'idNumber', width: 15 },
        { header: 'First Name', key: 'firstName', width: 15 },
        { header: 'Last Name', key: 'lastName', width: 15 },
        { header: 'Quiz ID', key: 'quizID', width: 20 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Correct Items', key: 'correctItems', width: 15 },
        { header: 'Total Items', key: 'totalItems', width: 15 },
        { header: 'Accuracy', key: 'accuracy', width: 10 },
        { header: 'Time Taken', key: 'timeTaken', width: 12 },
        { header: 'Submitted At', key: 'submittedAt', width: 22 }
    ];

    results.forEach(row => {
        sheet.addRow({
            idNumber: row.idNumber || '',
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            quizID: row.quizID || '',
            score: row.score || '',
            correctItems: row.correctItems || '',
            totalItems: row.totalItems || '',
            accuracy: row.accuracy || '',
            timeTaken: row.timeTaken ? formatTime(row.timeTaken) : '',
            submittedAt: row.submittedAt ? new Date(row.submittedAt).toLocaleString() : ''
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="java_leaderboard.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
});

// GET /java-leaderboard/pdf
router.get('/java-leaderboard/pdf', isAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const collection = db.collection('tblQuizLeaderboard');
    const { search = '', dateFrom, dateTo } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { idNumber: { $regex: search, $options: 'i' } },
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { quizID: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    if (dateFrom || dateTo) {
        query.submittedAt = {};
        if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
        if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }

    const results = await collection.find(query).sort({ submittedAt: -1 }).toArray();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="java_leaderboard.pdf"');
    doc.pipe(res);

    doc.fontSize(16).text('Java Activities Leaderboard', { align: 'center' });
    doc.moveDown();

    const headers = [
        'Student ID', 'First Name', 'Last Name', 'Quiz ID', 'Score',
        'Correct Items', 'Total Items', 'Accuracy', 'Time Taken', 'Submitted At'
    ];

    // Table header
    doc.fontSize(10);
    headers.forEach(h => doc.text(h, { continued: true, width: 70 }));
    doc.moveDown();

    // Table rows
    results.forEach(row => {
        doc.text(row.idNumber || '', { continued: true, width: 70 });
        doc.text(row.firstName || '', { continued: true, width: 70 });
        doc.text(row.lastName || '', { continued: true, width: 70 });
        doc.text(row.quizID || '', { continued: true, width: 70 });
        doc.text(row.score?.toString() || '', { continued: true, width: 40 });
        doc.text(row.correctItems?.toString() || '', { continued: true, width: 40 });
        doc.text(row.totalItems?.toString() || '', { continued: true, width: 40 });
        doc.text(row.accuracy?.toString() || '', { continued: true, width: 40 });
        doc.text(row.timeTaken ? formatTime(row.timeTaken) : '', { continued: true, width: 40 });
        doc.text(row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '', { width: 90 });
    });

    doc.end();
});

// GET /java-leaderboard/quizids
router.get('/java-leaderboard/quizids', isAdmin, async (req, res) => {
    const db = req.app.locals.db;
    const collection = db.collection('tblQuizLeaderboard');
    const quizIDs = await collection.distinct('quizID');
    res.json({ quizIDs });
});

// Helper for time formatting
function formatTime(ms) {
    if (!ms || isNaN(ms)) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = router;