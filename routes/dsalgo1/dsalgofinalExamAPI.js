// routes/dsalgo1/dsalgofinalExamAPI.js
const express = require('express');
const router = express.Router();

const DSALGO_COLLECTION = 'dsalgo1_final_students';

function validateStudentInfo(doc) {
  // ... validation logic remains the same ...
}

// No need for createDSALGO1Routes function anymore
// POST /api/activity/dsalgo1-finals/info
router.post('/info', async (req, res) => {
    try {
        const db = req.app.locals.db; // Get db from app locals
        if (!db) {
            return res.status(503).json({ 
                success: false, 
                message: 'Database not available. Please try again.' 
            });
        }
        
        const { action, examID, studentIDNumber } = req.body;

        if (action === 'load') {
            if (!examID || !studentIDNumber) return res.json({ success: false, message: 'Missing fields.' });
            const doc = await db.collection(DSALGO_COLLECTION).findOne({ examID, studentIDNumber });
            return res.json({ success: !!doc, data: doc || null });
        }

        if (action === 'save') {
            // Build doc from request
            const doc = {
                examID: req.body.examID,
                studentIDNumber: req.body.studentIDNumber,
                pageNumber: req.body.pageNumber,
                answers: req.body.answers || {},
                updatedAt: new Date()
            };

            // Fetch existing record
            const existing = await db.collection(DSALGO_COLLECTION).findOne({
                examID: doc.examID,
                studentIDNumber: doc.studentIDNumber
            });

            if (existing) {
                // Do NOT overwrite student info if account exists
                doc.firstName = existing.firstName;
                doc.lastName = existing.lastName;
                doc.section = existing.section;
                doc.email = existing.email;
                doc.examCode = existing.examCode;
                // Merge answers
                doc.answers = { ...(existing.answers || {}), ...(doc.answers || {}) };
                // Merge tabSwitchCount and tabSwitchTimestamps
                doc.tabSwitchCount = (existing.tabSwitchCount || 0) + (req.body.tabSwitchCount || 0);
                doc.tabSwitchTimestamps = [
                    ...(existing.tabSwitchTimestamps || []),
                    ...(req.body.tabSwitchTimestamps || [])
                ];
            } else {
                // If new, set info from request
                doc.firstName = req.body.firstName;
                doc.lastName = req.body.lastName;
                doc.section = req.body.section;
                doc.email = req.body.email;
                doc.examCode = req.body.examCode;
                doc.tabSwitchCount = req.body.tabSwitchCount || 0;
                doc.tabSwitchTimestamps = req.body.tabSwitchTimestamps || [];
            }
            doc.updatedAt = new Date();

            await db.collection(DSALGO_COLLECTION).updateOne(
                { examID: doc.examID, studentIDNumber: doc.studentIDNumber },
                {
                    $set: doc,
                    $setOnInsert: { createdAt: doc.updatedAt }
                },
                { upsert: true }
            );
            return res.json({ success: true });
        }

        return res.json({ success: false, message: 'Invalid action.' });
    } catch (error) {
        console.error('Error in DSALGO1 info route:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// New route for saving activity data
router.post('/activity', async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { studentIDNumber, activityData } = req.body;
        const collection = db.collection('dsalgo1_finals');
        const result = await collection.insertOne({
            studentIDNumber,
            activityData,
            submittedAt: new Date(),
            status: 'submitted'
        });
        res.json({
            success: true,
            message: 'Activity saved successfully',
            id: result.insertedId
        });
    } catch (error) {
        console.error('Error saving activity info:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving activity'
        });
    }
});



// Export the router directly
module.exports = router;