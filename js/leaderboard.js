// Google Sheets configuration
const RUST_MAGIC_SPREADSHEET_ID = '1gMu94km0C4eI-4YZgAOrvDaIrC2GzVIzLVX6K_i9E7U';
const UPGRADER_SPREADSHEET_ID = '1bGaY5TLH12imXvkPTTb7lQrApi-SbDQjIqwEZtHDELU';

const SHEETS = {
    'rust-magic': {
        spreadsheetId: RUST_MAGIC_SPREADSHEET_ID,
        name: 'Rust Magic',
        usernameColumn: 'B',
        wageredColumn: 'E',
        sheetName: 'Rust Magic'
    },
    'upgrader': {
        spreadsheetId: UPGRADER_SPREADSHEET_ID,
        name: 'Upgrader',
        usernameColumn: 'A',
        wageredColumn: 'B',
        sheetName: 'Upgrader'
    },
};

// DOM Elements and state for each game
const gameStates = {
    'rust-magic': {
        leaderboardBody: null,
        searchInput: null,
        clearSearchBtn: null,
        searchQuery: '',
        currentPage: 1,
        data: []
    },
    'upgrader': {
        leaderboardBody: null,
        searchInput: null,
        clearSearchBtn: null,
        searchQuery: '',
        currentPage: 1,
        data: []
    },
};

let currentGame = 'rust-magic';
const ITEMS_PER_PAGE = 10;

// Fetch data from Google Sheets
async function fetchLeaderboardData(game = currentGame) {
    try {
        // Handle CSGold with dummy data if needed
        if (game === 'csgold' && !SHEETS['csgold'].spreadsheetId) {
            console.log('Using dummy data for CSGold');
            return generatePlayers(13, 'all');
        }

        const sheet = SHEETS[game];
        if (!sheet) {
            throw new Error('Invalid game selected');
        }

        console.log(`Fetching data for ${game}:`, {
            spreadsheetId: sheet.spreadsheetId,
            sheetName: sheet.sheetName || sheet.name,
            usernameColumn: sheet.usernameColumn,
            wageredColumn: sheet.wageredColumn
        });

        // Get usernames and wagered amounts
        const usernamesUrl = `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheet.sheetName || sheet.name)}&range=${sheet.usernameColumn}2:${sheet.usernameColumn}`;
        const wageredUrl = `https://docs.google.com/spreadsheets/d/${sheet.spreadsheetId}/gviz/tq?sheet=${encodeURIComponent(sheet.sheetName || sheet.name)}&range=${sheet.wageredColumn}2:${sheet.wageredColumn}`;
        
        console.log('Fetching from URLs:', {
            usernamesUrl,
            wageredUrl
        });

        const [usernamesResponse, wageredResponse] = await Promise.all([
            fetch(usernamesUrl),
            fetch(wageredUrl)
        ]);
        
        if (!usernamesResponse.ok || !wageredResponse.ok) {
            console.error('Response status:', {
                usernames: usernamesResponse.status,
                wagered: wageredResponse.status
            });
            throw new Error('Failed to fetch data from Google Sheets');
        }
        
        const usernamesText = await usernamesResponse.text();
        const wageredText = await wageredResponse.text();
        
        console.log('Raw responses:', {
            usernamesText: usernamesText.substring(0, 200) + '...',
            wageredText: wageredText.substring(0, 200) + '...'
        });

        // Extract data from the response
        const parseResponse = (text) => {
            const jsonMatch = text.match(/\{.*\}/s);
            if (!jsonMatch) {
                console.error('Failed to match JSON in response:', text.substring(0, 200));
                throw new Error('Invalid response format');
            }
            const jsonStr = jsonMatch[0];
            return JSON.parse(jsonStr);
        };
        
        const usernamesData = parseResponse(usernamesText);
        const wageredData = parseResponse(wageredText);
        
        console.log('Parsed data:', {
            usernames: usernamesData.table.rows.length + ' rows',
            wagered: wageredData.table.rows.length + ' rows'
        });

        // Process the data
        const players = [];
        const rows = Math.min(
            usernamesData.table.rows.length,
            wageredData.table.rows.length
        );
        
        for (let i = 0; i < rows; i++) {
            const username = usernamesData.table.rows[i]?.c?.[0]?.v || `Player ${i + 1}`;
            let wagered = wageredData.table.rows[i]?.c?.[0]?.v || '0';
            
            // Handle currency format if the value is a string
            if (typeof wagered === 'string') {
                // Remove currency symbol and any other non-numeric characters except decimal point
                wagered = parseFloat(wagered.replace(/[^0-9.-]+/g, ''));
            }
            
            // Log raw and processed wagered values for debugging
            console.log(`Row ${i + 1}:`, {
                username,
                rawWagered: wageredData.table.rows[i]?.c?.[0]?.v,
                processedWagered: wagered
            });
            
            // Hanya tambahkan jika username tidak kosong dan jumlah taruhan valid
            if (username && !isNaN(wagered) && wagered > 0) {
                players.push({
                    name: username,
                    amount: wagered,
                    avatar: 'images/ava.png',
                    score: wagered,
                    originalRank: i + 1
                });
            }
        }
        
        console.log(`Processed ${players.length} valid players for ${game}`);
        
        // Sort by wagered amount in descending order
        return players.sort((a, b) => b.amount - a.amount);
        
    } catch (error) {
        console.error(`Error fetching ${game} leaderboard data:`, error);
        return [];
    }
}

// Switch between game tabs
async function switchGameTab(game) {
    currentGame = game;
    
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
    
    // Fetch and update the leaderboard for the selected game
    try {
        const newData = await fetchLeaderboardData(game);
        if (newData && newData.length > 0) {
            gameStates[game].data = newData;
            gameStates[game].currentPage = 1; // Reset to first page when switching games
            updateLeaderboard();
        }
    } catch (error) {
        console.error('Error loading leaderboard data:', error);
        if (gameStates[game].leaderboardBody) {
            gameStates[game].leaderboardBody.innerHTML = '<div class="error-message">Failed to load leaderboard data. Please try again later.</div>';
        }
    }
}

// Initialize game-specific elements
function initializeGameElements() {
    Object.keys(gameStates).forEach(game => {
        // Menggunakan parent container untuk memastikan kita mendapatkan elemen yang benar
        const gameContainer = document.getElementById(`${game}-leaderboard`);
        if (gameContainer) {
            // Mencari elemen dalam konteks game container yang spesifik
            gameStates[game].leaderboardBody = gameContainer.querySelector('.table-body');
            gameStates[game].searchInput = gameContainer.querySelector('.search-box input');
            gameStates[game].clearSearchBtn = gameContainer.querySelector('.clear-btn');
            gameStates[game].paginationContainer = gameContainer.querySelector('.pagination') || 
                                                 document.createElement('div');
            
            if (!gameContainer.querySelector('.pagination')) {
                gameStates[game].paginationContainer.className = 'pagination';
                gameStates[game].leaderboardBody.parentNode.insertBefore(
                    gameStates[game].paginationContainer, 
                    gameStates[game].leaderboardBody.nextSibling
                );
            }

            console.log(`Initialized elements for ${game}:`, {
                leaderboardBody: gameStates[game].leaderboardBody ? 'found' : 'not found',
                searchInput: gameStates[game].searchInput ? 'found' : 'not found',
                clearSearchBtn: gameStates[game].clearSearchBtn ? 'found' : 'not found'
            });

            // Set up search functionality for this game
            if (gameStates[game].searchInput && gameStates[game].clearSearchBtn) {
                const searchDebounce = debounce(() => {
                    gameStates[game].searchQuery = gameStates[game].searchInput.value.trim();
                    gameStates[game].currentPage = 1;
                    if (game === currentGame) {
                        updateLeaderboard();
                    }
                    
                    if (gameStates[game].searchQuery) {
                        gameStates[game].clearSearchBtn.classList.add('visible');
                    } else {
                        gameStates[game].clearSearchBtn.classList.remove('visible');
                    }
                }, 300);

                gameStates[game].searchInput.addEventListener('input', searchDebounce);
                
                gameStates[game].clearSearchBtn.addEventListener('click', () => {
                    gameStates[game].searchInput.value = '';
                    gameStates[game].searchQuery = '';
                    gameStates[game].clearSearchBtn.classList.remove('visible');
                    gameStates[game].currentPage = 1;
                    if (game === currentGame) {
                        updateLeaderboard();
                    }
                });
            }
        } else {
            console.error(`Container not found for game: ${game}`);
        }
    });
}

// Update the leaderboard table
function updateLeaderboard() {
    const state = gameStates[currentGame];
    const leaderboardBody = state.leaderboardBody;
    
    if (!leaderboardBody) {
        console.error(`Leaderboard body not found for ${currentGame}`);
        return;
    }

    // Clear existing rows
    leaderboardBody.innerHTML = '';
    
    if (!state.data || state.data.length === 0) {
        if (currentGame === 'rust-magic') {
            leaderboardBody.innerHTML = '<div class="no-data">No leaderboard data available</div>';
            return;
        } else {
            // For Upgrader and CSGold, create empty rows for ranks 4-13
            for (let i = 4; i <= 13; i++) {
                createLeaderboardRow({
                    originalRank: i,
                    name: '-',
                    amount: 0,
                    avatar: 'images/ava.png'
                }, i);
            }
            // Update pagination for empty state
            updatePaginationControls(1);
            return;
        }
    }

    console.log(`Updating leaderboard for ${currentGame} with ${state.data.length} players`);
    
    // Filter players based on search query
    let filteredPlayers = [...state.data];
    
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredPlayers = state.data.filter(player => 
            player.name.toLowerCase().includes(query)
        );
    }
    
    // Get the top 3 players (for podium)
    const top3Players = filteredPlayers.slice(0, 3);
    
    // Filter out top 3 players from the main table if not searching
    const playersToShow = state.searchQuery 
        ? filteredPlayers 
        : filteredPlayers.filter((_, index) => index >= 3);
    
    // Calculate pagination for all games
    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    // For all games, use the same pagination logic as Rust Magic
    // Filter out top 3 players from the main table if not searching
    const playersToShowInTable = state.searchQuery 
        ? filteredPlayers 
        : filteredPlayers.filter((_, index) => index >= 3);
    
    // Get players for current page
    const currentPlayers = playersToShowInTable.slice(startIndex, endIndex);
    const totalPages = Math.max(1, Math.ceil(playersToShowInTable.length / ITEMS_PER_PAGE));
    
    // If no players on current page but not on first page, go to last page
    if (currentPlayers.length === 0 && state.currentPage > 1) {
        state.currentPage = Math.max(1, totalPages);
        return updateLeaderboard(); // Recursively call with updated page
    }
    
    // Check if current game is upgrader for currency display
    const isUpgrader = currentGame === 'upgrader';
    
    // Create a row in the leaderboard
    function createLeaderboardRow(player, rank) {
        const row = document.createElement('div');
        row.className = 'table-row';
        
        // Determine prize based on rank and game
        let prize = '-';
        // Custom prize structure for each game
        if (currentGame === 'upgrader') {
            if (rank === 1) prize = '100';
            else if (rank === 2) prize = '75';
            else if (rank === 3) prize = '50';
            else if (rank === 4) prize = '15';
            else if (rank === 5) prize = '10';
            // No prize for ranks 6 and above
        } else {
            // Default prizes for other games
            if (rank === 1) prize = '600';
            else if (rank === 2) prize = '300';
            else if (rank === 3) prize = '150';
            else if (rank === 4) prize = '75';
            else if (rank === 5) prize = '25';
            else if (rank <= 10) prize = 'Free Battle';
        }
        
        row.innerHTML = `
            <div class="rank">#${rank}</div>
            <div class="player">
                <div class="player-avatar-sm">
                    <img src="${player.avatar}" alt="${player.name}">
                </div>
                <span class="player-name">${player.name}</span>
            </div>
            <div class="wagered">
                <span class="coin-amount">
                    ${currentGame === 'upgrader' ? '$' : ''}${player.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    ${currentGame === 'rust-magic' ? '<img src="images/rust-magic-coin.svg" alt="Coin" class="coin-icon">' : ''}
                    ${currentGame === 'csgold' ? '<img src="images/csgold-logo.png" alt="CSGold" class="csgold-coin-icon">' : ''}
                </span>
            </div>
            <div class="prize">
                <span class="prize-amount">
                    ${prize === 'Free Battle' ? prize : `${currentGame === 'upgrader' ? '$' : ''}${prize}`}
                    ${currentGame === 'rust-magic' && prize !== 'Free Battle' ? '<img src="images/rust-magic-coin.svg" alt="Prize" class="coin-icon">' : ''}
                    ${currentGame === 'csgold' && prize !== 'Free Battle' ? '<img src="images/csgold-logo.png" alt="CSGold" class="csgold-coin-icon">' : ''}
                </span>
            </div>
        `;
        
        leaderboardBody.appendChild(row);
    }
    
    // Add rows to the table
    currentPlayers.forEach((player) => {
        createLeaderboardRow(player, player.originalRank);
    });
    
    // Update pagination controls
    updatePaginationControls(totalPages);
    
    // Update the top 3 players in the podium
    updatePodium();
}

// Update pagination controls
function updatePaginationControls(totalPages) {
    const state = gameStates[currentGame];
    const gameContainer = document.getElementById(`${currentGame}-leaderboard`);
    if (!gameContainer) return;
    
    // Find or create pagination container
    let paginationContainer = gameContainer.querySelector('.pagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        state.leaderboardBody.parentNode.insertBefore(paginationContainer, state.leaderboardBody.nextSibling);
    }
    
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return; // Don't show pagination if only one page
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo; Prev';
    prevButton.disabled = state.currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            updateLeaderboard();
            window.scrollTo({ top: state.leaderboardBody.offsetTop - 100, behavior: 'smooth' });
        }
    });
    
    // Page numbers
    const pageNumbers = document.createElement('div');
    pageNumbers.className = 'page-numbers';
    
    // Show up to 5 page numbers around current page
    const startPage = Math.max(1, state.currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = i === state.currentPage ? 'active' : '';
        pageButton.addEventListener('click', () => {
            state.currentPage = i;
            updateLeaderboard();
            window.scrollTo({ top: state.leaderboardBody.offsetTop - 100, behavior: 'smooth' });
        });
        pageNumbers.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Next &raquo;';
    nextButton.disabled = state.currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (state.currentPage < totalPages) {
            state.currentPage++;
            updateLeaderboard();
            window.scrollTo({ top: state.leaderboardBody.offsetTop - 100, behavior: 'smooth' });
        }
    });
    
    // Add all elements to pagination container
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageNumbers);
    paginationContainer.appendChild(nextButton);
    
    // Add pagination info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    paginationContainer.appendChild(pageInfo);
}

// Update the top 3 players in the podium
function updatePodium() {
    const state = gameStates[currentGame];
    if (!state.data || state.data.length === 0) return;
    
    // Get game container
    const gameContainer = document.getElementById(`${currentGame}-leaderboard`);
    if (!gameContainer) return;
    
    // Get game-specific prizes and currency symbol
    const isUpgrader = currentGame === 'upgrader';
    const prizes = isUpgrader 
        ? ['$100', '$75', '$50']  // Upgrader prizes with $ symbol
        : [600, 300, 150]; // Rust Magic prizes (keep as numbers for coin display)
    
    // Update each podium position
    for (let i = 0; i < 3; i++) {
        const player = state.data[i];
        if (!player) continue;
        
        const podiumItem = gameContainer.querySelector(`.podium-item:nth-child(${i + 1})`);
        if (!podiumItem) continue;
        
        const playerName = podiumItem.querySelector('.player-name');
        const wageredValue = podiumItem.querySelector('.wagered-item .stat-value');
        const prizeValue = podiumItem.querySelector('.prize-item .stat-value');
        const avatarImg = podiumItem.querySelector('.avatar-img');
        
        if (playerName) playerName.textContent = player.name;
        if (wageredValue) {
            if (currentGame === 'upgrader') {
                wageredValue.innerHTML = `$${player.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            } else if (currentGame === 'csgold') {
                wageredValue.innerHTML = `${player.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}<img src="images/csgold-logo.png" alt="CSGold" class="csgold-coin-icon">`;
            } else {
                wageredValue.innerHTML = `${player.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}<img src="images/rust-magic-coin.svg" alt="Wagered" class="coin-icon">`;
            }
        }
        if (prizeValue) {
            if (currentGame === 'upgrader') {
                prizeValue.innerHTML = prizes[i];
            } else if (currentGame === 'csgold') {
                const prize = prizes[i] === 'Free Battle' ? 'Free Battle' : `${prizes[i]}<img src="images/csgold-logo.png" alt="CSGold" class="csgold-coin-icon">`;
                prizeValue.innerHTML = prize;
            } else {
                prizeValue.innerHTML = `${prizes[i]}<img src="images/rust-magic-coin.svg" alt="Prize" class="coin-icon">`;
            }
        }
        if (avatarImg) avatarImg.src = player.avatar;
    }

    console.log(`Updated podium for ${currentGame} with ${state.data.length} players`);
}


// Update countdown timers for all games
function updateCountdown() {
    // Define countdown targets for each game
    const countdownTargets = {
        'rust-magic': new Date('2025-07-31T06:00:00-04:00'), // Updated to July 30, 2025 06:00 AM EST
        'upgrader': new Date('2025-07-27T06:00:00-04:00'), // July 27, 2025 06:00 AM EST
        'csgold': new Date('2025-07-27T06:00:00-04:00') // July 27, 2025 06:00 AM EST
    };

    // Update all countdowns every second
    const countdownInterval = setInterval(() => {
        const now = new Date();
        let allDone = true;
        
        // Update each game's countdown
        Object.entries(countdownTargets).forEach(([game, targetDate]) => {
            const gameContainer = document.getElementById(`${game}-leaderboard`);
            
            if (!gameContainer) return;
            
            // Check if we have a valid target date
            if (!targetDate) return;
            
            const distance = targetDate - now;
            
            // Get all countdown elements for this game
            const daysEl = gameContainer.querySelector('.countdown-value.days');
            const hoursEl = gameContainer.querySelector('.countdown-value.hours');
            const minutesEl = gameContainer.querySelector('.countdown-value.minutes');
            const secondsEl = gameContainer.querySelector('.countdown-value.seconds');
            const timerContainer = gameContainer.querySelector('.countdown-container');
            
            if (distance < 0) {
                // Countdown has ended
                if (timerContainer && game === currentGame) {
                    timerContainer.innerHTML = `
                        <div class="countdown-ended">
                            <i class="fas fa-flag-checkered"></i>
                            <h4>Leaderboard has ended!</h4>
                        </div>
                    `;
                }
                return;
            } else {
                allDone = false;
            }
            
            // Only update the active game's countdown for better performance
            if (game === currentGame) {
                // Calculate time units
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                // Update the countdown display
                if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
                if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
                if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
                if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
                
                // Add animation class to the seconds element for a tick effect
                if (secondsEl) {
                    secondsEl.classList.add('tick');
                    setTimeout(() => secondsEl.classList.remove('tick'), 300);
                }
            }
        });
        
        // Clear interval if all countdowns are done
        if (allDone) {
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    // Add CSS for the tick animation and coming soon styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes tick {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        .countdown-value.tick {
            animation: tick 0.3s ease;
        }
        
        /* Coming Soon Styles */
        .countdown-soon {
            text-align: center;
            padding: 2rem 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            max-width: 320px;
            margin: 0 auto;
        }
        
        .hourglass-container {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: var(--accent2);
            animation: pulse 2s infinite;
        }
        
        .soon-title {
            color: #fff;
            font-size: 1.8rem;
            margin: 0.5rem 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: linear-gradient(45deg, #fff, var(--accent2));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .soon-text {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1rem;
            margin: 0.5rem 0 0;
            line-height: 1.5;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
        }
        
        /* Countdown Ended Styles */
        .countdown-ended {
            text-align: center;
            padding: 1rem;
        }
        .countdown-ended i {
            font-size: 2rem;
            color: var(--accent2);
            margin-bottom: 0.5rem;
            display: block;
        }
        .countdown-ended h4 {
            color: #fff;
            margin: 0;
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
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

// The duplicate functions and variables have been removed as they are now handled by the main leaderboard logic

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize game-specific elements
    initializeGameElements();
    
    // Start the countdown timers
    updateCountdown();
    
    // Initial data load
    try {
        const initialData = await fetchLeaderboardData(currentGame);
        if (initialData && initialData.length > 0) {
            gameStates[currentGame].data = initialData;
            updateLeaderboard();
        }
    } catch (error) {
        console.error('Failed to load leaderboard data:', error);
        if (gameStates[currentGame].leaderboardBody) {
            gameStates[currentGame].leaderboardBody.innerHTML = '<div class="error-message">Failed to load leaderboard data. Please try again later.</div>';
        }
    }
    
    // Set up auto-refresh every 15 minutes (900,000 milliseconds)
    setInterval(async () => {
        try {
            const newData = await fetchLeaderboardData(currentGame);
            if (newData && newData.length > 0) {
                gameStates[currentGame].data = newData;
                updateLeaderboard();
            }
        } catch (error) {
            console.error('Error refreshing leaderboard data:', error);
        }
    }, 15 * 60 * 1000);
    
    // Set up event listeners for game tabs
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const game = tab.getAttribute('data-game');
            switchGameTab(game);
        });
    });
    
    // Set up escape key handler for search
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameStates[currentGame].searchQuery) {
            const state = gameStates[currentGame];
            if (state.searchInput) state.searchInput.value = '';
            state.searchQuery = '';
            if (state.clearSearchBtn) state.clearSearchBtn.classList.remove('visible');
            state.currentPage = 1;
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
