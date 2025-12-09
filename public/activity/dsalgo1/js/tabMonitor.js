// Restore tab switch count and timestamps from sessionStorage
window.tabSwitchCount = Number(sessionStorage.getItem('tabSwitchCount')) || 0;
window.tabSwitchTimestamps = JSON.parse(sessionStorage.getItem('tabSwitchTimestamps') || '[]');
window.isNavigatingAway = false;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !window.isNavigatingAway) {
        window.tabSwitchCount++;
        window.tabSwitchTimestamps.push(new Date().toISOString());
        sessionStorage.setItem('tabSwitchCount', window.tabSwitchCount);
        sessionStorage.setItem('tabSwitchTimestamps', JSON.stringify(window.tabSwitchTimestamps));
        alert('You have switched away from the exam tab. Please return to continue.');
    }
});

window.resetTabMonitor = function() {
    window.tabSwitchCount = 0;
    window.tabSwitchTimestamps = [];
    sessionStorage.setItem('tabSwitchCount', '0');
    sessionStorage.setItem('tabSwitchTimestamps', '[]');
};


