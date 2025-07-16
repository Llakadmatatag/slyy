// Particle Rain Effect
class ParticleRain {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.images = [];
        this.imagesLoaded = 0;
        this.imagesToLoad = 0;
        
        // Default options
        this.options = {
            particleCount: 100,
            colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead', '#ffcc5c', '#ff6f69'],
            minSize: 2,
            maxSize: 6,
            minSpeed: 1,
            maxSpeed: 3,
            useImages: false,
            imagePaths: [],
            imageSize: 30,
            ...options
        };
        
        this.particles = [];
        
        if (this.options.useImages && this.options.imagePaths.length > 0) {
            this.loadImages();
        } else {
            this.init();
        }
    }
    
    loadImages() {
        this.imagesToLoad = this.options.imagePaths.length;
        
        this.options.imagePaths.forEach((path, index) => {
            const img = new Image();
            img.onload = () => {
                this.images.push(img);
                this.imagesLoaded++;
                if (this.imagesLoaded === this.imagesToLoad) {
                    this.init();
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${path}`);
                this.imagesToLoad--;
                if (this.imagesLoaded === this.imagesToLoad) {
                    this.init();
                }
            };
            img.src = path;
        });
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Create particles
        this.createParticles();
        
        // Start animation
        this.animate();
    }
    
    resize() {
        // Set canvas size to window size
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Update canvas dimensions
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    createParticles() {
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        const imageChance = this.options.imageChance !== undefined ? this.options.imageChance : 0.1; // Default 10% if not specified
        const useImage = this.images.length > 0 && Math.random() > (1 - imageChance); // Use specified chance or default 10%
        const size = useImage ? 
            this.options.imageSize : 
            Math.random() * (this.options.maxSize - this.options.minSize) + this.options.minSize;
            
        // Determine if particle will be on left or right side (0 = left, 1 = right)
        const side = Math.floor(Math.random() * 2);
        // Use 25% of the screen width on each side
        const sideWidth = this.width * 0.25;
        
        const particle = {
            x: side === 0 ? 
                Math.random() * sideWidth : // Left side
                this.width - (Math.random() * sideWidth), // Right side
            y: -size,
            size: size,
            speed: Math.random() * (this.options.maxSpeed - this.options.minSpeed) + this.options.minSpeed,
            color: this.options.colors[Math.floor(Math.random() * this.options.colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            side: side, // Store which side the particle is on
            useImage: useImage,
            imageIndex: useImage ? Math.floor(Math.random() * this.images.length) : -1
        };
        
        // Make image particles a bit slower
        if (useImage) {
            particle.speed *= 0.7;
        }
        
        return particle;
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // Update position
            p.y += p.speed;
            p.rotation += p.rotationSpeed * 0.01;
            
            // Reset particle when it goes off screen
            if (p.y > this.height + p.size) {
                const idx = this.particles.indexOf(p);
                this.particles.splice(idx, 1);
                this.particles.push(this.createParticle());
                continue;
            }
            
            // Draw particle
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation * Math.PI / 180);
            
            if (p.useImage && p.imageIndex >= 0 && this.images[p.imageIndex]) {
                const img = this.images[p.imageIndex];
                const size = p.size;
                this.ctx.drawImage(img, -size/2, -size/2, size, size);
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            }
            
            this.ctx.restore();
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particle rain for leaderboard tabs
document.addEventListener('DOMContentLoaded', () => {
    // Initialize for Rust Magic tab
    const rustMagicRain = new ParticleRain('rust-magic-rain', {
        particleCount: 60, // Increased total particles
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeead', '#ffcc5c', '#ff6f69'],
        minSize: 2,
        maxSize: 6,
        minSpeed: 1,
        maxSpeed: 3,
        useImages: true,
        imagePaths: ['images/rust-magic-coin.svg'],
        imageSize: 30,
        imageChance: 0.3 // 30% chance for coin image
    });
    
    // Initialize for Upgrader tab
    const upgraderRain = new ParticleRain('upgrader-rain', {
        particleCount: 50, // Slightly reduced since we're using images which are more visible
        colors: ['#8a2be2', '#9370db', '#ba55d3', '#da70d6', '#ee82ee', '#dda0dd', '#d8bfd8'],
        minSize: 2,
        maxSize: 6,
        minSpeed: 1,
        maxSpeed: 3,
        useImages: true,
        imagePaths: ['images/upgrader-decor7.webp'],
        imageSize: 100
    });

    // Initialize for CSGold tab
    const csgoldRain = new ParticleRain('csgold-rain', {
        particleCount: 55,
        colors: ['#ffd700', '#daa520', '#ffa500', '#ff8c00', '#ffb90f', '#eec900', '#cdad00'],
        minSize: 2,
        maxSize: 6,
        minSpeed: 1,
        maxSpeed: 3,
        useImages: true,
        imagePaths: ['images/csgold-logo.png'],
        imageSize: 40,
        imageChance: 0.25 // 25% chance for coin image
    });

    // Handle tab switching
    const tabs = document.querySelectorAll('.game-tab');
    const rainContainers = document.querySelectorAll('.fullscreen-rain-container');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const game = tab.getAttribute('data-game');
            rainContainers.forEach(container => {
                container.style.display = 'none';
            });
            
            const activeRain = document.querySelector(`#${game}-rain`);
            if (activeRain) {
                activeRain.parentElement.style.display = 'block';
            }
        });
    });
});
