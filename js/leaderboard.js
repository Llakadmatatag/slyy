// Google Sheets configuration
const SPREADSHEET_ID = '1gMu94km0C4eI-4YZgAOrvDaIrC2GzVIzLVX6K_i9E7U';
const SHEET_NAME = 'Rust Magic';
// Mengambil semua data dari kolom B (username) dan E (wagered) mulai dari baris 2
const USERNAME_RANGE = 'B2:B';
const WAGERED_RANGE = 'E2:E';

// Leaderboard data
let leaderboardData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// DOM Elements
const leaderboardBody = document.getElementById('leaderboard-body');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const paginationContainer = document.createElement('div');
paginationContainer.className = 'pagination';
leaderboardBody.parentNode.insertBefore(paginationContainer, leaderboardBody.nextSibling);

// Search functionality
let searchQuery = '';

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
            wageredData.table.rows.length
            // Menghapus batas 10 pemain untuk mengambil semua data
        );
        
        for (let i = 0; i < rows; i++) {
            const username = usernamesData.table.rows[i]?.c?.[0]?.v || `Player ${i + 1}`;
            const wagered = parseFloat(wageredData.table.rows[i]?.c?.[0]?.v) || 0;
            
            // Hanya tambahkan jika username tidak kosong dan jumlah taruhan valid
            if (username && !isNaN(wagered) && wagered > 0) {
                players.push({
                    name: username,
                    amount: wagered,
                    avatar: 'images/ava.png',
                    score: wagered, // Using wagered amount as score for sorting
                    originalRank: i + 1 // Menyimpan peringkat asli
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
    
    // Search functionality
    const searchDebounce = debounce(() => {
        searchQuery = searchInput.value.trim();
        currentPage = 1; // Reset to first page when searching
        updateLeaderboard();
        
        // Show/hide clear button
        if (searchQuery) {
            clearSearchBtn.classList.add('visible');
        } else {
            clearSearchBtn.classList.remove('visible');
        }
    }, 300);
    
    searchInput.addEventListener('input', searchDebounce);
    
    // Clear search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.classList.remove('visible');
        currentPage = 1;
        updateLeaderboard();
    });
    
    // Clear search when pressing escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchQuery) {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.remove('visible');
            currentPage = 1;
            updateLeaderboard();
        }
    });
});

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
    
        // Filter players based on search query
    let filteredPlayers = [...leaderboardData];
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPlayers = leaderboardData.filter(player => 
            player.name.toLowerCase().includes(query)
        );
    }
    
    // Skip first 3 players (ranks 1-3) if not searching
    const playersToShow = searchQuery ? filteredPlayers : filteredPlayers.slice(3);
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const totalPages = Math.ceil(playersToShow.length / ITEMS_PER_PAGE);
    
    // Show players for current page
    const currentPlayers = playersToShow.slice(startIndex, endIndex);
    
    // Add rows to the table
    currentPlayers.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        // Use the original rank from the data
        const rank = player.originalRank;
        let prize = '-';
        if (rank === 1) prize = '250';
        else if (rank === 2) prize = '120';
        else if (rank === 3) prize = '65';
        else if (rank === 4) prize = '45';
        else if (rank === 5) prize = '20';
        else if (rank <= 10) prize = 'Free Battle';
        // Untuk peringkat 11+ nilai prize tetap '-'
        
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
    
    // Update pagination controls
    updatePaginationControls(totalPages);
    
    // Update the top 3 players in the podium
    updatePodium();
}

// Update pagination controls
function updatePaginationControls(totalPages) {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return; // Don't show pagination if only one page
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo; Prev';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateLeaderboard();
            window.scrollTo({ top: leaderboardBody.offsetTop - 100, behavior: 'smooth' });
        }
    });
    
    // Page numbers
    const pageNumbers = document.createElement('div');
    pageNumbers.className = 'page-numbers';
    
    // Show up to 5 page numbers around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === currentPage ? 'active' : '';
        pageButton.addEventListener('click', () => {
            currentPage = i;
            updateLeaderboard();
            window.scrollTo({ top: leaderboardBody.offsetTop - 100, behavior: 'smooth' });
        });
        pageNumbers.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Next &raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateLeaderboard();
            window.scrollTo({ top: leaderboardBody.offsetTop - 100, behavior: 'smooth' });
        }
    });
    
    // Add all elements to pagination container
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageNumbers);
    paginationContainer.appendChild(nextButton);
    
    // Add pagination info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);
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
    // Set the target date to July 15, 2025 6:00 AM EST (UTC-4)
    // Create a date object for the target time in EST
    const targetDate = new Date('2025-07-15T06:00:00-04:00');
    
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
