// Loading Screen Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create loading screen elements
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    
    loadingScreen.innerHTML = `
        <img src="images/logo.webp" alt="BetSlyy Loading" class="loading-logo">
        <div class="loading-text">Loading...</div>
        <div class="loading-bar-container">
            <div class="loading-bar"></div>
        </div>
        <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    
    // Add loading screen to the body
    document.body.prepend(loadingScreen);
    
    // Simulate loading progress
    const loadingBar = document.querySelector('.loading-bar');
    const loadingText = document.querySelector('.loading-text');
    let progress = 0;
    const loadingMessages = [
        'Preparing your experience...',
        'Loading content...',
        'Almost there...',
        'Getting things ready...'
    ];
    
    const loadingInterval = setInterval(() => {
        // Update progress
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        loadingBar.style.width = `${progress}%`;
        
        // Update loading text randomly
        if (Math.random() < 0.1) {
            const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
            loadingText.textContent = randomMessage;
        }
        
        // When loading is complete
        if (progress >= 100) {
            clearInterval(loadingInterval);
            loadingText.textContent = 'Ready!';
            
            // Fade out loading screen
            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                
                // Remove loading screen after fade out
                setTimeout(() => {
                    loadingScreen.remove();
                }, 500);
            }, 500);
        }
    }, 150);
    
    // Ensure loading screen is removed if JavaScript takes too long
    setTimeout(() => {
        if (document.querySelector('.loading-screen')) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }, 10000); // 10 second timeout as a fallback
});
