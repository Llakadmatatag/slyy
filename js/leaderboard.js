// Google Sheets configuration
const SPREADSHEET_ID = '1gMu94km0C4eI-4YZgAOrvDaIrC2GzVIzLVX6K_i9E7U';
const SHEET_NAME = 'Rust Magic';
const USERNAME_RANGE = 'B2:B11';
const WAGERED_RANGE = 'E2:E11';

// Leaderboard data
let leaderboardData = [];

// DOM Elements
const leaderboardBody = document.getElementById('leaderboard-body');

// Fetch data from Google Sheets
async function fetchLeaderboardData() {
    try {
        // Get usernames
        const usernamesUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&range=${USERNAME_RANGE}`;
        const wageredUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&range=${WAGERED_RANGE}`;
        
        const [usernamesResponse, wageredResponse] = await Promise.all([
            fetch(usernamesUrl),
            fetch(wageredUrl)
        ]);
        
        if (!usernamesResponse.ok || !wageredResponse.ok) {
            throw new Error('Failed to fetch data from Google Sheets');
        }
        
        const usernamesText = await usernamesResponse.text();
        const wageredText = await wageredResponse.text();
        
        // Extract data from the response
        const parseResponse = (text) => {
            const jsonStr = text.match(/\{.*\}/s)[0];
            return JSON.parse(jsonStr);
        };
        
        const usernamesData = parseResponse(usernamesText);
        const wageredData = parseResponse(wageredText);
        
        // Process the data
        const players = [];
        const rows = Math.min(
            usernamesData.table.rows.length,
            wageredData.table.rows.length,
            10 // Max 10 players as per ranges
        );
        
        for (let i = 0; i < rows; i++) {
            const username = usernamesData.table.rows[i]?.c?.[0]?.v || `Player ${i + 1}`;
            const wagered = parseFloat(wageredData.table.rows[i]?.c?.[0]?.v) || 0;
            
            if (username) {
                players.push({
                    name: username,
                    amount: wagered,
                    avatar: 'images/ava.png',
                    score: wagered // Using wagered amount as score for sorting
                });
            }
        }
        
        // Sort by wagered amount in descending order
        return players.sort((a, b) => b.amount - a.amount);
        
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        return [];
    }
}

// Switch between game tabs
function switchGameTab(game) {
    // Hide all leaderboards, decorations, and rain effects
    document.querySelectorAll('.game-leaderboard').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // Hide all rain effect containers
    document.querySelectorAll('.fullscreen-rain-container').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show the rain effect for the selected game
    const rainContainer = document.querySelector(`#${game}-rain`);
    if (rainContainer) {
        rainContainer.parentElement.style.display = 'block';
    }
    
    // Show selected leaderboard and activate its decorations
    const leaderboardElement = document.getElementById(`${game}-leaderboard`);
    if (leaderboardElement) {
        leaderboardElement.style.display = 'block';
        leaderboardElement.classList.add('active');
    }
    
    // Update active tab
    document.querySelectorAll('.game-tab').forEach(tab => {
        if (tab.dataset.game === game) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update the leaderboard for the selected game
    updateLeaderboard();
}

// Function to refresh leaderboard data
async function refreshLeaderboard() {
    try {
        const newData = await fetchLeaderboardData();
        if (newData && newData.length > 0) {
            leaderboardData = newData;
            updateLeaderboard();
        }
    } catch (error) {
        console.error('Error refreshing leaderboard data:', error);
    }
}

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', async () => {
    // Start the countdown timer
    updateCountdown();
    
    // Initial data load
    try {
        await refreshLeaderboard();
    } catch (error) {
        console.error('Failed to load leaderboard data:', error);
        leaderboardBody.innerHTML = '<div class="error-message">Failed to load leaderboard data. Please try again later.</div>';
    }
    
    // Set up auto-refresh every 15 minutes (900,000 milliseconds)
    setInterval(refreshLeaderboard, 15 * 60 * 1000);
    
    // Set up event listeners for game tabs
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const game = tab.getAttribute('data-game');
            switchGameTab(game);
        });
    });
});

// Generate sample player data
function generatePlayers(count, timeFrame) {
    const players = [];
    const names = [
        'CryptoKing', 'JaneDoe42', 'BlockGambler', 'SatoshiNakamoto', 'VitalikButerin',
        'CryptoSamurai', 'DegenGambler', 'LuckyLarry', 'MoonLambo', 'HODLer',
        'ToTheMoon', 'WhaleWatcher', 'DiamondHands', 'PaperHands', 'FOMOtrader',
        'BitcoinMaxi', 'EtherealGamer', 'NFTCollector', 'DeFiDegen', 'RektScientist',
        'WAGMI', 'GM', 'WenMoon', 'Ser', 'ApeGang'
    ];
    
    for (let i = 0; i < count; i++) {
        const name = names[Math.floor(Math.random() * names.length)] + (i % 5 === 0 ? i : '');
        const wins = Math.floor(Math.random() * 200) + 1;
        const amount = (Math.random() * 15 + 0.1).toFixed(2);
        let score;
        
        // Adjust score range based on time frame for variety
        switch(timeFrame) {
            case 'daily':
                score = Math.floor(Math.random() * 5000) + 1000;
                break;
            case 'weekly':
                score = Math.floor(Math.random() * 15000) + 5000;
                break;
            case 'monthly':
                score = Math.floor(Math.random() * 50000) + 15000;
                break;
            case 'all':
            default:
                score = Math.floor(Math.random() * 100000) + 50000;
        }
        
        players.push({
            id: i + 1,
            name,
            wins,
            amount: parseFloat(amount), // Convert to number for proper sorting
            score,
            avatar: 'images/ava.png'
        });
    }
    
    // Sort by amount in descending order (highest amount first)
    return players.sort((a, b) => b.amount - a.amount);
}

// Update the leaderboard table
function updateLeaderboard() {
    // Clear existing rows
    leaderboardBody.innerHTML = '';
    
    if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardBody.innerHTML = '<div class="no-data">No leaderboard data available</div>';
        return;
    }
    
    // Show only ranks 4-10 (7 players total)
    const startIndex = 3; // Start from rank 4 (0-based index 3)
    const endIndex = 10;  // End at rank 10
    const currentPlayers = leaderboardData.slice(startIndex, endIndex);
    
    // Add rows to the table
    currentPlayers.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'table-row';
        const rank = startIndex + index + 1; // Start from rank 4
        let prize = '0';
        if (rank === 1) prize = '250';
        else if (rank === 2) prize = '120';
        else if (rank === 3) prize = '65';
        else if (rank === 4) prize = '45';
        else if (rank === 5) prize = '20';
        else prize = 'Free Battle';
        
        row.innerHTML = `
            <div class="rank">#${rank}</div>
            <div class="player">
                <div class="player-avatar-sm">
                    <img src="${player.avatar}" alt="${player.name}">
                </div>
                <span class="player-name">${player.name}</span>
            </div>
            <div class="wagered">
                <span class="coin-amount">${player.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <img src="images/rust-magic-coin.svg" alt="Coin" class="coin-icon">
            </div>
            <div class="prize">
                <span class="prize-amount">${prize}</span>
                ${prize !== 'Free Battle' ? '<img src="images/rust-magic-coin.svg" alt="Prize" class="coin-icon">' : ''}
            </div>
        `;
        
        leaderboardBody.appendChild(row);
    });
    
    // Update the top 3 players in the podium
    updatePodium();
}

// Update the top 3 players in the podium
function updatePodium() {
    if (!leaderboardData || leaderboardData.length === 0) return;
    
    const prizes = [250, 120, 65];
    
    // Update each podium position
    for (let i = 0; i < 3; i++) {
        const player = leaderboardData[i];
        if (!player) continue;
        
        const podiumItem = document.querySelector(`.podium-item:nth-child(${i + 1})`);
        if (!podiumItem) continue;
        
        const playerName = podiumItem.querySelector('.player-name');
        const wageredValue = podiumItem.querySelector('.wagered-item .stat-value');
        const prizeValue = podiumItem.querySelector('.prize-item .stat-value');
        const avatarImg = podiumItem.querySelector('.avatar-img');
        
        if (playerName) playerName.textContent = player.name;
        if (wageredValue) wageredValue.innerHTML = `${player.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}<img src="images/rust-magic-coin.svg" alt="Wagered" class="coin-icon">`;
        if (prizeValue) prizeValue.innerHTML = `${prizes[i]}<img src="images/rust-magic-coin.svg" alt="Prize" class="coin-icon">`;
        if (avatarImg) avatarImg.src = player.avatar;
    }
}


// Update the countdown timer
function updateCountdown() {
    // Set the target date to July 1, 2025 6:00 AM EST (UTC-4)
    // Create a date object for the target time in EST
    const targetDate = new Date('2025-07-01T06:00:00-04:00');
    
    // Update the countdown every second
    const countdownInterval = setInterval(() => {
        // Get current date and time in local time
        const now = new Date();
        
        // Calculate remaining time in milliseconds
        const distance = targetDate - now;
        
        // If countdown is over
        if (distance < 0) {
            clearInterval(countdownInterval);
            const timerElement = document.querySelector('.leaderboard-timer');
            if (timerElement) {
                timerElement.innerHTML = '<i class="fas fa-flag-checkered"></i> <span>Leaderboard has ended!</span>';
            }
            return;
        }
        
        // Calculate days, hours, minutes, seconds
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update the countdown display
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Adjust for fixed header
                behavior: 'smooth'
            });
        }
    });
});
