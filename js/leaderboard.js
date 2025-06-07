// Sample data for the leaderboard
const leaderboardData = generatePlayers(10, 'all'); // Only generate 10 players

// Current page
let currentPage = 1;
const playersPerPage = 7; // Only show 7 in the table (ranks 4-10)

// DOM Elements
const leaderboardBody = document.getElementById('leaderboard-body');

// Generate sample player data
function generatePlayers(count, timeFrame) {
    const players = [];
    const names = [
        'BitMaster', 'CryptoKing', 'BlockGambler', 'SatoshiN', 'Ethereal',
        'WhaleWatcher', 'HODLer', 'MoonLambo', 'AltcoinTrader', 'BullRun2025',
        'FOMO', 'FUDbuster', 'LamboSoon', 'ToTheMoon', 'DiamondHands',
        'PaperHands', 'RektGuy', 'WAGMI', 'NGMI', 'GM'
    ];

    for (let i = 0; i < count; i++) {
        const nameIndex = i % names.length;
        const randomSuffix = Math.floor(Math.random() * 1000);
        players.push({
            name: `${names[nameIndex]}${randomSuffix}`,
            amount: (Math.random() * 10).toFixed(2),
            avatar: `https://i.pravatar.cc/150?img=${i % 70 + 1}`,
            timeFrame: timeFrame
        });
    }
    
    return players;
}

// Switch between game tabs
function switchGameTab(game) {
    // Hide all leaderboards
    document.querySelectorAll('.game-leaderboard').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected leaderboard or not available message
    const leaderboardElement = document.getElementById(`${game}-leaderboard`);
    if (leaderboardElement) {
        leaderboardElement.style.display = 'block';
    }
    
    // Update active tab
    document.querySelectorAll('.game-tab').forEach(tab => {
        if (tab.dataset.game === game) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // If switching to Rust Magic, update the leaderboard
    if (game === 'rust-magic') {
        updateLeaderboard();
    }
}

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', () => {
    // Start the countdown timer
    updateCountdown();
    
    // Update the leaderboard with initial data
    updateLeaderboard();
    
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
            avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`
        });
    }
    
    // Sort by amount in descending order (highest amount first)
    return players.sort((a, b) => b.amount - a.amount);
}

// Update the leaderboard table
function updateLeaderboard() {
    // Clear existing rows
    leaderboardBody.innerHTML = '';
    
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
        if (rank === 1) prize = '200';
        else if (rank === 2) prize = '100';
        else if (rank === 3) prize = '50';
        else if (rank === 4) prize = '35';
        else if (rank === 5) prize = '15';
        else prize = 'Free Battle'; // Changed from '0' to 'Free Battle' for ranks 6-10
        row.innerHTML = `
            <div class="rank">#${rank}</div>
            <div class="player">
                <div class="player-avatar-sm">
                    <img src="images/default-avatar.png" alt="Player">
                </div>
                <span class="player-name">-</span>
            </div>
            <div class="wagered">
                <span class="coin-amount">-</span>
                <img src="images/rust-magic-coin.svg" alt="Coin" class="coin-icon">
            </div>
            <div class="prize">
                <span class="prize-amount">${prize}</span>
                ${prize !== 'Free Battle' ? '<img src="images/rust-magic-coin.svg" alt="Prize" class="coin-icon">' : ''}
            </div>
        `;
        
        leaderboardBody.appendChild(row);
    });
    
}


// Update the countdown timer
function updateCountdown() {
    // Set the target date to June 15, 2025 23:59:59 UTC
    const targetDate = new Date('2025-06-15T23:59:59Z').getTime();
    
    // Update the countdown every second
    const countdownInterval = setInterval(() => {
        // Get current date and time
        const now = new Date().getTime();
        
        // Calculate remaining time
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
        
        // Display the countdown
        const countdownElement = document.querySelector('.leaderboard-timer span');
        if (countdownElement) {
            countdownElement.textContent = `Ends in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
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
