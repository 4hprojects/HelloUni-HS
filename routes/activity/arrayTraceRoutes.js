const express = require('express');
const router = express.Router();

router.post('/submit-score', async (req, res) => {
    const db = req.app.locals.db; // Use the db reference from app.locals
    const { studentIDNumber, email, fullname, score, total, percent, answers, timestamp } = req.body;

    if (!studentIDNumber || !email || !fullname || typeof score !== 'number' || typeof total !== 'number' || typeof percent !== 'number' || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        await db.collection('array_trace_results').insertOne({
            studentIDNumber,
            email,
            fullname,
            score,
            total,
            percent, // <-- Add this line
            answers,
            timestamp: timestamp || new Date().toISOString()
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;