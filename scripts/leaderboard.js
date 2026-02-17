// Load and populate leaderboard table
async function loadLeaderboard() {
    try {
        const response = await fetch('./model_scores_summary.json');
        const data = await response.json();
        
        // Flatten all model reports into a single array
        const allReports = [];
        data.models.forEach(modelData => {
            modelData.reports.forEach(report => {
                const adversarial = report.adversarial_score;
                const benign = report.benign_score;
                const average = (adversarial + benign) / 2;
                
                allReports.push({
                    model: modelData.model,
                    seed: report.seed || '-',
                    adversarialScore: adversarial,
                    benignScore: benign,
                    averageScore: average
                });
            });
        });
        
        // Sort by average score (ascending - lower is better)
        allReports.sort((a, b) => a.averageScore - b.averageScore);
        
        // Populate table
        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = allReports.map((report, index) => {
            const tooltipText = report.seed !== '-' ? `Seed: ${report.seed}` : 'Seed: Not specified';
            return `
            <tr class="tw-border-t tw-border-gray-200 dark:tw-border-[#2a2a2a] hover:tw-bg-gray-50 dark:hover:tw-bg-[#1a1a1a] tw-transition-colors tw-cursor-help" title="${tooltipText}">
                <td class="tw-p-4 tw-text-gray-800 dark:tw-text-gray-200">${index + 1}</td>
                <td class="tw-p-4 tw-font-medium tw-text-gray-900 dark:tw-text-white">${report.model}</td>
                <td class="tw-p-4 tw-text-center tw-font-semibold tw-text-blue-600 dark:tw-text-blue-400">${report.averageScore.toFixed(2)}%</td>
                <td class="tw-p-4 tw-text-center tw-font-semibold tw-text-red-600 dark:tw-text-red-400">${report.adversarialScore.toFixed(2)}%</td>
                <td class="tw-p-4 tw-text-center tw-font-semibold tw-text-green-600 dark:tw-text-green-400">${report.benignScore.toFixed(2)}%</td>
            </tr>
        `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        document.getElementById('leaderboard-body').innerHTML = `
            <tr>
                <td colspan="5" class="tw-p-8 tw-text-center tw-text-gray-600 dark:tw-text-gray-400">
                    Unable to load leaderboard data. Please ensure model_scores_summary.json is available.
                </td>
            </tr>
        `;
    }
}

// Load leaderboard when page loads
document.addEventListener('DOMContentLoaded', loadLeaderboard);
