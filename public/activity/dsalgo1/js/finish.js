// Prevent access if no student ID in sessionStorage
if (!sessionStorage.getItem('studentIDNumber')) {
    alert("You must log in with your student ID to access this page.");
    window.location.href = "/activity/dsalgo1/dsalgo1-finals-info.html";
    throw new Error("No student ID in sessionStorage");
}

// Prevent back navigation
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1);
    alert("You cannot go back after submitting your exam.");
};

window.onbeforeunload = function() {
    return "You have already submitted your exam. Reloading is not necessary.";
};

// --- Populate scores ---
async function populateScores() {
    const studentID = sessionStorage.getItem('studentIDNumber');
    const examID = "dsalgo1-finals";
    if (!studentID) return;

    try {
        const res = await fetch('/api/activity/dsalgo1-finals/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'load',
                examID,
                studentIDNumber: studentID
            })
        });
        const data = await res.json();
        if (data.success && data.data) {
            // Populate student info
            document.getElementById('studentIDNumberDisplay').textContent = data.data.studentIDNumber || '[not found]';
            document.getElementById('studentNameDisplay').textContent =
                [data.data.firstName, data.data.lastName].filter(Boolean).join(' ') || '[not found]';
            document.getElementById('sectionDisplay').textContent = data.data.section || '[not found]';

            const answers = data.data.answers;
            document.getElementById('score-part1').textContent = answers['score_part1'] !== undefined ? answers['score_part1'] : 'N/A';
            document.getElementById('score-part2').textContent = answers['score_part2'] !== undefined ? answers['score_part2'] : 'N/A';
            document.getElementById('score-part3').textContent = answers['score_part3'] !== undefined ? answers['score_part3'] : 'N/A';

            // Show both raw and grade for part 4
            let part4Display = 'N/A';
            if (answers['score_part4_raw'] !== undefined && answers['score_part4_max'] !== undefined && answers['score'] !== undefined) {
                part4Display = `${answers['score']} / 50 (Raw: ${answers['score_part4_raw']} / ${answers['score_part4_max']})`;
                document.getElementById('score-part4-max').textContent = '50';
            } else if (answers['score'] !== undefined) {
                part4Display = `${answers['score']} / 3`;
            }
            document.getElementById('score-part4').textContent = part4Display;

            // Calculate total using scaled score for part 4 (can exceed 115)
            let total = 0;
            if (answers['score_part1']) total += Number(answers['score_part1']);
            if (answers['score_part2']) total += Number(answers['score_part2']);
            if (answers['score_part3']) total += Number(answers['score_part3']);
            if (answers['score']) total += Number(answers['score']);
            document.getElementById('score-total').textContent = total;

            // Optionally, show a bonus note if total > 115
            if (total > 115) {
                document.getElementById('score-total').innerHTML += ` <span style="color:#22863a;">(+${(total-115).toFixed(2)} bonus)</span>`;
            }
        }
    } catch (err) {
        // Optionally handle error
    }
}
populateScores();